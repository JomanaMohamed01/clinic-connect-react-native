import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
import { ToastBanner } from "@/components/ToastBanner";
import { ClinicProvider } from "@/providers/ClinicProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const id = "remove-field-focus-ring";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent =
      "input, textarea, select, input:focus, textarea:focus, select:focus, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: none !important; outline-width: 0 !important; box-shadow: none !important; }";
    document.head.appendChild(style);

    const scrollbarId = "hide-scrollbars";
    if (!document.getElementById(scrollbarId)) {
      const scrollbarStyle = document.createElement("style");
      scrollbarStyle.id = scrollbarId;
      scrollbarStyle.textContent =
        "html, body, * { scrollbar-width: none !important; -ms-overflow-style: none !important; } *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }";
      document.head.appendChild(scrollbarStyle);
    }
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <ClinicProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: "fade",
            }}
          />
          <ToastBanner />
        </ClinicProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
