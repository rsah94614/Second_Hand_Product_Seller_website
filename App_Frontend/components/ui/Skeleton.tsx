import React, { useEffect } from "react";
import { useColorScheme, DimensionValue } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  className?: string;
  circle?: boolean;
};

export function Skeleton({
  width,
  height,
  borderRadius = 8,
  className = "",
  circle = false,
}: SkeletonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const baseStyle = {
    width: width,
    height: height,
    borderRadius: circle ? 9999 : borderRadius,
  };

  return (
    <Animated.View
      style={[baseStyle, animatedStyle]}
      className={`overflow-hidden ${
        isDark ? "bg-slate-800" : "bg-slate-200"
      } ${className}`}
    />
  );
}
