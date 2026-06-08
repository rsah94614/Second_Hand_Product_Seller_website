import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useGlobalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View, InteractionManager, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { Loading } from "../../components/Loading";
import { useAuth } from "../../context/AuthContext";
import { getProduct } from "../../lib/api/products";
import { placeOrder } from "../../lib/api/orders";
import { formatInr } from "../../lib/format";
import { getImageUri } from "../../lib/product-image";
import { parseApiError, formatErrorForDisplay } from "../../lib/utils/errorHandler";
import { useToast } from "../../components/ui/AppToast";

export default function PlaceOrderScreen() {
  const [ready, setReady] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    if (ready && !authLoading && !user) {
      router.replace("/(auth)/login");
    }
  }, [ready, authLoading, user]);

  if (!ready || authLoading || !user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#020617" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return <PlaceOrderContent />;
}

function PlaceOrderContent() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        fullName: f.fullName || user.name || "",
        email: f.email || user.email || "",
      }));
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      placeOrder({
        productId: String(id),
        quantity: 1,
        shippingDetails: {
          ...form
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      showToast("Order placed successfully.");
      router.replace("/orders");
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Order failed.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const setF = (key: keyof typeof form, v: string) => setForm((p) => ({ ...p, [key]: v }));

  const validateShipping = () => {
    const required: (keyof typeof form)[] = [
      "fullName",
      "addressLine1",
    ];
    const missing = required.filter((key) => !form[key].trim());

    if (missing.length > 0) {
      Alert.alert("Required", `Fill these fields: ${missing.join(", ")}`);
      return false;
    }

    return true;
  };

  if (!id || isLoading || !product) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const uri = getImageUri(product.images?.[0]);
  const total = product.price || 0;

  return (
    <Screen>
      <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
        <View className="flex-row gap-3 py-4">
          <Image source={{ uri }} style={{ width: 96, height: 96, borderRadius: 12 }} />
          <View className="flex-1">
            <Text className="font-bold text-slate-900 dark:text-white" numberOfLines={2}>
              {product.title}
            </Text>
            <Text className="mt-1 text-xl font-semibold text-indigo-700 dark:text-indigo-400">{formatInr(total)}</Text>
          </View>
        </View>
        <Field label="Full Name*" value={form.fullName} onChange={(t) => setF("fullName", t)} />
        <Field label="Email" value={form.email} onChange={(t) => setF("email", t)} />
        <Field label="Hostel / Department / Meetup Spot*" value={form.addressLine1} onChange={(t) => setF("addressLine1", t)} />
        <Field label="Additional Note" value={form.addressLine2} onChange={(t) => setF("addressLine2", t)} />
        <Field label="Nearby Landmark" value={form.landmark} onChange={(t) => setF("landmark", t)} />

        <View className="mb-4 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
          <Text className="text-[13px] font-outfit leading-relaxed text-blue-800 dark:text-blue-300">
            Orders on CampusMitra are handled as on-campus meetups. Location will be saved under Gauhati University, Guwahati, Assam.
          </Text>
        </View>

        <View className="mt-2 mb-10">
          <Button
            title="Place order"
            loading={mutation.isPending}
            onPress={() => {
              if (!validateShipping()) {
                return;
              }
              mutation.mutate();
            }}
          />
        </View>
        <View className="h-20" />
        <View className="h-20" />
        <View className="h-20" />
        <View className="h-20" />
        <View className="h-10" />
      </ScrollView>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm text-slate-600 dark:text-slate-400 font-outfit-m">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white"
        placeholderTextColor="#94a3b8"
      />
    </View>
  );
}
