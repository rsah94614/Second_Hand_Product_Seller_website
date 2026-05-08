import { KeyboardAvoidingView, Platform, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";

/**
 * Safe area insets configuration
 */
interface SafeAreaInsets {
  /** Top safe area inset in pixels */
  top?: number;
  /** Bottom safe area inset in pixels */
  bottom?: number;
}

/**
 * Props for the KeyboardAwareWrapper component
 */
interface KeyboardAwareWrapperProps {
  /** The content to wrap with keyboard avoidance */
  children: ReactNode;
  /** Optional custom style for the wrapper */
  style?: ViewStyle;
  /** Optional custom offset for keyboard avoidance (overrides platform default) */
  offset?: number;
  /** Whether to use SafeAreaView (default: true) */
  useSafeArea?: boolean;
  /** Optional dynamic header height in pixels */
  headerHeight?: number;
  /** Optional safe area insets for dynamic offset calculation */
  safeAreaInsets?: SafeAreaInsets;
}

/**
 * KeyboardAwareWrapper Component
 *
 * A reusable wrapper component that handles keyboard avoidance consistently across iOS and Android.
 * This component wraps screen content with proper keyboard handling to ensure input fields
 * remain visible when the virtual keyboard appears.
 *
 * Platform-specific behavior:
 * - iOS: Uses dynamic offset calculated as (headerHeight || 0) + (safeAreaInsets?.top || 0) + 10
 *        Falls back to 90px if no dynamic values provided
 * - Android: Uses 0px offset as Android handles keyboard with adjustResize
 *
 * @example
 * ```tsx
 * // Basic usage with default offset
 * <KeyboardAwareWrapper>
 *   <ScrollView>
 *     <TextInput placeholder="Enter text" />
 *   </ScrollView>
 * </KeyboardAwareWrapper>
 * ```
 *
 * @example
 * ```tsx
 * // Dynamic offset calculation
 * <KeyboardAwareWrapper
 *   headerHeight={60}
 *   safeAreaInsets={{ top: 20 }}
 * >
 *   <ScrollView>
 *     <TextInput placeholder="Enter text" />
 *   </ScrollView>
 * </KeyboardAwareWrapper>
 * ```
 *
 * @param props - Component props
 * @returns The wrapped component with keyboard avoidance
 */
export function KeyboardAwareWrapper({
  children,
  style,
  offset,
  useSafeArea = true,
  headerHeight,
  safeAreaInsets,
}: KeyboardAwareWrapperProps) {
  // Calculate platform-specific offset
  // If explicit offset is provided, use it
  if (offset !== undefined) {
    const behavior = Platform.OS === "ios" ? "padding" : "height";
    const content = (
      <KeyboardAvoidingView
        behavior={behavior}
        keyboardVerticalOffset={offset}
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

  // Calculate dynamic offset based on platform
  let platformOffset: number;

  if (Platform.OS === "ios") {
    // iOS: (headerHeight || 0) + (safeAreaInsets?.top || 0) + 10
    // Falls back to 90px if no dynamic values provided
    if (headerHeight !== undefined || safeAreaInsets?.top !== undefined) {
      platformOffset =
        (headerHeight || 0) + (safeAreaInsets?.top || 0) + 10;
    } else {
      platformOffset = 90;
    }
  } else {
    // Android: 0px (Android handles keyboard differently with adjustResize)
    platformOffset = 0;
  }

  // Determine behavior based on platform
  // iOS uses "padding" to add space between keyboard and content
  // Android uses "height" as it handles keyboard with adjustResize
  const behavior = Platform.OS === "ios" ? "padding" : "height";

  const content = (
    <KeyboardAvoidingView
      behavior={behavior}
      keyboardVerticalOffset={platformOffset}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </KeyboardAvoidingView>
  );

  // Wrap with SafeAreaView if enabled
  if (useSafeArea) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1 }}>
        {content}
      </SafeAreaView>
    );
  }

  return content;
}
