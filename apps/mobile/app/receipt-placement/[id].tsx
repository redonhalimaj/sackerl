import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthenticatedUserContext, ReceiptPlacement } from '@sackerl/api-client';
import { colors, nativeFont } from '@sackerl/tokens';
import { categoryMeta } from '@sackerl/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthSession } from '../../lib/auth-session';
import { getMobileItemsClient } from '../../lib/items';
import { finalizeWithFaultInjection } from '../../lib/placement-fault-injection';
import { showPlacementToast } from '../../lib/placement-toast';
import { getMobileProfileClient } from '../../lib/profile';
import {
  attemptMatchesReview,
  autoSortCount,
  canSubmit,
  initialPlacementState,
  linesInZone,
  parsePersistedAttempt,
  pendingAttemptStorageKey,
  placedCountCopy,
  placementLinesFromReview,
  placementReducer,
  placementReviewRef,
  placementZonesFromStorage,
  suggestZone,
  unplacedLines,
  type PlacementAction,
  type PlacementLine,
  type PlacementReviewRef,
  type PlacementState,
  type PlacementZone,
} from '../../lib/receipt-placement';
import { getMobileReceiptsClient } from '../../lib/receipts';

const fontFamily = Platform.OS === 'ios' ? nativeFont.ios.sans : nativeFont.android.sans;

type LoadState = 'loading' | 'ready' | 'error' | 'unavailable' | 'notPlaceable';

type Loaded = {
  readonly context: AuthenticatedUserContext;
  readonly householdId: string;
  readonly review: PlacementReviewRef;
  readonly storageKey: string;
};

type ZoneRect = {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
};

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function newIdempotencyKey(): string {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  // RFC 4122 v4 fallback for runtimes without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

async function clearPending(storageKey: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(storageKey);
  } catch {
    // Storage is best-effort; the server key check still prevents duplicates.
  }
}

