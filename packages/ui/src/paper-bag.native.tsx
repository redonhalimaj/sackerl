import { useEffect, useState, type JSX } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Pattern,
  Rect,
  Stop,
  Text,
} from 'react-native-svg';

import {
  defaultPaperBagItems,
  paperBagDefaults,
  resolveNativePaperBagColor,
  resolvePaperBagItem,
  type PaperBagItem,
  type PaperBagProps,
} from './paper-bag-data';

type NativePaperBagItemProps = {
  readonly animated: boolean;
  readonly item: PaperBagItem;
};

function degrees(value: string): number {
  const parsed = Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function NativePaperBagItem({ animated, item }: NativePaperBagItemProps): JSX.Element {
  const resolvedItem = resolvePaperBagItem(item);
  const progress = useSharedValue(0);
  const delayMs = resolvedItem.delay * 1000;
  const r0 = degrees(resolvedItem.r0);
  const r1 = degrees(resolvedItem.r1);

  useEffect(() => {
    if (!animated) {
      progress.value = 0.55;
      return;
    }

    progress.value = 0;
    progress.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(1, {
          duration: paperBagDefaults.animationDuration * 1000,
          easing: Easing.bezier(0.55, 0.05, 0.7, 0.55),
        }),
        -1,
        false,
      ),
    );
  }, [animated, delayMs, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const y = interpolate(progress.value, [0, 0.55, 0.68, 1], [-90, 6, 22, 22]);
    const scale = interpolate(progress.value, [0, 0.55, 0.68, 1], [1, 1, 0.78, 0.78]);
    const opacity = interpolate(progress.value, [0, 0.12, 0.55, 0.68, 1], [0, 1, 1, 0, 0]);
    const rotate = interpolate(progress.value, [0, 0.55, 1], [r0, r1, r1]);

    return {
      opacity: animated ? opacity : 1,
      transform: [
        { translateX: resolvedItem.dx },
        { translateY: animated ? y : 6 },
        { scale: animated ? scale : 1 },
        { rotate: `${animated ? rotate : r1}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.item,
        {
          backgroundColor: resolveNativePaperBagColor(resolvedItem.color),
          borderRadius:
            resolvedItem.kind === 'circle' ? resolvedItem.width / 2 : Number(resolvedItem.radius),
          height: resolvedItem.height,
          marginLeft: resolvedItem.width / -2,
          marginTop: resolvedItem.height / -2,
          width: resolvedItem.width,
        },
        animatedStyle,
      ]}
    />
  );
}

export function PaperBag({
  animated = true,
  height = paperBagDefaults.height,
  items = defaultPaperBagItems,
  label = paperBagDefaults.label,
  width = paperBagDefaults.width,
}: PaperBagProps): JSX.Element {
  const [reduceMotion, setReduceMotion] = useState(false);
  const breathe = useSharedValue(0);
  const shouldAnimate = animated && !reduceMotion;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {
        setReduceMotion(false);
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!shouldAnimate) {
      breathe.value = 0;
      return;
    }

    breathe.value = withRepeat(
      withTiming(1, {
        duration: 5200,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [breathe, shouldAnimate]);

  const bagStyle = useAnimatedStyle(() => {
    const y = interpolate(breathe.value, [0, 1], [0, -1.5]);
    const rotate = interpolate(breathe.value, [0, 1], [-0.3, 0.3]);

    return {
      transform: [
        { translateY: shouldAnimate ? y : 0 },
        { rotate: `${shouldAnimate ? rotate : 0}deg` },
      ],
    };
  });

  return (
    <View style={[styles.root, { height, width }]}>
      {items.map((item, index) => (
        <NativePaperBagItem
          animated={shouldAnimate}
          item={item}
          key={`${item.dx}-${item.delay ?? 0}-${index}`}
        />
      ))}

      <Animated.View style={[styles.svgFrame, bagStyle]}>
        <Svg height="100%" viewBox="0 0 220 240" width="100%">
          <Defs>
            <LinearGradient id="skKraftGradNative" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor="#DCB587" />
              <Stop offset="0.55" stopColor="#C49862" />
              <Stop offset="1" stopColor="#A57945" />
            </LinearGradient>
            <LinearGradient id="skKraftBackNative" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor="#8E6638" />
              <Stop offset="1" stopColor="#6E4D26" />
            </LinearGradient>
            <Pattern
              height="4"
              id="skKraftFibersNative"
              patternUnits="userSpaceOnUse"
              width="4"
              x="0"
              y="0"
            >
              <Rect fill="transparent" height="4" width="4" />
              <Circle cx="1" cy="1" fill="rgba(74,53,32,0.18)" r="0.3" />
              <Circle cx="3" cy="2.6" fill="rgba(74,53,32,0.12)" r="0.25" />
            </Pattern>
          </Defs>

          <Ellipse cx="110" cy="232" fill="rgba(0,0,0,0.10)" rx="80" ry="5" />
          <Path
            d="M64 78 C64 38, 92 24, 110 24"
            fill="none"
            stroke="#6E4D26"
            strokeLinecap="round"
            strokeWidth="3.2"
          />
          <Path
            d="M156 78 C156 38, 128 24, 110 24"
            fill="none"
            stroke="#6E4D26"
            strokeLinecap="round"
            strokeWidth="3.2"
          />
          <Path
            d="M30 70 L33 220 Q33 232 47 232 L173 232 Q187 232 187 220 L190 70 Z"
            fill="url(#skKraftBackNative)"
          />
          <Path
            d="M30 70 L33 220 Q33 232 47 232 L173 232 Q187 232 187 220 L190 70 Z"
            fill="url(#skKraftGradNative)"
          />
          <Path
            d="M30 70 L33 220 Q33 232 47 232 L173 232 Q187 232 187 220 L190 70 Z"
            fill="url(#skKraftFibersNative)"
            opacity="0.6"
          />
          <Ellipse cx="110" cy="70" fill="#5B3E1F" opacity="0.85" rx="80" ry="8" />
          <Ellipse cx="110" cy="68" fill="#3D2A14" rx="78" ry="6" />
          <Path d="M30 70 L190 70 L186 82 L34 82 Z" fill="rgba(74,53,32,0.18)" />
          <Path d="M68 72 L70 230" stroke="rgba(74,53,32,0.28)" strokeWidth="0.7" />
          <Path d="M152 72 L150 230" stroke="rgba(74,53,32,0.28)" strokeWidth="0.7" />
          <Path d="M110 72 L110 230" stroke="rgba(74,53,32,0.18)" strokeWidth="0.5" />

          <G rotation="-2.4" origin="110, 158" x="110" y="158">
            <Rect
              fill="#FBF6EA"
              height="44"
              rx="1.5"
              stroke="#6E4D26"
              strokeWidth="0.7"
              width="76"
              x="-38"
              y="-22"
            />
            <Text
              fill="#3D2A14"
              fontFamily="ui-monospace"
              fontSize="9.5"
              letterSpacing="0"
              textAnchor="middle"
              x="0"
              y="-4"
            >
              {label}
            </Text>
            <Line stroke="#6E4D26" strokeWidth="0.5" x1="-28" x2="28" y1="2" y2="2" />
            <Text
              fill="#6E4D26"
              fontFamily="ui-monospace"
              fontSize="6"
              letterSpacing="0"
              textAnchor="middle"
              x="0"
              y="14"
            >
              EST · WIEN · 2026
            </Text>
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    left: '50%',
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { height: 1.5, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    top: '34%',
  },
  root: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  svgFrame: {
    height: '80%',
    transformOrigin: '50% 80%',
    width: '80%',
  },
});
