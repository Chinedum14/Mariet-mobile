import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors } from "./src/theme";
import { MarketsProvider } from "./src/MarketsContext";
import LoginScreen from "./src/screens/LoginScreen";
import MarketsScreen from "./src/screens/MarketsScreen";
import EditorScreen from "./src/screens/EditorScreen";
import EditMarketScreen from "./src/screens/EditMarketScreen";

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
    notification: colors.accent,
  },
};

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTitleStyle: { color: colors.text },
  headerTintColor: colors.accent,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <MarketsProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Markets" component={MarketsScreen} options={{ title: "PlayMarkets" }} />
            <Stack.Screen name="Editor" component={EditorScreen} options={{ title: "" }} />
            <Stack.Screen name="EditMarket" component={EditMarketScreen} options={{ presentation: "modal" }} />
          </Stack.Navigator>
        </NavigationContainer>
      </MarketsProvider>
    </SafeAreaProvider>
  );
}
