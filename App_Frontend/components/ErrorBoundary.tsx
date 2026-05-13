import React from "react";
import { View, Text, Pressable } from "react-native";

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

/**
 * Catches runtime render errors so a single broken component never
 * takes down the entire app. Wrap critical subtrees with this.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <MyScreen />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: send to Sentry / crash-reporting service
    console.error("[ErrorBoundary] Caught error:", error.message, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View className="flex-1 items-center justify-center px-8 bg-slate-50 dark:bg-slate-950">
          <Text className="text-4xl mb-4">⚠️</Text>
          <Text className="text-[20px] font-outfit-b text-slate-900 dark:text-white text-center mb-2">
            Something went wrong
          </Text>
          <Text className="text-[14px] font-outfit text-slate-500 dark:text-slate-400 text-center mb-8">
            {this.state.error?.message || "An unexpected error occurred."}
          </Text>
          <Pressable
            onPress={this.handleReset}
            className="bg-primary-600 px-6 py-3 rounded-2xl active:bg-primary-700"
          >
            <Text className="text-white font-outfit-sb text-[15px]">Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
