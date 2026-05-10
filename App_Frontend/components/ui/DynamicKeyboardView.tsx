import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareWrapper } from "./KeyboardAwareWrapper";
import type { ReactNode } from "react";
import { type ViewStyle } from "react-native";

/**
 * Props for the DynamicKeyboardView component
 */
interface DynamicKeyboardViewProps {
  /** The content to be wrapped by the keyboard avoiding view */
  children: ReactNode;
  /** Optional custom styles for the wrapper view */
  style?: ViewStyle;
  /** Optional custom offset to override the default dynamic calculation */
  offset?: number;
}

/**
 * A safe version of useHeaderHeight that returns 0 instead of throwing
 * if the navigation context is missing.
 */
function useSafeHeaderHeight() {
  try {
    return useHeaderHeight();
  } catch (e) {
    return 0;
  }
}

/**
 * DynamicKeyboardView Component
 *
 * A specialized wrapper that automatically calculates the necessary keyboard
 * offset based on the current navigation header height and safe area insets.
 * This ensures that input fields are correctly visible when the keyboard
 * appears, without hardcoding offsets for different screens.
 *
 * It wraps the KeyboardAwareWrapper and provides it with the dynamic values.
 *
 * @example
 * ```tsx
 * <Screen>
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
  const headerHeight = useSafeHeaderHeight();
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <KeyboardAwareWrapper
      style={style}
      offset={offset ?? (headerHeight + safeAreaInsets.top + 10)}
      useSafeArea={false}
    >
      {children}
    </KeyboardAwareWrapper>
  );
}
