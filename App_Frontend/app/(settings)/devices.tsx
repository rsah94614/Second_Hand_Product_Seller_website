import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { EmptyState } from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { getMyDevices, removeDevice, trustDevice } from "../../lib/api/users";
import { Ionicons } from "@expo/vector-icons";
import { parseApiError, formatErrorForDisplay } from "../../lib/utils/errorHandler";
import { useToast } from "../../components/ui/AppToast";

type Device = {
  _id: string;
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  lastIpAddress?: string;
  lastUsedAt?: string;
  isTrusted?: boolean;
  isActive?: boolean;
};

const deviceIcon = (type?: string): keyof typeof Ionicons.glyphMap => {
  if (type === "mobile") return "phone-portrait-outline";
  if (type === "tablet") return "tablet-portrait-outline";
  return "laptop-outline";
};

export default function DevicesScreen() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-devices"],
    queryFn: getMyDevices,
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: (deviceId: string) => removeDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-devices"] });
      showToast("Device removed.");
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to remove device.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const trustMutation = useMutation({
    mutationFn: (deviceId: string) => trustDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-devices"] });
      showToast("Device marked as trusted.");
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to trust device.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/(auth)/login");
    }
  }, [authLoading, user]);

  if (authLoading || !user) return <Screen safeAreaTop={false}><Loading /></Screen>;

  if (isLoading) {
    return <Screen safeAreaTop={false}><Loading /></Screen>;
  }

  const devices: Device[] = data?.devices || [];

  return (
    <Screen safeAreaTop={false} className="bg-slate-50 dark:bg-slate-950">
      {/* Description banner */}
      <View className="px-5 pt-4 pb-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <Text className="text-[13px] font-outfit text-slate-500 dark:text-slate-400">
          Devices currently logged into your account. Remove any you don&apos;t recognise.
        </Text>
      </View>

      <FlatList
        data={devices}
        keyExtractor={(d) => d._id}
        refreshing={isRefetching}
        onRefresh={refetch}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <View className="py-20">
            <EmptyState title="No devices found" message="No active devices on your account." />
          </View>
        }
        renderItem={({ item: d }) => (
          <View className="mb-3 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
            <View className="flex-row items-center gap-3 mb-3">
              <View className="h-11 w-11 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center">
                <Ionicons name={deviceIcon(d.deviceType)} size={22} color="#64748b" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2 flex-wrap">
                  <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white">
                    {d.deviceName || "Unknown Device"}
                  </Text>
                  {d.isTrusted && (
                    <View className="bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                      <Text className="text-[10px] font-outfit-b text-emerald-600 dark:text-emerald-400">Trusted</Text>
                    </View>
                  )}
                </View>
                <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400 mt-0.5">
                  {[d.browser, d.os].filter(Boolean).join(" · ")}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2 mb-3">
              {d.lastIpAddress && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="location-outline" size={12} color="#94a3b8" />
                  <Text className="text-[12px] font-outfit text-slate-400 dark:text-slate-500">{d.lastIpAddress}</Text>
                </View>
              )}
              {d.lastUsedAt && (
                <Text className="text-[12px] font-outfit text-slate-400 dark:text-slate-500">
                  · Last used {new Date(d.lastUsedAt).toLocaleDateString()}
                </Text>
              )}
            </View>

            <View className="flex-row gap-2">
              {!d.isTrusted && (
                <Pressable
                  onPress={() => trustMutation.mutate(d._id)}
                  disabled={trustMutation.isPending}
                  className="flex-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2.5 items-center"
                >
                  <Text className="text-[13px] font-outfit-sb text-emerald-700 dark:text-emerald-400">Trust</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  Alert.alert("Remove Device", "Remove this device from your account?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Remove",
                      style: "destructive",
                      onPress: () => removeMutation.mutate(d._id),
                    },
                  ]);
                }}
                disabled={removeMutation.isPending}
                className="flex-1 rounded-xl bg-red-50 dark:bg-red-950/30 px-3 py-2.5 items-center"
              >
                <Text className="text-[13px] font-outfit-sb text-red-600 dark:text-red-400">Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}
