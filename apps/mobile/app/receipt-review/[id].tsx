import {
  ApiRequestError,
  itemCategories,
  itemQuantityUnits,
  type AuthenticatedUserContext,
  type ItemCategoryId,
  type ReceiptReview,
} from '@sackerl/api-client';
import { categoryMeta } from '@sackerl/ui';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, nativeFont, space } from '@sackerl/tokens';
import { useAuthSession } from '../../lib/auth-session';
import {
  buildSaveReceiptReviewInput,
  createManualClientLineId,
  createManualReceiptReviewLine,
  createReceiptReviewDraft,
  includedLineCount,
  lineKey,
  formatReceiptExpiryDate,
  normaliseReceiptExpiryDate,
  reviewNeedsAttention,
  setDraftLineIncluded,
  setDraftLineReviewState,
  type ReceiptReviewDraftLine,
  type ReceiptReviewDraftError,
  updateDraftLine,
  updateDraftLineExpiry,
  validateReceiptReviewDraft,
} from '../../lib/receipt-review';
import { getMobileProfileClient } from '../../lib/profile';
import { getMobileReceiptsClient } from '../../lib/receipts';

type LoadState = 'error' | 'loading' | 'ready' | 'unavailable';

const fontFamily =
  Platform.OS === 'ios'
    ? nativeFont.ios
    : Platform.OS === 'android'
      ? nativeFont.android
      : nativeFont.fallback;

