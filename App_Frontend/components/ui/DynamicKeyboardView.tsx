import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReactNode } from "react";
import type { ViewStyle } from "react-native";
import { KeyboardAwareWrapper } from "./KeyboardAwareWrapper";

/**
 * Props for the DynamicKeyboardView component
 */
interface DynamicKeyboardViewProps {
  /** The content to wrap with keyboard avoidance */
  children: ReactNode;
  /** Optional custom style for the wrapper */
  style?: ViewStyle;
  /** Optional custom offset for keyboard avoidance (overrides dynamic calculation) */
  offset?: number;
}

/**
 * DynamicKeyboardView Component
 *
 * A wrapper component for screens with headers that need keyboard handling.
 * This component automatically gets the header height and safe area insets,
 * then passes them to KeyboardAwareWrapper for proper keyboard avoidance.
 *
 * This component is designed for non-tab screens that have headers and need
 * to handle keyboard appearance correctly. It combines dynamic header height
 * detection with safe area awareness to ensure input fields remain visible
 * when the virtual keyboard appears.
 *
 * Platform-specific behavior:
 * - iOS: Uses dynamic offset calculated as headerHeight + safeAreaInsets.top + 10px buffer
 * - Android: Uses 0px offset as Android handles keyboard with adjustResize
 *
 * @example
 * ```tsx
 * // Basic usage in a screen with a header
 * export function MyScreen() {
 *   return (
 *     <DynamicKeyboardView>
 *       <ScrollView>
 *         <TextInput placeholder="Enter text" />
 *       </ScrollView>
 *     </DynamicKeyboardView>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom style
 * export function MyScreen() {
 *   return (
 *     <DynamicKeyboardView style={{ backgroundColor: '#fff' }}>
 *       <ScrollView>
 *         <TextInput placeholder="Enter text" />
 *       </ScrollView>
 *     </DynamicKeyboardView>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom offset override
 * export function MyScreen() {
 *   return (
 *     <DynamicKeyboardView offset={100}>
 *       <ScrollView>
 *         <TextInput placeholder="Enter text" />
 *       </ScrollView>
 *     </DynamicKeyboardView>
 *   );
 * }
 * ```
 *
 * @param props - Component props
 * @returns The wrapped component with dynamic keyboard avoidance
 */
export function DynamicKeyboardView({
  children,
  style,
  offset,
}: DynamicKeyboardViewProps) {
  // Get dynamic header height from react-navigation
  const headerHeight = useHeaderHeight();

  // Get safe area insets from react-native-safe-area-context
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <KeyboardAwareWrapper
      headerHeight={headerHeight}
      safeAreaInsets={{
        top: safeAreaInsets.top,
        bottom: safeAreaInsets.bottom,
      }}
      offset={offset}
      useSafeArea={false}
      style={style}
    >
      {children}
    </KeyboardAwareWrapper>
  );
}
