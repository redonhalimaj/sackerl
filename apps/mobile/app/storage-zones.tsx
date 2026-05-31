import { colors, nativeFont, nativeTypography, space } from '@sackerl/tokens';
import { Logo, PaperBag } from '@sackerl/ui';
import { useRouter } from 'expo-router';
import { useMemo, useState, type JSX } from 'react';
import {
  ActivityIndicator,
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
import Svg, { Path } from 'react-native-svg';

import { useAuthSession } from '../lib/auth-session';
import { getMobileProfileClient } from '../lib/profile';

type BaseZoneId = 'basement' | 'cabinet' | 'freezer' | 'fridge' | 'pantry';

type ZoneOption = {
  readonly bg: string;
  readonly hint: string;
  readonly id: string;
  readonly ink: string;
  readonly label: string;
  readonly short: string;
};

const typography =
  Platform.OS === 'ios'
    ? nativeTypography.ios
    : Platform.OS === 'android'
      ? nativeTypography.android
      : nativeTypography.fallback;

const fontFamily =
  Platform.OS === 'ios'
    ? nativeFont.ios
    : Platform.OS === 'android'
      ? nativeFont.android
      : nativeFont.fallback;

const baseZones = [
  {
    bg: '#E4ECEF',
    hint: 'cold drinks, dairy',
    id: 'fridge',
    ink: '#3F5360',
    label: 'Fridge',
    short: 'FR',
  },
  {
    bg: '#F2EBDD',
    hint: 'pasta, cans',
    id: 'pantry',
    ink: '#7A5A2A',
    label: 'Pantry',
    short: 'PA',
  },
  {
    bg: '#E8E7DF',
    hint: 'bulk, drinks',
    id: 'basement',
    ink: '#54514A',
    label: 'Basement',
    short: 'BS',
  },
  {
    bg: '#E0EAF0',
    hint: 'long-term',
    id: 'freezer',
    ink: '#3D5468',
    label: 'Freezer',
    short: 'FZ',
  },
  {
    bg: '#F0E9DC',
    hint: 'dry goods',
    id: 'cabinet',
    ink: '#6B5024',
    label: 'Cabinet',
    short: 'CB',
  },
] as const satisfies readonly (ZoneOption & { readonly id: BaseZoneId })[];

const defaultSelectedZones = new Set<string>(['fridge', 'pantry', 'basement', 'freezer']);

function slugifyZoneName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

  return slug || 'custom';
}

function ChevronLeftIcon(): JSX.Element {
  return (
    <Svg fill="none" height={22} stroke={colors.ink} viewBox="0 0 24 24" width={22}>
      <Path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function ArrowRightIcon(): JSX.Element {
  return (
    <Svg fill="none" height={18} stroke={colors.ink} viewBox="0 0 24 24" width={18}>
      <Path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
      <Path d="m12 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
    </Svg>
  );
}

function CheckIcon(): JSX.Element {
  return (
    <Svg fill="none" height={13} stroke={colors.ink} viewBox="0 0 24 24" width={13}>
      <Path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
    </Svg>
  );
}

function PlusIcon(): JSX.Element {
  return (
    <Svg fill="none" height={19} stroke={colors.mute} viewBox="0 0 24 24" width={19}>
      <Path d="M12 5v14" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
      <Path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
    </Svg>
  );
}

function ZoneGlyph({ zone }: { readonly zone: ZoneOption }): JSX.Element {
  return (
    <View style={[styles.zoneGlyph, { backgroundColor: zone.bg }]}>
      <Text style={[styles.zoneGlyphText, { color: zone.ink }]}>{zone.short}</Text>
    </View>
  );
}

function ZoneCard({
  isSelected,
  onPress,
  zone,
}: {
  readonly isSelected: boolean;
  readonly onPress: () => void;
  readonly zone: ZoneOption;
}): JSX.Element {
  return (
    <Pressable
      accessibilityHint={zone.hint}
      accessibilityLabel={zone.label}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.zoneCard,
        isSelected ? styles.zoneCardSelected : null,
        pressed ? styles.zoneCardPressed : null,
      ]}
    >
      <ZoneGlyph zone={zone} />

      <View>
        <Text style={styles.zoneLabel}>{zone.label}</Text>
        <Text style={styles.zoneHint}>{zone.hint}</Text>
      </View>

      {isSelected ? (
        <View aria-hidden style={styles.checkPill}>
          <CheckIcon />
        </View>
      ) : null}
    </Pressable>
  );
}

