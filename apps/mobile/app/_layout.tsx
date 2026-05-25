import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen
          name="receipt-scan"
          options={{ title: "Scan Receipt" }}
        />

        <Stack.Screen
          name="archived-products"
          options={{ title: "Archived Products" }}
        />

        <Stack.Screen
          name="products/new"
          options={{ title: "Add Product" }}
        />

        <Stack.Screen
          name="products/[id]"
          options={{ title: "Product Details" }}
        />

        <Stack.Screen
          name="products/[id]/edit"
          options={{ title: "Edit Product" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
