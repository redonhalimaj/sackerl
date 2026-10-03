import type { JSX } from 'react';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { markViewBox, wordmarkTracking, type LogoProps, type MarkProps } from './logo-data';

export function Mark({ color = '#2F6A20', size = 20 }: MarkProps): JSX.Element {
  return (
    <Svg
      accessibilityElementsHidden
      height={size * 1.08}
      importantForAccessibility="no-hide-descendants"
      viewBox={markViewBox}
      width={size}
    >
      <Path
        d="M9 7c0-2.5 1.4-4 3-4s3 1.5 3 4"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <Path
        d="M4.6 7.6h14.8l-1.2 14a2 2 0 0 1-2 1.9H7.8a2 2 0 0 1-2-1.9L4.6 7.6z"
        fill={color}
        fillOpacity="0.10"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <Path
        d="M12 11.5v7"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.55"
        strokeWidth="1.7"
      />
    </Svg>
  );
}

export function Logo({
  color = '#1B2418',
  markColor = '#2F6A20',
  size = 22,
}: LogoProps): JSX.Element {
  return (
    <View
      accessibilityLabel="sackerl"
      accessibilityRole="image"
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        gap: size * 0.32,
      }}
    >
      <Mark color={markColor} size={size * 0.95} />
      <Text
        style={{
          color,
          fontFamily: 'SF Pro Display',
          fontSize: size,
          fontWeight: '700',
          letterSpacing: wordmarkTracking * size,
          lineHeight: size,
        }}
      >
        sackerl
      </Text>
    </View>
  );
}
