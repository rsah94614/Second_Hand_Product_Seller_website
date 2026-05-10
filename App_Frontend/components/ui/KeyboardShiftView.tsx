/**
 * KeyboardShiftView
 *
 * Listens to raw Keyboard events and animates bottom padding to push
 * content above the keyboard. Works with softwareKeyboardLayoutMode: "nothing"
 * on Android so there is zero conflict with the OS resize behavior.
 */

import { Animated, Keyboard, type KeyboardEvent, Platform, type ViewStyle } from "react-native";
import { type ReactNode, useEffect, useRef } from "react";

interface KeyboardShiftViewProps {
  children: ReactNode;
  style?: ViewStyle;
  /** Extra spacing to add on top of the raw keyboard height (default: 0) */
  extraOffset?: number;
}

export function KeyboardShiftView({
  children,
  style,
  extraOffset = 0,
}: KeyboardShiftViewProps) {
  const bottomPad = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
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
  }, [bottomPad, extraOffset]);

  return (
    <Animated.View style={[{ flex: 1, paddingBottom: bottomPad }, style]}>
      {children}
    </Animated.View>
  );
}
