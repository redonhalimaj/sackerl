import { colors, nativeFont, space } from '@sackerl/tokens';
import type { AuthenticatedUserContext } from '@sackerl/api-client';
import { useRouter } from 'expo-router';
import { useState, type JSX } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useAuthSession } from '../../lib/auth-session';
import { getMobileProfileClient } from '../../lib/profile';
import { getMobileReceiptsClient } from '../../lib/receipts';

type ScanState = 'aligned' | 'capturing' | 'misaligned';
type ReceiptCaptureSource = 'camera' | 'gallery' | 'pdf';

const cameraBg = '#15171A';
const cameraPanel = '#202328';
const cameraText = '#F7F4EA';

const fontFamily =
  Platform.OS === 'ios'
    ? nativeFont.ios
    : Platform.OS === 'android'
      ? nativeFont.android
      : nativeFont.fallback;

function CloseIcon(): JSX.Element {
  return (
    <Svg fill="none" height={20} stroke={cameraText} viewBox="0 0 24 24" width={20}>
      <Path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" strokeWidth={2} />
    </Svg>
  );
}

function HelpIcon(): JSX.Element {
  return (
    <Svg fill="none" height={20} stroke={cameraText} viewBox="0 0 24 24" width={20}>
      <Circle cx={12} cy={12} r={9} strokeWidth={1.8} />
      <Path
        d="M9.7 9.2a2.4 2.4 0 0 1 4.6 1c0 1.8-2.3 2-2.3 3.5"
        strokeLinecap="round"
        strokeWidth={1.8}
      />
      <Path d="M12 17h.01" strokeLinecap="round" strokeWidth={2.4} />
    </Svg>
  );
}

function ImageIcon(): JSX.Element {
  return (
    <Svg fill="none" height={23} stroke={cameraText} viewBox="0 0 24 24" width={23}>
      <Rect height={15} rx={3} strokeWidth={1.8} width={18} x={3} y={5} />
      <Circle cx={8.5} cy={10.5} r={1.3} strokeWidth={1.8} />
      <Path
        d="m5.5 18 4.7-4.8 3.1 3.1 1.9-1.9L20 19"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function PdfIcon(): JSX.Element {
  return (
    <Svg fill="none" height={23} stroke={cameraText} viewBox="0 0 24 24" width={23}>
      <Path d="M7 3h6l4 4v14H7z" strokeLinejoin="round" strokeWidth={1.8} />
      <Path d="M13 3v5h4" strokeLinejoin="round" strokeWidth={1.8} />
      <Path d="M8.5 15h7" strokeLinecap="round" strokeWidth={1.8} />
      <Path d="M8.5 18h4.5" strokeLinecap="round" strokeWidth={1.8} />
    </Svg>
  );
}

function CornerFrame({ state }: { readonly state: ScanState }): JSX.Element {
  const stroke = state === 'aligned' || state === 'capturing' ? colors.amber : cameraText;

  return (
    <View pointerEvents="none" style={styles.cornerFrame}>
      <View style={[styles.corner, styles.cornerTopLeft, { borderColor: stroke }]} />
      <View style={[styles.corner, styles.cornerTopRight, { borderColor: stroke }]} />
      <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: stroke }]} />
      <View style={[styles.corner, styles.cornerBottomRight, { borderColor: stroke }]} />
    </View>
  );
}

function ReceiptPreview(): JSX.Element {
  return (
    <View style={styles.receiptPreview}>
      <View style={styles.receiptNotch} />
      <Text style={styles.receiptStore}>SACKERL MART</Text>
      <View style={styles.receiptLineLong} />
      <View style={styles.receiptLine} />
      <View style={styles.receiptLineLong} />
      <View style={styles.receiptLineShort} />
      <View style={styles.receiptDivider} />
      <View style={styles.receiptRow}>
        <View style={styles.receiptLine} />
        <View style={styles.receiptAmount} />
      </View>
      <View style={styles.receiptRow}>
        <View style={styles.receiptLineShort} />
        <View style={styles.receiptAmount} />
      </View>
      <View style={styles.receiptRow}>
        <View style={styles.receiptLine} />
        <View style={styles.receiptAmount} />
      </View>
      <View style={styles.receiptDivider} />
      <Text style={styles.receiptTotal}>TOTAL 24.80</Text>
    </View>
  );
}

function buildContext(
  session: ReturnType<typeof useAuthSession>['session'],
): AuthenticatedUserContext {
  if (!session?.user) {
    throw new Error('Sign in required.');
  }

  return {
    accessToken: session.access_token,
    user: {
      email: session.user.email,
      id: session.user.id,
    },
  };
}

