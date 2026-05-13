import { KeyboardAvoidingView, Platform, View, type ViewStyle } from "react-native";
import type { ReactNode } from "react";

interface KeyboardShiftViewProps {
  children: ReactNode;
  style?: ViewStyle;
  extraOffset?: number;
}

export function KeyboardShiftView({
  children,
  style,
  extraOffset = 0,
}: KeyboardShiftViewProps) {
  if (Platform.OS !== "ios") {
    return <View style={[{ flex: 1 }, style]}>{children}</View>;
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={extraOffset}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
