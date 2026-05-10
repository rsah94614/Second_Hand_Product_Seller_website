import { Animated, Keyboard, type KeyboardEvent, Platform, View, type ViewStyle } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { type ReactNode, useEffect, useRef } from "react";

interface KeyboardShiftViewProps {
  children: ReactNode;
  style?: ViewStyle;
  extraOffset?: number;
}

function useSafeHeaderHeight() {
  try {
    return useHeaderHeight();
  } catch {
    return 0;
  }
}

export function KeyboardShiftView({
  children,
  style,
  extraOffset = 0,
}: KeyboardShiftViewProps) {
  const headerHeight = useSafeHeaderHeight();
  const bottomPad = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Android and iOS behave differently – get the right events
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    
    // Some Android devices fire frame change events instead of show/hide reliably
    const changeEvent = Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidChangeFrame";

    const animateTo = (height: number) => {
      Animated.spring(bottomPad, {
        toValue: height > 0 ? height + extraOffset : 0,
        friction: 8,
        tension: 45,
        useNativeDriver: false,
      }).start();
    };

    const onShow = (e: KeyboardEvent) => {
      animateTo(e.endCoordinates.height);
    };

    const onHide = () => {
      animateTo(0);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    const changeSub = Keyboard.addListener(changeEvent, onShow);

    return () => {
      showSub.remove();
      hideSub.remove();
      changeSub.remove();
    };
  }, [bottomPad, extraOffset, headerHeight]);

  return (
    <Animated.View style={[{ flex: 1, paddingBottom: bottomPad }, style]}>
      {children}
    </Animated.View>
  );
}
