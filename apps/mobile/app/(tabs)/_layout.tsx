import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, nativeTypography } from '@sackerl/tokens';
import { iconDefinitions, resolveIconName, type IconName } from '@sackerl/ui';
import { Tabs } from 'expo-router';
import type { JSX } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type TabConfig = {
  readonly icon: IconName;
  readonly label: string;
  readonly name: string;
  readonly primary?: boolean | undefined;
};

const tabs: readonly TabConfig[] = [
  { icon: 'home', label: 'Home', name: 'index' },
  { icon: 'grid', label: 'Stock', name: 'stock' },
  { icon: 'scan', label: 'Scan', name: 'scan', primary: true },
  { icon: 'clock', label: 'Expiring', name: 'expiring' },
  { icon: 'settings', label: 'Settings', name: 'settings' },
];

const typography =
  Platform.OS === 'ios'
    ? nativeTypography.ios
    : Platform.OS === 'android'
      ? nativeTypography.android
      : nativeTypography.fallback;

type TabIconProps = {
  readonly color: string;
  readonly name: IconName;
  readonly size?: number | undefined;
  readonly sw?: number | undefined;
};

function TabIcon({ color, name, size = 22, sw = 1.6 }: TabIconProps): JSX.Element {
  const resolvedName = resolveIconName(name);

  return (
    <Svg
      accessibilityElementsHidden
      fill="none"
      height={size}
      importantForAccessibility="no-hide-descendants"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={sw}
      viewBox="0 0 24 24"
      width={size}
    >
      {iconDefinitions[resolvedName].map((primitive, index) => {
        if (primitive.type === 'path') {
          return <Path d={primitive.d} key={index} />;
        }

        if (primitive.type === 'circle') {
          return <Circle cx={primitive.cx} cy={primitive.cy} key={index} r={primitive.r} />;
        }

        return (
          <Rect
            height={primitive.height}
            key={index}
            rx={primitive.rx}
            width={primitive.width}
            x={primitive.x}
            y={primitive.y}
          />
        );
      })}
    </Svg>
  );
}

function SackerlTabBar({ descriptors, navigation, state }: BottomTabBarProps): JSX.Element | null {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index];

  if (activeRoute?.name === 'scan') {
    return null;
  }

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {tabs.map((tab) => {
        const routeIndex = state.routes.findIndex((route) => route.name === tab.name);
        const route = state.routes[routeIndex];
        const isActive = state.index === routeIndex;
        const color = isActive ? colors.ink : colors.muteSoft;
        const options = route ? descriptors[route.key]?.options : undefined;

        return (
          <Pressable
            accessibilityLabel={options?.tabBarAccessibilityLabel ?? tab.label}
            accessibilityRole="button"
            accessibilityState={isActive ? { selected: true } : undefined}
            key={tab.name}
            onPress={() => {
              if (route && !isActive) {
                navigation.navigate(route.name, route.params);
              }
            }}
            style={[styles.tab, tab.primary ? styles.primaryTab : null]}
          >
            {tab.primary ? (
              <View style={styles.fab}>
                <TabIcon color={colors.ink} name={tab.icon} size={22} sw={2} />
              </View>
            ) : (
              <TabIcon color={color} name={tab.icon} size={22} sw={1.6} />
            )}
            <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <SackerlTabBar {...props} />}>
      {tabs.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderColor: colors.ink,
    borderRadius: 28,
    borderWidth: 1.5,
    height: 56,
    justifyContent: 'center',
    shadowColor: colors.amber,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.36,
    shadowRadius: 24,
    width: 56,
  },
  primaryTab: {
    marginTop: -24,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    minHeight: 62,
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  tabBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(250, 250, 247, 0.92)',
    borderColor: colors.hairline,
    borderTopWidth: 1,
    flexDirection: 'row',
    minHeight: 88,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  tabLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: typography.caption.fontWeight,
    lineHeight: 12,
  },
});