function receiptMockUrl(source: ReceiptCaptureSource): string {
  return `sackerl://receipt/${source}/${Date.now()}`;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export default function ScanRoute(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuthSession();
  const [scanState, setScanState] = useState<ScanState>('aligned');
  const [statusText, setStatusText] = useState('Align receipt inside frame - hold steady');
  const captureDisabled = scanState === 'misaligned' || scanState === 'capturing';

  async function createUploadedReceipt(source: ReceiptCaptureSource) {
    if (captureDisabled) {
      return;
    }

    setScanState('capturing');

    try {
      setStatusText(source === 'camera' ? 'Capturing receipt...' : 'Preparing receipt upload...');
      await wait(220);

      const context = buildContext(session);
      const household = await getMobileProfileClient().getHousehold(context);

      if (!household) {
        throw new Error('Household not found.');
      }

      const receipt = await getMobileReceiptsClient().createReceipt(context, {
        capturedAt: new Date().toISOString(),
        householdId: household.id,
        imageUrl: receiptMockUrl(source),
        status: 'uploaded',
      });

      setStatusText(`Receipt uploaded. ID ${receipt.id.slice(0, 8)} is ready for parsing.`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Unable to upload receipt.');
    } finally {
      setScanState('aligned');
    }
  }

  function handleCapture() {
    void createUploadedReceipt('camera');
  }

  function handleHelp() {
    setStatusText('Fill most of the frame with one receipt, then hold steady.');
  }

  function handleImport(kind: 'gallery' | 'pdf') {
    void createUploadedReceipt(kind);
  }

  return (
    <View style={styles.screen}>
      {scanState === 'capturing' ? <View pointerEvents="none" style={styles.shutterFlash} /> : null}

      <View
        style={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, space[5]),
            paddingTop: Math.max(insets.top, 44) + space[2],
          },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Cancel scan"
            accessibilityRole="button"
            onPress={() => {
              router.replace('/');
            }}
            style={({ pressed }) => [styles.roundButton, pressed ? styles.pressed : null]}
          >
            <CloseIcon />
          </Pressable>

          <Text style={styles.topTitle}>Scan receipt</Text>

          <Pressable
            accessibilityLabel="Receipt scan help"
            accessibilityRole="button"
            onPress={handleHelp}
            style={({ pressed }) => [styles.roundButton, pressed ? styles.pressed : null]}
          >
            <HelpIcon />
          </Pressable>
        </View>

        <View style={styles.viewport}>
          <View style={styles.cameraGlowA} />
          <View style={styles.cameraGlowB} />
          <View style={styles.frameShell}>
            <ReceiptPreview />
            <CornerFrame state={scanState} />
          </View>
        </View>

        <View style={styles.statusWrap}>
          <View
            style={[styles.statusDot, scanState === 'misaligned' ? styles.statusDotOff : null]}
          />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        <View style={styles.bottomActions}>
          <Pressable
            accessibilityLabel="Import receipt from gallery"
            accessibilityRole="button"
            onPress={() => {
              handleImport('gallery');
            }}
            style={({ pressed }) => [styles.sideAction, pressed ? styles.pressed : null]}
          >
            <ImageIcon />
            <Text style={styles.sideActionText}>Gallery</Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Capture receipt"
            accessibilityRole="button"
            accessibilityState={{ disabled: captureDisabled }}
            disabled={captureDisabled}
            onPress={handleCapture}
            style={({ pressed }) => [
              styles.captureButton,
              captureDisabled ? styles.captureButtonDisabled : null,
              pressed ? styles.captureButtonPressed : null,
            ]}
          >
            <View style={styles.captureInner} />
          </Pressable>

          <Pressable
            accessibilityLabel="Import receipt PDF"
            accessibilityRole="button"
            onPress={() => {
              handleImport('pdf');
            }}
            style={({ pressed }) => [styles.sideAction, pressed ? styles.pressed : null]}
          >
            <PdfIcon />
            <Text style={styles.sideActionText}>PDF</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            router.push('/add-item');
          }}
          style={({ pressed }) => [styles.manualLink, pressed ? styles.pressed : null]}
        >
          <Text style={styles.manualLinkText}>Skip - type it instead</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space[5],
    paddingHorizontal: space[5],
  },
  cameraGlowA: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 120,
    height: 180,
    left: 18,
    position: 'absolute',
    top: 42,
    transform: [{ rotate: '-18deg' }],
    width: 116,
  },
  cameraGlowB: {
    backgroundColor: 'rgba(247, 198, 24, 0.08)',
    borderRadius: 140,
    bottom: 28,
    height: 190,
    position: 'absolute',
    right: 4,
    transform: [{ rotate: '18deg' }],
    width: 128,
  },
  captureButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderColor: cameraText,
    borderRadius: 36,
    borderWidth: 2,
    height: 72,
    justifyContent: 'center',
    shadowColor: colors.amber,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    width: 72,
  },
  captureButtonDisabled: {
    opacity: 0.45,
  },
  captureButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  captureInner: {
    backgroundColor: cameraBg,
    borderRadius: 18,
    height: 30,
    opacity: 0.9,
    width: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: space[5],
  },
  corner: {
    height: 66,
    position: 'absolute',
    width: 66,
  },
  cornerBottomLeft: {
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    bottom: 0,
    left: 0,
  },
  cornerBottomRight: {
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    bottom: 0,
    right: 0,
  },
  cornerFrame: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  cornerTopLeft: {
    borderLeftWidth: 2.5,
    borderTopWidth: 2.5,
    left: 0,
    top: 0,
  },
  cornerTopRight: {
    borderRightWidth: 2.5,
    borderTopWidth: 2.5,
    right: 0,
    top: 0,
  },
  frameShell: {
    alignItems: 'center',
    aspectRatio: 0.68,
    justifyContent: 'center',
    maxHeight: 474,
    maxWidth: 326,
    width: '100%',
  },
  manualLink: {
    alignItems: 'center',
    marginTop: space[4],
    padding: space[2],
  },
  manualLinkText: {
    color: 'rgba(247, 244, 234, 0.68)',
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.72,
  },
  receiptAmount: {
    backgroundColor: 'rgba(21, 23, 26, 0.22)',
    borderRadius: 999,
    height: 6,
    width: 36,
  },
  receiptDivider: {
    backgroundColor: 'rgba(21, 23, 26, 0.18)',
    height: 1,
    marginVertical: space[3],
    width: '100%',
  },
  receiptLine: {
    backgroundColor: 'rgba(21, 23, 26, 0.22)',
    borderRadius: 999,
    height: 7,
    width: '58%',
  },
  receiptLineLong: {
    backgroundColor: 'rgba(21, 23, 26, 0.2)',
    borderRadius: 999,
    height: 7,
    marginTop: space[2],
    width: '78%',
  },
  receiptLineShort: {
    backgroundColor: 'rgba(21, 23, 26, 0.18)',
    borderRadius: 999,
    height: 7,
    marginTop: space[2],
    width: '42%',
  },
  receiptNotch: {
    alignSelf: 'center',
    backgroundColor: 'rgba(21, 23, 26, 0.1)',
    borderRadius: 999,
    height: 4,
    marginBottom: space[4],
    width: 56,
  },
  receiptPreview: {
    backgroundColor: '#F7F1E4',
    borderRadius: 18,
    maxWidth: 218,
    minHeight: 326,
    padding: space[5],
    shadowColor: '#000',
    shadowOffset: { height: 20, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    transform: [{ rotate: '-2deg' }],
    width: '78%',
  },
  receiptRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space[2],
  },
  receiptStore: {
    color: 'rgba(21, 23, 26, 0.62)',
    fontFamily: fontFamily.mono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
  },
  receiptTotal: {
    color: 'rgba(21, 23, 26, 0.7)',
    fontFamily: fontFamily.mono,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'right',
  },
  roundButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 23,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  screen: {
    backgroundColor: cameraBg,
    flex: 1,
  },
  shutterFlash: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  sideAction: {
    alignItems: 'center',
    gap: space[2],
    justifyContent: 'center',
    minWidth: 72,
    paddingVertical: space[2],
  },
  sideActionText: {
    color: 'rgba(247, 244, 234, 0.78)',
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  statusDot: {
    backgroundColor: colors.amber,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  statusDotOff: {
    backgroundColor: 'rgba(247, 244, 234, 0.38)',
  },
  statusText: {
    color: 'rgba(247, 244, 234, 0.78)',
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  statusWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: space[2],
    marginTop: space[4],
    maxWidth: 318,
    minHeight: 36,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topTitle: {
    color: cameraText,
    fontFamily: fontFamily.sans,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 22,
  },
  viewport: {
    alignItems: 'center',
    backgroundColor: cameraPanel,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 34,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    marginTop: space[6],
    overflow: 'hidden',
  },
});