function contextFromSession(
  session: ReturnType<typeof useAuthSession>['session'],
): AuthenticatedUserContext | null {
  if (!session?.user) {
    return null;
  }

  return {
    accessToken: session.access_token,
    user: { email: session.user.email, id: session.user.id },
  };
}

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function formatReceiptDate(value: string | null): string {
  if (!value) return 'Date unavailable';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

function formatTotal(review: ReceiptReview): string {
  if (review.receipt.totalCents == null) return 'Total unavailable';
  return new Intl.NumberFormat('en-AT', {
    currency: review.receipt.currency || 'EUR',
    style: 'currency',
  }).format(review.receipt.totalCents / 100);
}

function expirySummary(line: ReceiptReviewDraftLine): string {
  if (line.expiryState === 'no_date') return 'no expiry date';
  if (line.expiryState === 'dated') {
    return normaliseReceiptExpiryDate(line.expiryDateInput)
      ? formatReceiptExpiryDate(
          line.expiryDateInput,
          Intl.DateTimeFormat().resolvedOptions().locale,
        )
      : 'date needs checking';
  }
  return 'expiry unknown';
}

function ChevronLeftIcon(): JSX.Element {
  return <Text style={styles.chevron}>‹</Text>;
}

function CategoryTile({ category }: { readonly category: ItemCategoryId | null }): JSX.Element {
  const meta = categoryMeta[category ?? 'pantry'];
  return (
    <View style={[styles.categoryTile, { backgroundColor: meta.bg }]}>
      <Text style={[styles.categoryTileText, { color: meta.ink }]}>
        {category ? meta.short : '?'}
      </Text>
    </View>
  );
}

function DraftErrorText({
  error,
}: {
  readonly error: ReceiptReviewDraftError | undefined;
}): JSX.Element | null {
  return error ? <Text style={styles.fieldError}>{error.message}</Text> : null;
}

export default function ReceiptReviewRoute(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const receiptId = useMemo(() => paramValue(params.id), [params.id]);
  const { session, status: authStatus } = useAuthSession();
  const context = useMemo(
    () => contextFromSession(session),
    [session?.access_token, session?.user?.id, session?.user?.email],
  );
  const scope = `${session?.user?.id ?? ''}:${receiptId}`;
  const token = session?.access_token ?? '';
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const initializedScopeRef = useRef<string | null>(null);
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const requestRef = useRef(0);
  const savingRef = useRef(false);
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [draft, setDraft] = useState<ReceiptReviewDraftLine[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [review, setReview] = useState<ReceiptReview | null>(null);
  const reviewRef = useRef(review);
  reviewRef.current = review;
  const [saveState, setSaveState] = useState<'idle' | 'saving'>('idle');
  const [selectedLineKey, setSelectedLineKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [validationErrors, setValidationErrors] = useState<readonly ReceiptReviewDraftError[]>([]);
  const [uncertainSave, setUncertainSave] = useState(false);
  const savedDraftRef = useRef('');
  const draftSnapshot = JSON.stringify(draft);
  const hasUnsavedChanges = Boolean(draft.length) && draftSnapshot !== savedDraftRef.current;

  const loadReview = useCallback(async () => {
    if (savingRef.current) return;
    if (!context || !receiptId) {
      setLoadState('unavailable');
      return;
    }
    const requestId = ++requestRef.current;
    const current = () =>
      requestId === requestRef.current && scopeRef.current === scope && tokenRef.current === token;
    setLoadState('loading');
    setStatusMessage(undefined);
    try {
      const household = await getMobileProfileClient().getHousehold(context);
      if (!current()) return;
      if (!household) throw new Error('Household not found.');
      const nextReview = await getMobileReceiptsClient().getReceiptReview(context, {
        householdId: household.id,
        receiptId,
      });
      if (!current()) return;
      setReview(nextReview);
      const nextDraft = createReceiptReviewDraft(nextReview);
      setDraft(nextDraft);
      savedDraftRef.current = JSON.stringify(nextDraft);
      setLoadedScope(scope);
      setSelectedLineKey(null);
      setValidationErrors([]);
      setConflict(false);
      setUncertainSave(false);
      setLoadState('ready');
    } catch (error) {
      if (!current()) return;
      setLoadState(reviewRef.current ? 'ready' : 'error');
      setStatusMessage(
        error instanceof Error ? error.message : 'Unable to load this receipt review.',
      );
    }
  }, [context, receiptId, scope, token]);

  useEffect(() => {
    navigation.setOptions({ headerBackButtonMenuEnabled: false });
  }, [navigation]);

  usePreventRemove(
    loadedScope === scope &&
      (hasUnsavedChanges || uncertainSave || conflict || saveState === 'saving'),
    ({ data }) => {
      if (savingRef.current) {
        Alert.alert('Saving review', 'Please wait for the save result before leaving.');
        return;
      }
      const reloadLatestOnExit = () => {
        if (scopeRef.current === scope) void loadReview();
      };
      const discardForExit = () => {
        if (scopeRef.current === scope && !savingRef.current) navigation.dispatch(data.action);
      };
      Alert.alert(
        'Leave this review?',
        'Your latest receipt review changes are not confirmed saved.',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Reload latest',
            onPress: reloadLatestOnExit,
          },
          {
            text: 'Discard changes',
            style: 'destructive',
            // Re-dispatch the original action; usePreventRemove permits this action to continue.
            onPress: discardForExit,
          },
        ],
      );
    },
  );

  useEffect(() => {
    ++requestRef.current;
    if (initializedScopeRef.current === scope && reviewRef.current && context) {
      if (savingRef.current) {
        setUncertainSave(true);
        setStatusMessage(
          'Your session refreshed during the save. Your edits are still here. Reload latest to reconcile before leaving.',
        );
      }
      savingRef.current = false;
      setSaveState('idle');
      setLoadState('ready');
      return () => {
        ++requestRef.current;
      };
    }
    initializedScopeRef.current = scope;
    savingRef.current = false;
    setSaveState('idle');
    setReview(null);
    setDraft([]);
    setLoadedScope(null);
    setSelectedLineKey(null);
    setConflict(false);
    setUncertainSave(false);
    savedDraftRef.current = '';
    setValidationErrors([]);
    if (authStatus === 'loading') setLoadState('loading');
    else if (!context || !receiptId) {
      setLoadState('unavailable');
      setStatusMessage(context ? 'The receipt ID is missing.' : 'Sign in to review this receipt.');
    } else void loadReview();
    return () => {
      ++requestRef.current;
    };
  }, [authStatus, context, receiptId, loadReview, scope]);

  function reloadReview() {
    if (savingRef.current) return;
    Alert.alert(
      'Reload review?',
      'This replaces your unsaved edits with the latest saved review.',
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Reload',
          style: 'destructive',
          onPress: () => {
            if (scopeRef.current === scope) void loadReview();
          },
        },
      ],
    );
  }

  const selectedLine = useMemo(
    () => draft.find((line) => lineKey(line) === selectedLineKey) ?? null,
    [draft, selectedLineKey],
  );
  const canAddManualLine = Boolean(review?.receipt.activeParseGenerationId) && draft.length < 150;
  const hasGeneration = Boolean(review?.receipt.activeParseGenerationId);
  const unresolved = reviewNeedsAttention(draft);
  const includedCount = includedLineCount(draft);

  function updateLine(
    key: string,
    patch: Partial<
      Pick<ReceiptReviewDraftLine, 'categoryId' | 'name' | 'qtyUnit' | 'qtyValueText'>
    >,
  ) {
    if (savingRef.current) return;
    setDraft((lines) => updateDraftLine(lines, key, patch));
    setValidationErrors([]);
  }

  function updateLineExpiry(
    key: string,
    state: ReceiptReviewDraftLine['expiryState'],
    dateInput?: string,
  ) {
    if (savingRef.current) return;
    setDraft((lines) => updateDraftLineExpiry(lines, key, state, dateInput));
    setValidationErrors((errors) => errors.filter((error) => error.lineKey !== key));
    setStatusMessage(undefined);
  }

  function handleAddManualLine() {
    if (!canAddManualLine || savingRef.current) return;
    const id = createManualClientLineId();
    setDraft((lines) => [...lines, createManualReceiptReviewLine(id)]);
    setSelectedLineKey(id);
    setStatusMessage(undefined);
  }

  async function handleSaveReview() {
    if (
      !review ||
      !hasGeneration ||
      savingRef.current ||
      loadedScope !== scope ||
      scopeRef.current !== scope
    )
      return;
    const validation = validateReceiptReviewDraft(draft);
    setValidationErrors(validation.errors);
    if (!validation.valid) {
      setStatusMessage(
        'Complete every line before saving. Excluded lines still need valid details.',
      );
      setSelectedLineKey(validation.errors[0]?.lineKey ?? null);
      return;
    }
    if (draft.length < 1) {
      setStatusMessage('Add at least one item before saving the receipt review.');
      return;
    }
    if (!context) {
      setStatusMessage('Your session is no longer available. Sign in again before saving.');
      return;
    }
    const requestId = ++requestRef.current;
    const current = () =>
      requestRef.current === requestId && scopeRef.current === scope && tokenRef.current === token;
    savingRef.current = true;
    setSaveState('saving');
    setStatusMessage(undefined);
    setConflict(false);
    setUncertainSave(false);
    try {
      const household = await getMobileProfileClient().getHousehold(context);
      if (!current()) return;
      if (!household) throw new Error('Household not found.');
      const payload = buildSaveReceiptReviewInput({
        draft,
        expectedReviewRevision: review.receipt.reviewRevision,
        generationId: review.receipt.activeParseGenerationId as string,
        householdId: household.id,
        receiptId: review.receipt.id,
      });
      const saved = await getMobileReceiptsClient().saveReceiptReview(context, payload);
      if (!current()) return;
      setReview(saved);
      const nextDraft = createReceiptReviewDraft(saved);
      setDraft(nextDraft);
      savedDraftRef.current = JSON.stringify(nextDraft);
      setValidationErrors([]);
      setUncertainSave(false);
      setStatusMessage('Review saved. Items are not in stock yet.');
    } catch (error) {
      if (!current()) return;
      if (error instanceof ApiRequestError && error.status === 409) {
        setConflict(true);
        setStatusMessage(
          'This receipt changed elsewhere. Your edits are still here; reload to see the latest review.',
        );
      } else {
        setUncertainSave(true);
        setStatusMessage(
          `${error instanceof Error ? error.message : 'Unable to save this review.'} Your edits are still here. Reload latest to reconcile before leaving.`,
        );
      }
    } finally {
      if (current()) {
        savingRef.current = false;
        setSaveState('idle');
      }
    }
  }

  function errorFor(
    key: string,
    field: ReceiptReviewDraftError['field'],
  ): ReceiptReviewDraftError | undefined {
    return validationErrors.find((error) => error.lineKey === key && error.field === field);
  }

  function handleDoneForNow() {
    if (!canDoneForNow || savingRef.current) return;
    router.replace('/(tabs)');
  }

  const canDoneForNow = Boolean(
    review &&
    loadedScope === scope &&
    loadState === 'ready' &&
    review.receipt.reviewRevision > 0 &&
    !hasUnsavedChanges &&
    !uncertainSave &&
    !conflict &&
    saveState === 'idle',
  );

  if (
    authStatus === 'loading' ||
    loadState === 'loading' ||
    (loadState === 'ready' && loadedScope !== scope)
  ) {
    return (
      <StateCard title="Loading receipt review" body="Getting the latest receipt lines." busy />
    );
  }

  if (loadState === 'unavailable') {
    return (
      <StateCard
        title="Review unavailable"
        body={statusMessage ?? 'Sign in to review this receipt.'}
        actionLabel="Back"
        onAction={() => router.back()}
      />
    );
  }

  if (loadState === 'error') {
    return (
      <StateCard
        title="Could not load review"
        body={statusMessage ?? 'Try again.'}
        actionLabel="Retry loading review"
        onAction={() => void loadReview()}
      />
    );
  }

  if (!review) {
    return (
      <StateCard
        title="Review unavailable"
        body="This receipt review is not ready yet."
        actionLabel="Back"
        onAction={() => router.back()}
      />
    );
  }

  if (!hasGeneration) {
    return (
      <StateCard
        title={
          review.receipt.status === 'failed' ? "We couldn't read this receipt" : 'Review not ready'
        }
        body={
          review.receipt.status === 'failed'
            ? 'Add groceries by hand, or refresh to check again.'
            : 'There are no parsed lines to review yet. You can refresh or add groceries by hand.'
        }
        actionLabel="Refresh review"
        onAction={() => void loadReview()}
        secondaryLabel="Add groceries by hand"
        onSecondary={() => router.push('/add-item')}
      />
    );
  }

  const confidentCount = draft.filter(
    (line) => line.confidenceLevel === 'high' || line.confidenceLevel === 'mid',
  ).length;
  const needsReviewCount = draft.filter(
    (line) => line.included && line.reviewState !== 'reviewed',
  ).length;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView
        pointerEvents={saveState === 'saving' ? 'none' : 'auto'}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 16) + 180,
          paddingTop: Math.max(insets.top, 42) + 8,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Back from receipt review"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeftIcon />
          </Pressable>
          <Text style={styles.stepText}>STEP 2 OF 3</Text>
          <Pressable
            accessibilityLabel="Reload receipt review"
            accessibilityRole="button"
            onPress={reloadReview}
            style={styles.reloadButton}
          >
            <Text style={styles.reloadText}>↻</Text>
          </Pressable>
        </View>

        <View style={styles.headerBlock}>
          <Text style={styles.title}>
            Review <Text style={styles.titleItalic}>{draft.length} items</Text>
          </Text>
          <Text style={styles.subtitle}>
            {review.receipt.storeName ?? 'Receipt'} ·{' '}
            {formatReceiptDate(review.receipt.purchasedOn)} · {formatTotal(review)}
          </Text>
          <Text style={styles.evidenceNote}>
            Confidence helps you scan. It never approves a line for you.
          </Text>
        </View>

        <View style={styles.chipRow}>
          <View style={styles.sageChip}>
            <Text style={styles.sageChipText}>✓ {confidentCount} confident</Text>
          </View>
          <View style={styles.amberChip}>
            <Text style={styles.amberChipText}>{needsReviewCount} needs review</Text>
          </View>
        </View>

        {conflict ? (
          <View style={styles.conflictCard}>
            <Text style={styles.conflictText}>{statusMessage}</Text>
            <Pressable accessibilityRole="button" onPress={reloadReview}>
              <Text style={styles.conflictAction}>Reload latest review</Text>
            </Pressable>
          </View>
        ) : null}
        {statusMessage && !conflict ? (
          <Text accessibilityLiveRegion="polite" style={styles.statusText}>
            {statusMessage}
          </Text>
        ) : null}

        {draft.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptyBody}>
              Add the groceries you want to keep from this receipt.
            </Text>
            {canAddManualLine ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleAddManualLine}
                style={styles.addRow}
              >
                <Text style={styles.addRowText}>＋ Add missing item</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.listCard}>
            {draft.map((line) => {
              const key = lineKey(line);
              const lineNeedsReview = line.reviewState !== 'reviewed';
              return (
                <View
                  key={key}
                  style={[styles.lineRow, !line.included ? styles.lineRowExcluded : null]}
                >
                  <Pressable
                    accessibilityLabel={`Edit ${line.name || 'receipt item'}`}
                    accessibilityRole="button"
                    onPress={() => setSelectedLineKey(key)}
                    style={styles.lineMain}
                  >
                    <CategoryTile category={line.categoryId} />
                    <View style={styles.lineCopy}>
                      <Text numberOfLines={1} style={styles.lineName}>
                        {line.name || 'Unnamed item'}
                        {lineNeedsReview ? <Text style={styles.reviewDot}> · check</Text> : null}
                      </Text>
                      <Text numberOfLines={1} style={styles.rawText}>
                        {line.rawText ??
                          (line.source === 'manual' ? 'Added manually' : 'No parser text')}
                      </Text>
                      <Text style={styles.lineMeta}>
                        {line.qtyValueText || '—'} {line.qtyUnit ?? 'unit'} ·{' '}
                        {line.included ? 'included' : 'excluded'} · {expirySummary(line)}
                      </Text>
                    </View>
                  </Pressable>
                  <View style={styles.lineActions}>
                    <Pressable
                      accessibilityLabel={
                        line.included
                          ? `Exclude ${line.name || 'item'}`
                          : `Include ${line.name || 'item'}`
                      }
                      accessibilityRole="button"
                      disabled={saveState === 'saving'}
                      onPress={() => {
                        if (!savingRef.current)
                          setDraft((lines) => setDraftLineIncluded(lines, key, !line.included));
                      }}
                      style={styles.smallAction}
                    >
                      <Text style={styles.smallActionText}>
                        {line.included ? 'Exclude' : 'Include'}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityLabel={
                        lineNeedsReview
                          ? `Mark ${line.name || 'item'} reviewed`
                          : `Mark ${line.name || 'item'} needs review`
                      }
                      accessibilityRole="button"
                      disabled={saveState === 'saving'}
                      onPress={() => {
                        if (!savingRef.current)
                          setDraft((lines) =>
                            setDraftLineReviewState(
                              lines,
                              key,
                              lineNeedsReview ? 'reviewed' : 'unresolved',
                            ),
                          );
                      }}
                      style={[
                        styles.reviewButton,
                        lineNeedsReview ? styles.reviewButtonAmber : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.reviewButtonText,
                          lineNeedsReview ? styles.reviewButtonTextAmber : null,
                        ]}
                      >
                        {lineNeedsReview ? 'Mark reviewed' : 'Reviewed'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
            {canAddManualLine ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleAddManualLine}
                style={styles.addRow}
              >
                <Text style={styles.addRowText}>＋ Add missing item</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <View style={styles.placementCard}>
          <Text style={styles.placementTitle}>Placement comes next</Text>
          <Text style={styles.placementBody}>
            {includedCount > 0
              ? 'Save your review first. Storage placement is not available yet.'
              : 'No items to place. You can still save this review.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            disabled
            style={styles.disabledPlacement}
          >
            <Text style={styles.disabledPlacementText}>Continue to placement</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.stickyActions, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: saveState === 'saving' }}
          disabled={saveState === 'saving'}
          onPress={() => void handleSaveReview()}
          style={[styles.saveButton, saveState === 'saving' ? styles.buttonDisabled : null]}
        >
          {saveState === 'saving' ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Text style={styles.saveButtonText}>
              {unresolved ? 'Save review draft' : 'Save review'}
            </Text>
          )}
        </Pressable>
        <Text style={styles.stickyHint}>
          {unresolved
            ? 'Review each included line before placement.'
            : 'Your corrections will be saved to this receipt.'}
        </Text>
        {canDoneForNow ? (
          <Pressable
            accessibilityHint="Returns to Home. This receipt is saved, but its items are not in stock."
            accessibilityRole="button"
            onPress={handleDoneForNow}
            style={styles.doneForNowButton}
          >
            <Text style={styles.doneForNowText}>Done for now</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={selectedLine != null}
        onRequestClose={() => setSelectedLineKey(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 12) }}
            style={styles.modalCard}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {selectedLine?.source === 'manual' ? 'Add item' : 'Edit item'}
            </Text>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              accessibilityLabel="Receipt item name"
              autoCapitalize="words"
              onChangeText={(value) =>
                selectedLine && updateLine(lineKey(selectedLine), { name: value })
              }
              placeholder="e.g. Milk"
              placeholderTextColor={colors.muteSoft}
              style={styles.input}
              value={selectedLine?.name ?? ''}
            />
            <Text style={styles.fieldLabel}>Quantity</Text>
            <View style={styles.quantityRow}>
              <TextInput
                accessibilityLabel="Receipt item quantity"
                keyboardType="decimal-pad"
                onChangeText={(value) =>
                  selectedLine && updateLine(lineKey(selectedLine), { qtyValueText: value })
                }
                placeholder="1"
                placeholderTextColor={colors.muteSoft}
                style={[styles.input, styles.quantityInput]}
                value={selectedLine?.qtyValueText ?? ''}
              />
              <ScrollView
                contentContainerStyle={styles.unitRow}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {itemQuantityUnits.map((unit) => (
                  <Pressable
                    accessibilityLabel={`Unit ${unit}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedLine?.qtyUnit === unit }}
                    key={unit}
                    onPress={() =>
                      selectedLine && updateLine(lineKey(selectedLine), { qtyUnit: unit })
                    }
                    style={[
                      styles.unitChip,
                      selectedLine?.qtyUnit === unit ? styles.unitChipSelected : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.unitChipText,
                        selectedLine?.qtyUnit === unit ? { color: colors.bg } : null,
                      ]}
                    >
                      {unit}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView
              contentContainerStyle={styles.categoryRow}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {itemCategories.map((category) => (
                <Pressable
                  accessibilityLabel={`Category ${category.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedLine?.categoryId === category.id }}
                  key={category.id}
                  onPress={() =>
                    selectedLine && updateLine(lineKey(selectedLine), { categoryId: category.id })
                  }
                  style={[
                    styles.categoryChoice,
                    selectedLine?.categoryId === category.id ? styles.categoryChoiceSelected : null,
                  ]}
                >
                  <CategoryTile category={category.id} />
                  <Text style={styles.categoryChoiceText}>{category.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.fieldLabel}>Expiry</Text>
            <Text style={styles.expiryHelp}>
              Optional. Add a date only if you know it. Receipt purchase dates do not set expiry.
            </Text>
            <View
              accessibilityLabel="Expiry date choice"
              accessibilityRole="radiogroup"
              style={styles.expiryChoices}
            >
              {(
                [
                  ['unknown', 'Unknown'],
                  ['dated', 'Has a date'],
                  ['no_date', 'No expiry date'],
                ] as const
              ).map(([state, label]) => (
                <Pressable
                  accessibilityHint={
                    state === 'no_date'
                      ? 'Record this item with no expiry date. If you do not know the date or have not checked it, choose Unknown.'
                      : state === 'unknown'
                        ? 'The date has not been entered or is not known.'
                        : 'Enter a calendar date for this item.'
                  }
                  accessibilityLabel={label}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: selectedLine?.expiryState === state,
                    selected: selectedLine?.expiryState === state,
                  }}
                  key={state}
                  onPress={() => selectedLine && updateLineExpiry(lineKey(selectedLine), state)}
                  style={[
                    styles.expiryChoice,
                    selectedLine?.expiryState === state ? styles.expiryChoiceSelected : null,
                  ]}
                >
                  <Text style={styles.expiryChoiceText}>{label}</Text>
                </Pressable>
              ))}
            </View>
            {selectedLine?.expiryState === 'no_date' ? (
              <Text style={styles.expiryHelp}>
                Record this item with no expiry date. If you do not know the date or have not
                checked it, choose Unknown.
              </Text>
            ) : null}
            {selectedLine?.expiryState === 'dated' ? (
              <>
                <TextInput
                  accessibilityHint="Enter a real calendar date as four digit year, two digit month, and two digit day. Past dates are allowed."
                  accessibilityLabel="Optional expiry date, year month day"
                  autoCapitalize="none"
                  keyboardType="numbers-and-punctuation"
                  onChangeText={(value) =>
                    selectedLine && updateLineExpiry(lineKey(selectedLine), 'dated', value)
                  }
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muteSoft}
                  style={styles.input}
                  value={selectedLine.expiryDateInput}
                />
                {normaliseReceiptExpiryDate(selectedLine.expiryDateInput) ? (
                  <Text style={styles.expiryHelp}>
                    {formatReceiptExpiryDate(
                      selectedLine.expiryDateInput,
                      Intl.DateTimeFormat().resolvedOptions().locale,
                    )}
                  </Text>
                ) : null}
              </>
            ) : null}
            {selectedLine ? (
              <View style={styles.modalErrors}>
                <DraftErrorText error={errorFor(lineKey(selectedLine), 'name')} />
                <DraftErrorText error={errorFor(lineKey(selectedLine), 'qtyValue')} />
                <DraftErrorText error={errorFor(lineKey(selectedLine), 'qtyUnit')} />
                <DraftErrorText error={errorFor(lineKey(selectedLine), 'categoryId')} />
                <DraftErrorText error={errorFor(lineKey(selectedLine), 'expiry')} />
              </View>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedLineKey(null)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Close</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (selectedLine)
                    setDraft((lines) =>
                      setDraftLineReviewState(lines, lineKey(selectedLine), 'reviewed'),
                    );
                  setSelectedLineKey(null);
                }}
                style={styles.modalSaveButton}
              >
                <Text style={styles.modalSaveText}>Mark reviewed</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function StateCard(props: {
  readonly actionLabel?: string;
  readonly body: string;
  readonly busy?: boolean;
  readonly onAction?: () => void;
  readonly onSecondary?: () => void;
  readonly secondaryLabel?: string;
  readonly title: string;
}): JSX.Element {
  return (
    <View style={styles.stateScreen}>
      <View style={styles.stateCard}>
        {props.busy ? <ActivityIndicator color={colors.sageDeep} /> : null}
        <Text style={styles.stateTitle}>{props.title}</Text>
        <Text style={styles.stateBody}>{props.body}</Text>
        {props.actionLabel && props.onAction ? (
          <Pressable accessibilityRole="button" onPress={props.onAction} style={styles.stateAction}>
            <Text style={styles.stateActionText}>{props.actionLabel}</Text>
          </Pressable>
        ) : null}
        {props.secondaryLabel && props.onSecondary ? (
          <Pressable
            accessibilityRole="button"
            onPress={props.onSecondary}
            style={styles.stateSecondary}
          >
            <Text style={styles.stateSecondaryText}>{props.secondaryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addRow: {
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderWidth: 1,
    margin: space[3],
    padding: space[3],
  },
  addRowText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  amberChip: {
    backgroundColor: colors.amberSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  amberChipText: {
    color: colors.amberDeep,
    fontFamily: fontFamily.mono,
    fontSize: 11,
    fontWeight: '700',
  },
  backButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  buttonDisabled: { opacity: 0.58 },
  cancelButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    height: 50,
    justifyContent: 'center',
  },
  cancelText: { color: colors.mute, fontFamily: fontFamily.sans, fontSize: 15, fontWeight: '700' },
  categoryChoice: {
    alignItems: 'center',
    backgroundColor: colors.bgWarm,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    marginRight: 8,
    padding: 8,
    width: 94,
  },
  categoryChoiceSelected: { borderColor: colors.ink, borderWidth: 2 },
  categoryChoiceText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  categoryRow: { paddingBottom: 4 },
  doneForNowButton: {
    alignItems: 'center',
    borderColor: colors.sageDeep,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 46,
  },
  doneForNowText: {
    color: colors.sageDeep,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '800',
  },
  expiryChoice: {
    alignItems: 'center',
    backgroundColor: colors.bgWarm,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 7,
    paddingVertical: 8,
  },
  expiryChoiceSelected: {
    backgroundColor: colors.sageSoft,
    borderColor: colors.sageDeep,
    borderWidth: 2,
  },
  expiryChoices: { flexDirection: 'row', gap: 7, marginBottom: 8 },
  expiryChoiceText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  expiryHelp: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  categoryTile: {
    alignItems: 'center',
    borderRadius: 11,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  categoryTileText: { fontFamily: fontFamily.mono, fontSize: 10, fontWeight: '700' },
  chevron: { color: colors.ink, fontFamily: fontFamily.sans, fontSize: 32, lineHeight: 34 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: space[4], marginTop: space[3] },
  conflictAction: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
  },
  conflictCard: {
    backgroundColor: colors.amberSoft,
    borderColor: colors.amber,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  conflictText: {
    color: colors.kraftInk,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  disabledPlacement: {
    alignItems: 'center',
    backgroundColor: colors.borderSoft,
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    marginTop: 12,
  },
  disabledPlacementText: {
    color: colors.muteSoft,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyBody: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyCard: { backgroundColor: colors.card, borderRadius: 16, padding: 28 },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  evidenceNote: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
  },
  fieldError: {
    color: colors.amberDeep,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  fieldLabel: {
    color: colors.inkSoft,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
    marginTop: 14,
  },
  headerBlock: { marginTop: space[4] },
  input: {
    backgroundColor: colors.bgWarm,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 16,
    height: 48,
    paddingHorizontal: 13,
  },
  lineActions: { alignItems: 'flex-end', gap: 8, marginLeft: 6 },
  lineCopy: { flex: 1, marginLeft: 10, minWidth: 0 },
  lineMeta: { color: colors.mute, fontFamily: fontFamily.mono, fontSize: 11, marginTop: 3 },
  lineName: { color: colors.ink, fontFamily: fontFamily.sans, fontSize: 15, fontWeight: '800' },
  lineMain: { alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0 },
  lineRow: {
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  lineRowExcluded: { opacity: 0.55 },
  listCard: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalBackdrop: { backgroundColor: 'rgba(27, 36, 24, 0.34)', flex: 1, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    padding: 20,
  },
  modalErrors: { marginTop: 6 },
  modalHandle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 5,
    marginBottom: 14,
    width: 44,
  },
  modalSaveButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 999,
    flex: 1,
    height: 50,
    justifyContent: 'center',
  },
  modalSaveText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '800',
  },
  modalTitle: { color: colors.ink, fontFamily: fontFamily.sans, fontSize: 22, fontWeight: '800' },
  placementBody: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  placementCard: {
    backgroundColor: colors.kraftSoft,
    borderRadius: 16,
    marginTop: 16,
    padding: 16,
  },
  placementTitle: {
    color: colors.kraftInk,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    fontWeight: '800',
  },
  quantityInput: { flex: 0, width: 86 },
  quantityRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  rawText: { color: colors.muteSoft, fontFamily: fontFamily.mono, fontSize: 11, marginTop: 3 },
  reloadButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  reloadText: { color: colors.ink, fontSize: 25 },
  reviewButton: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: colors.sageSoft,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  reviewButtonAmber: { backgroundColor: colors.amberSoft },
  reviewButtonText: {
    color: colors.sageDeep,
    fontFamily: fontFamily.sans,
    fontSize: 10,
    fontWeight: '800',
  },
  reviewButtonTextAmber: { color: colors.amberDeep },
  reviewDot: {
    color: colors.amberDeep,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '700',
  },
  sageChip: {
    backgroundColor: colors.sageSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sageChipText: {
    color: colors.sageDeep,
    fontFamily: fontFamily.mono,
    fontSize: 11,
    fontWeight: '700',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 999,
    height: 52,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    fontWeight: '800',
  },
  screen: { backgroundColor: colors.bg, flex: 1 },
  smallAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 3 },
  smallActionText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 10,
    fontWeight: '700',
  },
  stateAction: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 999,
    height: 52,
    justifyContent: 'center',
    marginTop: 18,
    paddingHorizontal: 24,
  },
  stateActionText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    fontWeight: '800',
  },
  stateBody: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    margin: 22,
    padding: 28,
  },
  stateScreen: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: 'center',
  },
  stateSecondary: { marginTop: 14, padding: 8 },
  stateSecondaryText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '700',
  },
  stateTitle: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 23,
    fontWeight: '800',
    marginTop: 10,
    textAlign: 'center',
  },
  statusText: {
    color: colors.sageDeep,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  stepText: {
    color: colors.mute,
    flex: 1,
    fontFamily: fontFamily.mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  stickyActions: {
    backgroundColor: 'rgba(252, 253, 250, 0.97)',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
  },
  stickyHint: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 11,
    marginTop: 7,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 31,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titleItalic: { fontStyle: 'italic' },
  topBar: { alignItems: 'center', flexDirection: 'row' },
  unitChip: {
    backgroundColor: colors.bgWarm,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 6,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  unitChipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  unitChipText: {
    color: colors.inkSoft,
    fontFamily: fontFamily.mono,
    fontSize: 12,
    fontWeight: '700',
  },
  unitRow: { paddingRight: 2 },
});
