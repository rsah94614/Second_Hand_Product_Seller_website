import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

type ToastType = "success" | "error";

type ToastState = {
  message: string;
  type: ToastType;
};

type ToastOptions = {
  type?: ToastType;
  duration?: number;
};

type ToastContextValue = {
  showToast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_STYLES = {
  success: {
    shell: "border-emerald-200 bg-emerald-50 shadow-emerald-900/10 dark:border-emerald-500/30 dark:bg-emerald-950",
    iconBg: "bg-emerald-600",
    text: "text-emerald-800 dark:text-emerald-200",
    icon: "checkmark" as const,
    haptic: Haptics.NotificationFeedbackType.Success,
  },
  error: {
    shell: "border-red-200 bg-red-50 shadow-red-900/10 dark:border-red-500/30 dark:bg-red-950",
    iconBg: "bg-red-600",
    text: "text-red-800 dark:text-red-200",
    icon: "alert" as const,
    haptic: Haptics.NotificationFeedbackType.Error,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const type = options.type || "success";
    const duration = options.duration || 2600;

    if (timerRef.current) clearTimeout(timerRef.current);

    setToast({ message, type });
    void Haptics.notificationAsync(TOAST_STYLES[type].haptic).catch(() => {});
    timerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const styles = toast ? TOAST_STYLES[toast.type] : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View className="flex-1">
        {children}
        {toast && styles ? (
          <View pointerEvents="none" className="absolute left-5 right-5 top-12 z-50">
            <View className={`flex-row items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg ${styles.shell}`}>
              <View className={`mt-0.5 h-6 w-6 items-center justify-center rounded-full ${styles.iconBg}`}>
                <Ionicons name={styles.icon} size={15} color="#ffffff" />
              </View>
              <Text className={`flex-1 text-[14px] font-outfit-sb ${styles.text}`}>
                {toast.message}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
