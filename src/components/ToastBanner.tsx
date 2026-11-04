import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, shadow } from "@/constants/theme";
import { useClinic } from "@/providers/ClinicProvider";

export function ToastBanner() {
  const insets = useSafeAreaInsets();
  const { toast, hideToast } = useClinic();
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = 0;
  }, [toast, translateY]);

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
    transform: [{ translateY: translateY.value }],
  }));

  if (!toast) return null;

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <Animated.View
        style={[
          styles.banner,
          shadow,
          animatedStyle,
          {
            top: insets.top + 12,
            backgroundColor: toast.tone === "error" ? colors.danger : colors.ink,
          },
        ]}
      >
        <Text style={styles.text}>{toast.message}</Text>
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
