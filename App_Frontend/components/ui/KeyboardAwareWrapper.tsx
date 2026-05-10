import { KeyboardAvoidingView, Platform, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";

interface KeyboardAwareWrapperProps {
  children: ReactNode;
  style?: ViewStyle;
  offset?: number;
  useSafeArea?: boolean;
}

/**
 * KeyboardAwareWrapper
 * 
 * Uses standard KeyboardAvoidingView with platform-specific behaviors.
 * - iOS: Uses 'padding' behavior with an optional offset.
 * - Android screens: Let the OS handle resizing.
 * - Android modals: Use 'height' because modal windows do not always resize
 *   with the host activity.
 */
export function KeyboardAwareWrapper({
  children,
  style,
  offset = 0,
  useSafeArea = true,
}: KeyboardAwareWrapperProps) {
  // On iOS, 'padding' is the most reliable.
  const behavior = Platform.OS === "ios" ? "padding" : useSafeArea ? undefined : "height";
  const keyboardVerticalOffset = Platform.OS === "ios" ? offset : 0;

  const content = (
    <KeyboardAvoidingView
      behavior={behavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </KeyboardAvoidingView>
  );

  if (useSafeArea) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1 }}>
        {content}
      </SafeAreaView>
    );
  }

  return content;
}
