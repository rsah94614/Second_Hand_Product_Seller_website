import React, { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";

interface ChatKeyboardAvoidingViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * ChatKeyboardAvoidingView
 * 
 * Specifically optimized for the Chat Thread screen.
 * On iOS: Uses 'padding' with header height offset.
 * On Android: Uses 'height' or undefined depending on OS behavior.
 * 
 * This component addresses the "occasional" overlap by ensuring
 * that the container consistently resizes when the keyboard appears.
 */
export function ChatKeyboardAvoidingView({
  children,
  style,
}: ChatKeyboardAvoidingViewProps) {
  // Get the height of the navigation header if available
  const headerHeight = useHeaderHeight();

  // On Android, 'resize' mode in app.json usually handles things,
  // but with edgeToEdge enabled, 'height' behavior often fixes intermittent overlaps.
  const behavior = Platform.OS === "ios" ? "padding" : "height";
  
  // Offset calculation: 
  // On iOS, we need to subtract the header height.
  // On Android, we usually need 0 or a very small offset if using 'height'.
  const verticalOffset = Platform.OS === "ios" ? headerHeight : 0;

  return (
    <KeyboardAvoidingView
      behavior={behavior}
      keyboardVerticalOffset={verticalOffset}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
