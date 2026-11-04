import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PlacementToastHost } from '../components/PlacementToast';
import { AuthRouteGate, AuthSessionProvider } from '../lib/auth-session';

export default function RootLayout() {
  return (
    <AuthSessionProvider>
      <AuthRouteGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="storage-zones" />
        <Stack.Screen name="add-item" />
        <Stack.Screen name="receipt-review/[id]" />
        <Stack.Screen name="receipt-placement/[id]" />
        <Stack.Screen name="recipe/[id]" />
        <Stack.Screen name="suggestions" />
        <Stack.Screen name="shopping-list" />
        <Stack.Screen name="use-soon" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <PlacementToastHost />
      <StatusBar style="auto" />
    </AuthSessionProvider>
  );
}
