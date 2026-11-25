import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, gradient, shadow } from "@/constants/theme";
import { useClinic } from "@/providers/ClinicProvider";

const SLIDE_MS = 320;
const HIDDEN_Y = -180;

export function ToastBanner() {
  const insets = useSafeAreaInsets();
  const { toast, hideToast } = useClinic();
  const [shown, setShown] = useState(toast);
  const translateY = useSharedValue(HIDDEN_Y);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (toast) {
      setShown(toast);
      return;
    }
    if (!shown) return;
    translateY.value = withTiming(HIDDEN_Y, { duration: SLIDE_MS, easing: Easing.in(Easing.ease) });
    opacity.value = withTiming(0, { duration: SLIDE_MS, easing: Easing.in(Easing.ease) }, (finished) => {
      if (finished) runOnJS(setShown)(null);
    });
  }, [toast, shown, opacity, translateY]);

  useEffect(() => {
    if (!toast || !shown) return;
    translateY.value = HIDDEN_Y;
    opacity.value = 0;
    translateY.value = withTiming(0, { duration: SLIDE_MS, easing: Easing.out(Easing.ease) });
    opacity.value = withTiming(1, { duration: SLIDE_MS, easing: Easing.out(Easing.ease) });
  }, [toast, shown, opacity, translateY]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hideToast, 2800);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  const pan = Gesture.Pan()
    .activeOffsetY([-10, 80])
    .onUpdate((event) => {
      translateY.value = Math.min(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY < -28 || event.velocityY < -600) {
        translateY.value = withTiming(-180, { duration: 180 }, (finished) => {
          if (finished) runOnJS(hideToast)();
        });
        return;
      }
      translateY.value = withTiming(0, { duration: 160 });
    });

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(hideToast)();
  });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!shown) return null;

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <Animated.View
        pointerEvents={toast ? "auto" : "none"}
        style={[styles.banner, shadow, animatedStyle, { top: insets.top + 12 }]}
      >
        <LinearGradient
          colors={gradient.peach}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        >
          <Text style={styles.text}>{shown.message}</Text>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 18,
    overflow: "hidden",
  },
  fill: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  text: {
    color: colors.white,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
  },
});