export default function StorageZonesRoute(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuthSession();
  const [customName, setCustomName] = useState('');
  const [customZones, setCustomZones] = useState<readonly ZoneOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [selectedZones, setSelectedZones] = useState<ReadonlySet<string>>(defaultSelectedZones);
  const [showCustomSheet, setShowCustomSheet] = useState(false);

  const zones = useMemo(() => [...baseZones, ...customZones], [customZones]);
  const selectedCount = selectedZones.size;
  const canContinue = selectedCount > 0 && !isSaving;

  function toggleZone(zoneId: string) {
    setMessage(undefined);
    setSelectedZones((current) => {
      const next = new Set(current);

      if (next.has(zoneId)) {
        next.delete(zoneId);
      } else {
        next.add(zoneId);
      }

      return next;
    });
  }

  function handleSaveCustomZone() {
    const label = customName.trim();

    if (!label) {
      return;
    }

    const slugBase = slugifyZoneName(label);
    let id = slugBase;
    let suffix = 2;
    const existingIds = new Set(zones.map((zone) => zone.id));

    while (existingIds.has(id)) {
      id = `${slugBase}-${suffix}`;
      suffix += 1;
    }

    const nextZone: ZoneOption = {
      bg: colors.bgWarm,
      hint: 'custom place',
      id,
      ink: colors.inkSoft,
      label,
      short: label
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
        .slice(0, 2),
    };

    setCustomZones((current) => [...current, nextZone]);
    setSelectedZones((current) => new Set(current).add(id));
    setCustomName('');
    setShowCustomSheet(false);
  }

  async function handleContinue() {
    if (selectedCount < 1) {
      setMessage('Pick at least one.');
      return;
    }

    if (!session?.user) {
      router.push({ params: { returnTo: '/storage-zones' }, pathname: '/auth' });
      return;
    }

    setIsSaving(true);
    setMessage(undefined);

    try {
      const profileClient = getMobileProfileClient();
      const context = {
        accessToken: session.access_token,
        user: {
          email: session.user.email,
          id: session.user.id,
        },
      };

      await profileClient.ensureHousehold(context, { name: 'My household' });
      await profileClient.updateHouseholdZones(context, { zones: [...selectedZones] });
      router.replace('/');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save storage zones.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom + 122, 154),
            paddingTop: Math.max(insets.top + space[1], space[4]),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.shell}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityLabel="Back"
              accessibilityRole="button"
              onPress={() => {
                router.back();
              }}
              style={styles.iconButton}
            >
              <ChevronLeftIcon />
            </Pressable>

            <Text style={styles.stepLabel}>Step 1 of 3</Text>
            <View style={styles.topBarSpacer} />
          </View>

          <View style={styles.header}>
            <Logo size={26} />
            <View style={styles.titleBlock}>
              <Text accessibilityRole="header" style={styles.title}>
                Where do you store <Text style={styles.titleAccent}>food?</Text>
              </Text>
              <Text style={styles.subtitle}>
                Tap every place you'd open looking for ingredients. You can change this later.
              </Text>
            </View>

            <View accessibilityLabel="Step 1 of 3 progress" style={styles.progressRail}>
              <View style={[styles.progressSegment, styles.progressSegmentActive]} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
            </View>
          </View>

          <View style={styles.grid}>
            {zones.map((zone) => (
              <ZoneCard
                isSelected={selectedZones.has(zone.id)}
                key={zone.id}
                onPress={() => {
                  toggleZone(zone.id);
                }}
                zone={zone}
              />
            ))}

            <Pressable
              accessibilityLabel="Custom place"
              accessibilityRole="button"
              onPress={() => {
                setShowCustomSheet(true);
              }}
              style={({ pressed }) => [styles.addCard, pressed ? styles.zoneCardPressed : null]}
            >
              <View style={styles.addGlyph}>
                <PlusIcon />
              </View>
              <View>
                <Text style={styles.zoneLabel}>Custom place</Text>
                <Text style={styles.zoneHint}>bath, garage...</Text>
              </View>
            </Pressable>
          </View>

          {message ? (
            <View accessibilityRole="alert" style={styles.message}>
              <View style={styles.messageDot} />
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}

          <View style={styles.previewBag}>
            <PaperBag height={110} width={104} />
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.actions,
          {
            paddingBottom: Math.max(insets.bottom + space[4], 30),
          },
        ]}
      >
        <Pressable
          accessibilityHint={canContinue ? undefined : 'Pick at least one storage zone'}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
          disabled={!canContinue}
          onPress={() => {
            void handleContinue();
          }}
          style={[styles.primaryButton, !canContinue ? styles.disabledButton : null]}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Continue</Text>
              <ArrowRightIcon />
            </>
          )}
        </Pressable>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => {
          setShowCustomSheet(false);
        }}
        transparent
        visible={showCustomSheet}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetBackdrop}
        >
          <Pressable
            accessibilityLabel="Close custom place"
            onPress={() => {
              setShowCustomSheet(false);
            }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + space[5], 34) }]}>
            <Text style={styles.sheetTitle}>Custom place</Text>
            <Text style={styles.sheetCopy}>Add another place you use for household stock.</Text>
            <TextInput
              accessibilityLabel="Storage place name"
              autoCapitalize="words"
              autoFocus
              onChangeText={setCustomName}
              placeholder="Garage shelf"
              placeholderTextColor={colors.muteSoft}
              returnKeyType="done"
              style={styles.input}
              value={customName}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!customName.trim()}
              onPress={handleSaveCustomZone}
              style={[styles.sheetButton, !customName.trim() ? styles.disabledButton : null]}
            >
              <Text style={styles.sheetButtonText}>Save</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    backgroundColor: colors.bg,
    bottom: 0,
    left: 0,
    paddingHorizontal: space[4.5],
    paddingTop: space[4],
    position: 'absolute',
    right: 0,
  },
  addCard: {
    backgroundColor: colors.bgWarm,
    borderColor: colors.border,
    borderRadius: 18,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 132,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 16,
    width: '48.5%',
  },
  addGlyph: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  checkPill: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderColor: colors.ink,
    borderRadius: 11,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    width: 22,
  },
  disabledButton: {
    opacity: 0.45,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 22,
  },
  header: {
    paddingHorizontal: space[1],
    paddingTop: space[3],
  },
  iconButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    height: 54,
    lineHeight: typography.body.lineHeight,
    marginTop: space[5],
    paddingHorizontal: space[4],
  },
  message: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[2],
    marginTop: 14,
    paddingHorizontal: space[1],
  },
  messageDot: {
    backgroundColor: colors.amberDeep,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  messageText: {
    color: colors.amberDeep,
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: typography.caption.fontWeight,
    lineHeight: 18,
  },
  previewBag: {
    alignItems: 'center',
    marginTop: space[6],
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderColor: colors.ink,
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'space-between',
    paddingHorizontal: space[6],
    shadowColor: colors.amber,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
  },
  primaryButtonText: {
    color: colors.ink,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    lineHeight: typography.body.lineHeight,
  },
  progressRail: {
    flexDirection: 'row',
    gap: 6,
    marginTop: space[4],
  },
  progressSegment: {
    backgroundColor: colors.border,
    borderRadius: 2,
    flex: 1,
    height: 3,
  },
  progressSegmentActive: {
    backgroundColor: colors.ink,
  },
  screen: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  scrollContent: {
    backgroundColor: colors.bg,
    flexGrow: 1,
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: space[5],
    paddingTop: space[6],
  },
  sheetBackdrop: {
    backgroundColor: 'rgba(27,36,24,0.24)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderColor: colors.ink,
    borderRadius: 999,
    borderWidth: 1.5,
    height: 50,
    justifyContent: 'center',
    marginTop: space[4],
  },
  sheetButtonText: {
    color: colors.ink,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    lineHeight: typography.body.lineHeight,
  },
  sheetCopy: {
    color: colors.inkSoft,
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    fontWeight: typography.body.fontWeight,
    lineHeight: 20,
    marginTop: space[2],
  },
  sheetTitle: {
    color: colors.ink,
    fontFamily: typography.headline.fontFamily,
    fontSize: 28,
    fontWeight: typography.headline.fontWeight,
    lineHeight: 32,
  },
  shell: {
    alignSelf: 'center',
    maxWidth: 430,
    paddingHorizontal: space[4.5],
    width: '100%',
  },
  stepLabel: {
    color: colors.mute,
    fontFamily: typography.meta.fontFamily,
    fontSize: 11,
    fontWeight: typography.meta.fontWeight,
    letterSpacing: 0,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.inkSoft,
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    fontWeight: typography.body.fontWeight,
    lineHeight: 20,
    marginTop: space[2],
    maxWidth: 320,
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleAccent: {
    fontFamily: fontFamily.serif,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  titleBlock: {
    marginTop: space[8],
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 44,
    justifyContent: 'space-between',
  },
  topBarSpacer: {
    width: 36,
  },
  zoneCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 132,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 16,
    position: 'relative',
    width: '48.5%',
  },
  zoneCardPressed: {
    transform: [{ scale: 0.985 }],
  },
  zoneCardSelected: {
    borderColor: colors.ink,
    borderWidth: 2,
  },
  zoneGlyph: {
    alignItems: 'center',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  zoneGlyphText: {
    fontFamily: fontFamily.mono,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 16,
  },
  zoneHint: {
    color: colors.mute,
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: typography.caption.fontWeight,
    lineHeight: 16,
    marginTop: 2,
  },
  zoneLabel: {
    color: colors.ink,
    fontFamily: typography.body.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
});