export default function ReceiptPlacementRoute(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const receiptId = useMemo(() => paramValue(params.id), [params.id]);
  const { session, status: authStatus } = useAuthSession();
  const userId = session?.user?.id ?? '';
  const token = session?.access_token ?? '';

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadMessage, setLoadMessage] = useState<string | undefined>();
  const [state, setState] = useState<PlacementState>(() => initialPlacementState([], []));
  const stateRef = useRef(state);
  const loadedRef = useRef<Loaded | null>(null);
  const busyRef = useRef(false);

  const dispatch = useCallback((action: PlacementAction): PlacementState => {
    const next = placementReducer(stateRef.current, action);
    stateRef.current = next;
    setState(next);
    return next;
  }, []);

  const load = useCallback(async () => {
    if (!userId || !receiptId) {
      setLoadState('unavailable');
      return;
    }
    const context: AuthenticatedUserContext = {
      accessToken: token,
      user: { email: session?.user?.email, id: userId },
    };
    setLoadState('loading');
    setLoadMessage(undefined);
    try {
      const household = await getMobileProfileClient().getHousehold(context);
      if (!household) throw new Error('Household not found.');
      const receipts = getMobileReceiptsClient();
      const storageKey = pendingAttemptStorageKey(userId, receiptId);
      const [review, zones, status] = await Promise.all([
        receipts.getReceiptReview(context, { householdId: household.id, receiptId }),
        getMobileItemsClient().listZones(context, household.id),
        receipts.getReceiptPlacement(context, { householdId: household.id, receiptId }),
      ]);
      const initial = initialPlacementState(
        placementLinesFromReview(review),
        placementZonesFromStorage(zones),
      );
      stateRef.current = initial;
      setState(initial);
      if (status.state === 'placed' && status.placement) {
        await clearPending(storageKey);
        dispatch({ placement: status.placement, type: 'showCommitted' });
        setLoadState('ready');
        return;
      }
      const reviewRef = placementReviewRef(review);
      if (!reviewRef || initial.lines.length === 0) {
        setLoadState('notPlaceable');
        return;
      }
      loadedRef.current = { context, householdId: household.id, review: reviewRef, storageKey };
      let persisted = null;
      try {
        persisted = parsePersistedAttempt(await AsyncStorage.getItem(storageKey));
      } catch {
        persisted = null;
      }
      if (persisted && attemptMatchesReview(persisted, reviewRef)) {
        dispatch({ attempt: persisted, type: 'restoreAttempt' });
      } else if (persisted) {
        await clearPending(storageKey);
      }
      setLoadState('ready');
    } catch (error) {
      setLoadState('error');
      setLoadMessage(error instanceof Error ? error.message : 'Unable to load this receipt.');
    }
  }, [dispatch, receiptId, session?.user?.email, token, userId]);

  useEffect(() => {
    if (authStatus === 'loading') return;
    void load();
  }, [authStatus, load]);

  const finish = useCallback(
    (next: PlacementState) => {
      const loaded = loadedRef.current;
      if (next.phase === 'success' && next.placement) {
        if (loaded) void clearPending(loaded.storageKey);
        showPlacementToast(placedCountCopy(next.placement.items.length));
        router.replace('/(tabs)');
      }
    },
    [router],
  );

  const loadCommitted = useCallback(async () => {
    const loaded = loadedRef.current;
    if (!loaded) return;
    try {
      const status = await getMobileReceiptsClient().getReceiptPlacement(loaded.context, {
        householdId: loaded.householdId,
        receiptId,
      });
      if (status.state === 'placed' && status.placement) {
        await clearPending(loaded.storageKey);
        dispatch({ placement: status.placement, type: 'showCommitted' });
      }
    } catch {
      // Keep the current notice; the user can retry or go back.
    }
  }, [dispatch, receiptId]);

  const submit = useCallback(async () => {
    const loaded = loadedRef.current;
    if (!loaded || busyRef.current) return;
    const next = dispatch({ newKey: newIdempotencyKey(), review: loaded.review, type: 'submit' });
    if (next.phase !== 'submitting' || !next.attempt) return;
    const attempt = next.attempt;
    busyRef.current = true;
    try {
      try {
        await AsyncStorage.setItem(loaded.storageKey, JSON.stringify(attempt));
      } catch {
        // Best-effort persistence; the in-memory attempt still governs retries.
      }
      const receipts = getMobileReceiptsClient();
      const result = await finalizeWithFaultInjection(
        (input) => receipts.finalizeReceiptPlacement(loaded.context, input),
        { ...attempt.command, householdId: loaded.householdId, receiptId },
      );
      finish(dispatch({ result, type: 'submitSucceeded' }));
      if (stateRef.current.phase === 'committed') await clearPending(loaded.storageKey);
    } catch (error) {
      const after = dispatch({ error, type: 'submitFailed' });
      if (after.phase === 'editing') await clearPending(loaded.storageKey);
      if (
        after.phase === 'committed' ||
        (after.phase === 'editing' && after.notice?.kind === 'keyReused')
      ) {
        await loadCommitted();
      }
    } finally {
      busyRef.current = false;
    }
  }, [dispatch, finish, loadCommitted, receiptId]);

  const checkStatus = useCallback(async () => {
    const loaded = loadedRef.current;
    const attempt = stateRef.current.attempt;
    if (!loaded || !attempt || busyRef.current) return;
    if (dispatch({ type: 'checkStarted' }).phase !== 'checking') return;
    busyRef.current = true;
    try {
      const status = await getMobileReceiptsClient().getReceiptPlacement(loaded.context, {
        householdId: loaded.householdId,
        idempotencyKey: attempt.command.idempotencyKey,
        receiptId,
      });
      const next = dispatch({ status, type: 'statusChecked' });
      if (next.phase === 'committed') await clearPending(loaded.storageKey);
      finish(next);
    } catch {
      dispatch({ type: 'statusFailed' });
    } finally {
      busyRef.current = false;
    }
  }, [dispatch, finish, receiptId]);

  const blockLeave =
    state.phase === 'submitting' || state.phase === 'checking' || state.phase === 'unknown';
  usePreventRemove(blockLeave, () => {
    Alert.alert(
      'Still confirming',
      'We have not confirmed whether these items were added. Check the status before leaving.',
    );
  });

  // ---- drag support (enhancement; the tap path below is complete on its own) ----
  const zoneRefs = useRef(new Map<string, View | null>());
  const zoneRects = useRef(new Map<string, ZoneRect>());
  const [hoverZoneId, setHoverZoneId] = useState<string | null>(null);
  const hoverRef = useRef<string | null>(null);

  const measureZones = useCallback(() => {
    for (const [zoneId, node] of zoneRefs.current) {
      node?.measureInWindow?.((x, y, width, height) => {
        zoneRects.current.set(zoneId, { height, width, x, y });
      });
    }
  }, []);

  const zoneAt = useCallback((x: number, y: number): string | null => {
    for (const [zoneId, rect] of zoneRects.current) {
      if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        return zoneId;
      }
    }
    return null;
  }, []);

  const setHover = useCallback((zoneId: string | null) => {
    if (hoverRef.current === zoneId) return;
    hoverRef.current = zoneId;
    setHoverZoneId(zoneId);
  }, []);

  const dropAt = useCallback(
    (receiptItemId: string, x: number, y: number): boolean => {
      setHover(null);
      const zoneId = zoneAt(x, y);
      if (!zoneId) return false;
      dispatch({ receiptItemId, type: 'assign', zoneId });
      return true;
    },
    [dispatch, setHover, zoneAt],
  );

  if (authStatus === 'loading' || loadState === 'loading') {
    return <StateCard busy title="Loading placement" body="Getting your reviewed items." />;
  }
  if (loadState === 'unavailable' || loadState === 'error') {
    return (
      <StateCard
        title="Placement unavailable"
        body={loadMessage ?? 'Sign in and open a saved receipt review to place items.'}
        actionLabel="Try again"
        onAction={() => void load()}
        secondaryLabel="Back"
        onSecondary={() => router.back()}
      />
    );
  }
  if (loadState === 'notPlaceable') {
    return (
      <StateCard
        title="Finish the review first"
        body="Save a complete review with at least one included item before choosing where things go."
        actionLabel="Back to review"
        onAction={() =>
          router.replace({ pathname: '/receipt-review/[id]', params: { id: receiptId } })
        }
      />
    );
  }
  if (state.phase === 'committed' && state.placement) {
    return (
      <CommittedResult
        insetsBottom={insets.bottom}
        onHome={() => router.replace('/(tabs)')}
        placement={state.placement}
        zones={state.zones}
      />
    );
  }

  const editable = state.phase === 'editing';
  const remaining = unplacedLines(state);
  const placedCount = state.lines.length - remaining.length;
  const selected = state.lines.find((line) => line.receiptItemId === state.selectedLineId) ?? null;
  const selectedSuggestion = selected ? suggestZone(selected.categoryId, state.zones) : null;
  const selectedIsPlaced = Boolean(selected && state.assignments[selected.receiptItemId]);
  const ready = canSubmit(state);
  const sortable = editable && autoSortCount(state) > 0;
  const noticeLineId = state.notice?.receiptItemId;

  function chipFor(line: PlacementLine, placed: boolean) {
    return (
      <PlacementChip
        disabled={!editable}
        error={noticeLineId === line.receiptItemId}
        index={state.lines.indexOf(line)}
        key={line.receiptItemId}
        line={line}
        onDrop={dropAt}
        onDragMove={(x, y) => setHover(zoneAt(x, y))}
        onDragStart={measureZones}
        onPress={() => dispatch({ receiptItemId: line.receiptItemId, type: 'select' })}
        onZoneAction={(zoneId) =>
          dispatch({ receiptItemId: line.receiptItemId, type: 'assign', zoneId })
        }
        placed={placed}
        selected={state.selectedLineId === line.receiptItemId}
        suggestion={suggestZone(line.categoryId, state.zones)}
        zones={state.zones}
      />
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Back to review"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.roundButton}
          testID="receipt-placement.back"
        >
          <Text style={styles.roundButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.step}>Step 3 of 3</Text>
        <Pressable
          accessibilityHint="Puts every item that is still waiting into its suggested place. You can change any of them."
          accessibilityRole="button"
          accessibilityState={{ disabled: !sortable }}
          disabled={!sortable}
          onPress={() => dispatch({ type: 'autoSort' })}
          style={styles.autoSort}
          testID="receipt-placement.auto-sort"
        >
          <Text style={[styles.autoSortText, !sortable ? styles.mutedText : null]}>Auto-sort</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        onScroll={measureZones}
        scrollEventThrottle={64}
        testID="receipt-placement.scroll"
      >
        <Text accessibilityRole="header" style={styles.title}>
          Where does it go?
        </Text>
        <Text style={styles.subtitle}>
          Tap an item, then tap its storage place. You can also drag it.
        </Text>

        <View style={styles.dock} testID="receipt-placement.dock">
          <View style={styles.dockHeader}>
            <Text style={styles.eyebrow}>To place · {remaining.length}</Text>
            <Text style={styles.progress} testID="receipt-placement.progress">
              {placedCount} / {state.lines.length} done
            </Text>
          </View>
          {remaining.length > 0 ? (
            <View style={styles.chipRow}>{remaining.map((line) => chipFor(line, false))}</View>
          ) : (
            <Text style={styles.dockDone}>Everything has a place.</Text>
          )}
        </View>

        {selected && editable ? (
          <View style={styles.selectionBar} testID="receipt-placement.selection">
            <Text style={styles.selectionText}>Choose a place for {selected.name}</Text>
            <View style={styles.selectionActions}>
              {selectedSuggestion ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    dispatch({
                      receiptItemId: selected.receiptItemId,
                      type: 'assign',
                      zoneId: selectedSuggestion.id,
                    })
                  }
                  style={styles.smallButton}
                  testID="receipt-placement.accept-suggestion"
                >
                  <Text style={styles.smallButtonText}>{selectedSuggestion.label} (suggested)</Text>
                </Pressable>
              ) : null}
              {selectedIsPlaced ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    dispatch({ receiptItemId: selected.receiptItemId, type: 'unassign' })
                  }
                  style={styles.smallButton}
                  testID="receipt-placement.unplace"
                >
                  <Text style={styles.smallButtonText}>Back to To place</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        {state.zones.map((zone) => {
          const items = linesInZone(state, zone.id);
          const target = Boolean(selected && editable);
          const active = hoverZoneId === zone.id;
          return (
            <View
              collapsable={false}
              key={zone.id}
              onLayout={measureZones}
              ref={(node) => {
                zoneRefs.current.set(zone.id, node);
              }}
              style={[styles.zone, active || target ? styles.zoneActive : null]}
            >
              <Pressable
                accessibilityHint={
                  selected ? `Places ${selected.name} in ${zone.label}` : 'Select an item first'
                }
                accessibilityLabel={`${zone.label}, ${items.length} ${items.length === 1 ? 'item' : 'items'}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: !target }}
                disabled={!target}
                onPress={() => {
                  if (selected) {
                    dispatch({
                      receiptItemId: selected.receiptItemId,
                      type: 'assign',
                      zoneId: zone.id,
                    });
                  }
                }}
                style={styles.zoneHeader}
                testID={`receipt-placement.zone.${zone.key}`}
              >
                <View style={styles.zoneIcon}>
                  <Text style={styles.zoneIconText}>{zone.label.slice(0, 1).toUpperCase()}</Text>
                </View>
                <Text style={styles.zoneLabel}>{zone.label}</Text>
                <Text style={styles.zoneCount}>{items.length}</Text>
              </Pressable>
              {items.length > 0 ? (
                <View style={styles.chipRow}>{items.map((line) => chipFor(line, true))}</View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>
        {state.notice ? (
          <View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={styles.noticeError}
            testID="receipt-placement.error"
          >
            <Text style={styles.noticeText}>{state.notice.message}</Text>
            {state.notice.kind === 'stale' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.replace({ pathname: '/receipt-review/[id]', params: { id: receiptId } })
                }
                style={styles.smallButton}
                testID="receipt-placement.back-to-review"
              >
                <Text style={styles.smallButtonText}>Back to review</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {state.phase === 'unknown' || state.phase === 'checking' ? (
          <View
            accessibilityLiveRegion="polite"
            style={styles.noticeUnknown}
            testID="receipt-placement.outcome-unknown"
          >
            <Text style={styles.noticeText}>
              {state.checkedUnplaced
                ? 'These items are not in your stock yet. Try again to add them.'
                : "We couldn't confirm whether these items were added. Nothing is lost. Check the status or try again."}
            </Text>
            <View style={styles.selectionActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: state.phase === 'checking' }}
                disabled={state.phase === 'checking'}
                onPress={() => void checkStatus()}
                style={styles.smallButton}
                testID="receipt-placement.check-status"
              >
                <Text style={styles.smallButtonText}>Check status</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: state.phase === 'checking' }}
                disabled={state.phase === 'checking'}
                onPress={() => void submit()}
                style={styles.smallButton}
                testID="receipt-placement.retry"
              >
                <Text style={styles.smallButtonText}>Try again</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {state.phase !== 'unknown' && state.phase !== 'checking' ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: state.phase === 'submitting', disabled: !ready }}
              disabled={!ready}
              onPress={() => void submit()}
              style={[styles.primary, !ready ? styles.buttonDisabled : null]}
              testID="receipt-placement.submit"
            >
              {state.phase === 'submitting' ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <Text style={styles.primaryText}>Add to stock</Text>
              )}
            </Pressable>
            <Text style={styles.footerHint}>
              {remaining.length > 0
                ? `${remaining.length} ${remaining.length === 1 ? 'item still needs' : 'items still need'} a place`
                : 'Ready to add these items to your stock.'}
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

type PlacementChipProps = {
  readonly disabled: boolean;
  /** Position in the review's included lines; stable testID for E2E flows. */
  readonly index: number;
  readonly error: boolean;
  readonly line: PlacementLine;
  readonly onDragMove: (x: number, y: number) => void;
  readonly onDragStart: () => void;
  readonly onDrop: (receiptItemId: string, x: number, y: number) => boolean;
  readonly onPress: () => void;
  readonly onZoneAction: (zoneId: string) => void;
  readonly placed: boolean;
  readonly selected: boolean;
  readonly suggestion: PlacementZone | null;
  readonly zones: readonly PlacementZone[];
};

function PlacementChip(props: PlacementChipProps): JSX.Element {
  const { disabled, error, line, placed, selected, suggestion, zones } = props;
  const propsRef = useRef(props);
  propsRef.current = props;
  const offset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [dragging, setDragging] = useState(false);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          !propsRef.current.disabled && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 8,
        onPanResponderGrant: () => {
          propsRef.current.onDragStart();
          setDragging(true);
        },
        onPanResponderMove: (_event, gesture) => {
          offset.setValue({ x: gesture.dx, y: gesture.dy });
          propsRef.current.onDragMove(gesture.moveX, gesture.moveY);
        },
        onPanResponderRelease: (_event, gesture) => {
          setDragging(false);
          const dropped = propsRef.current.onDrop(
            propsRef.current.line.receiptItemId,
            gesture.moveX,
            gesture.moveY,
          );
          if (dropped) {
            offset.setValue({ x: 0, y: 0 });
          } else {
            // Miss: spring back to the original position.
            Animated.spring(offset, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
          }
        },
        onPanResponderTerminate: () => {
          setDragging(false);
          propsRef.current.onDrop(propsRef.current.line.receiptItemId, -1, -1);
          Animated.spring(offset, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [offset],
  );

  const meta = line.categoryId ? categoryMeta[line.categoryId] : undefined;
  const label = [
    line.name,
    line.quantityLabel,
    placed ? 'placed' : suggestion ? `suggested ${suggestion.label}` : undefined,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Animated.View
      {...(disabled ? {} : responder.panHandlers)}
      style={[dragging ? styles.chipDragging : null, { transform: offset.getTranslateTransform() }]}
    >
      <Pressable
        accessibilityActions={zones.map((zone) => ({
          label: `Move to ${zone.label}`,
          name: zone.id,
        }))}
        accessibilityHint="Double tap to choose a storage place"
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled, selected }}
        disabled={disabled}
        onAccessibilityAction={(event) => props.onZoneAction(event.nativeEvent.actionName)}
        onPress={props.onPress}
        style={[
          styles.chip,
          selected ? styles.chipSelected : null,
          error ? styles.chipError : null,
        ]}
        testID={`receipt-placement.${placed ? 'placed' : 'chip'}.${props.index}`}
      >
        <View style={[styles.tile, meta ? { backgroundColor: meta.bg } : null]}>
          <Text style={[styles.tileText, meta ? { color: meta.ink } : null]}>
            {meta?.short ?? '··'}
          </Text>
        </View>
        <View>
          <Text style={styles.chipText}>{line.name}</Text>
          {!placed && suggestion ? (
            <Text style={styles.chipHint}>Suggested: {suggestion.label}</Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function CommittedResult(props: {
  readonly insetsBottom: number;
  readonly onHome: () => void;
  readonly placement: ReceiptPlacement;
  readonly zones: readonly PlacementZone[];
}): JSX.Element {
  const byZone = new Map<string, string[]>();
  for (const item of props.placement.items) {
    byZone.set(item.zoneId, [...(byZone.get(item.zoneId) ?? []), item.name]);
  }
  const label = (zoneId: string) =>
    props.zones.find((zone) => zone.id === zoneId)?.label ?? 'Storage place';
  return (
    <View style={styles.screen} testID="receipt-placement.committed">
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Already in your stock
        </Text>
        <Text style={styles.subtitle}>
          This receipt was already placed. Here is where its items went.
        </Text>
        {[...byZone].map(([zoneId, names]) => (
          <View key={zoneId} style={styles.zone}>
            <Text style={styles.zoneLabel}>{label(zoneId)}</Text>
            <Text style={styles.subtitle}>{names.join(', ')}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(props.insetsBottom, 12) + 10 }]}>
        <Pressable
          accessibilityRole="button"
          onPress={props.onHome}
          style={styles.primary}
          testID="receipt-placement.go-home"
        >
          <Text style={styles.primaryText}>Go to Home</Text>
        </Pressable>
      </View>
    </View>
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
    <View style={[styles.screen, styles.stateCard]} testID="receipt-placement.state">
      {props.busy ? <ActivityIndicator color={colors.ink} /> : null}
      <Text accessibilityRole="header" style={styles.title}>
        {props.title}
      </Text>
      <Text style={styles.subtitle}>{props.body}</Text>
      {props.actionLabel && props.onAction ? (
        <Pressable accessibilityRole="button" onPress={props.onAction} style={styles.primary}>
          <Text style={styles.primaryText}>{props.actionLabel}</Text>
        </Pressable>
      ) : null}
      {props.secondaryLabel && props.onSecondary ? (
        <Pressable
          accessibilityRole="button"
          onPress={props.onSecondary}
          style={styles.smallButton}
        >
          <Text style={styles.smallButtonText}>{props.secondaryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  autoSort: { justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  autoSortText: { color: colors.inkSoft, fontFamily, fontSize: 14, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipDragging: { opacity: 0.92, zIndex: 10 },
  chipError: { borderColor: colors.berry, borderWidth: 2 },
  chipHint: { color: colors.mute, fontFamily, fontSize: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chipSelected: { borderColor: colors.sageDeep, borderWidth: 2 },
  chipText: { color: colors.ink, fontFamily, fontSize: 15, fontWeight: '600' },
  content: { gap: 12, padding: 16, paddingBottom: 32 },
  dock: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  dockDone: { color: colors.mute, fontFamily, fontSize: 14, marginTop: 8 },
  dockHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: colors.inkSoft, fontFamily, fontSize: 13, fontWeight: '700' },
  footer: {
    backgroundColor: colors.bg,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerHint: { color: colors.mute, fontFamily, fontSize: 13, textAlign: 'center' },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  mutedText: { color: colors.muteSoft },
  noticeError: {
    backgroundColor: colors.berrySoft,
    borderRadius: 12,
    gap: 8,
    padding: 12,
  },
  noticeText: { color: colors.ink, fontFamily, fontSize: 14 },
  noticeUnknown: { backgroundColor: colors.amberSoft, borderRadius: 12, gap: 8, padding: 12 },
  primary: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 999,
    height: 52,
    justifyContent: 'center',
  },
  primaryText: { color: colors.ink, fontFamily, fontSize: 15, fontWeight: '800' },
  progress: { color: colors.muteSoft, fontFamily, fontSize: 12 },
  roundButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  roundButtonText: { color: colors.ink, fontSize: 24 },
  screen: { backgroundColor: colors.bg, flex: 1 },
  selectionActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectionBar: { backgroundColor: colors.sageTint, borderRadius: 12, gap: 8, padding: 12 },
  selectionText: { color: colors.ink, fontFamily, fontSize: 14, fontWeight: '700' },
  smallButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  smallButtonText: { color: colors.ink, fontFamily, fontSize: 14, fontWeight: '700' },
  stateCard: { gap: 12, justifyContent: 'center', padding: 24 },
  step: { color: colors.mute, fontFamily, fontSize: 14, fontWeight: '500' },
  subtitle: { color: colors.mute, fontFamily, fontSize: 14 },
  tile: {
    alignItems: 'center',
    backgroundColor: colors.borderSoft,
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  tileText: { color: colors.ink, fontFamily, fontSize: 11, fontWeight: '800' },
  title: { color: colors.ink, fontFamily, fontSize: 26, fontWeight: '700' },
  zone: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  zoneActive: { borderColor: colors.sage, borderWidth: 2 },
  zoneCount: { color: colors.mute, fontFamily, fontSize: 14, marginLeft: 'auto' },
  zoneHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 44 },
  zoneIcon: {
    alignItems: 'center',
    backgroundColor: colors.kraftSoft,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  zoneIconText: { color: colors.kraftInk, fontFamily, fontSize: 16, fontWeight: '800' },
  zoneLabel: { color: colors.ink, fontFamily, fontSize: 16, fontWeight: '700' },
});
