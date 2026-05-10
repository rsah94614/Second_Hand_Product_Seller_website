import { KeyboardAvoidingView, Platform, View, type ViewStyle } from "react-native";
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
 * - Android: Uses 'height' or no behavior to let the OS handle resizing,
 *   which is more stable with edgeToEdgeEnabled.
 */
export function KeyboardAwareWrapper({
  children,
  style,
  offset = 0,
  useSafeArea = true,
}: KeyboardAwareWrapperProps) {
  // On iOS, 'padding' is the most reliable.
  // On Android, 'height' or undefined works best with Expo's edge-to-edge.
  // We use 0 offset for Android as it usually handles the header/status bar automatically.
  const behavior = Platform.OS === "ios" ? "padding" : undefined;
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

