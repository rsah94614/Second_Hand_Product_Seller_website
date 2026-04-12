import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Redirect, Stack, useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { Loading } from "../../components/Loading";
import { useAuth } from "../../context/AuthContext";
import { getProduct } from "../../lib/api/products";
import { placeOrder } from "../../lib/api/orders";
import { formatInr } from "../../lib/format";
import { getImageUri } from "../../lib/product-image";

export default function PlaceOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [qty, setQty] = useState("1");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
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
        phone: f.phone || user.phone || "",
      }));
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      placeOrder({
        productId: String(id),
        quantity: Math.max(1, parseInt(qty, 10) || 1),
        shippingDetails: { ...form },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      Alert.alert("Success", "Order placed.", [{ text: "OK", onPress: () => router.replace("/(tabs)/orders") }]);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Alert.alert("Error", e.response?.data?.message || "Order failed.");
    },
  });

  const setF = (key: keyof typeof form, v: string) => setForm((p) => ({ ...p, [key]: v }));

  const validateShipping = () => {
    const required: (keyof typeof form)[] = [
      "fullName",
      "phone",
      "addressLine1",
      "city",
      "state",
      "postalCode",
    ];
    const missing = required.filter((key) => !form[key].trim());

    if (missing.length > 0) {
      Alert.alert("Required", `Fill these fields: ${missing.join(", ")}`);
      return false;
    }

    return true;
  };

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!id || isLoading || !product) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const uri = getImageUri(product.images?.[0]);
  const q = Math.max(1, parseInt(qty, 10) || 1);
  const total = (product.price || 0) * q;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Place Order" }} />
      <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
        <View className="flex-row gap-3 py-4">
          <Image source={{ uri }} style={{ width: 96, height: 96, borderRadius: 12 }} />
          <View className="flex-1">
            <Text className="font-bold text-slate-900" numberOfLines={2}>
              {product.title}
            </Text>
            <Text className="mt-1 text-indigo-700">{formatInr(product.price)} each</Text>
            <Text className="mt-2 font-semibold">Total {formatInr(total)}</Text>
          </View>
        </View>
        <Text className="text-sm text-slate-600">Quantity</Text>
        <TextInput
          value={qty}
          onChangeText={setQty}
          keyboardType="numeric"
          className="mb-4 rounded-xl border border-slate-200 px-3 py-2"
        />
        <Field label="Full name" value={form.fullName} onChange={(t) => setF("fullName", t)} />
        <Field label="Email" value={form.email} onChange={(t) => setF("email", t)} />
        <Field label="Phone" value={form.phone} onChange={(t) => setF("phone", t)} />
        <Field label="Address line 1" value={form.addressLine1} onChange={(t) => setF("addressLine1", t)} />
        <Field label="Address line 2" value={form.addressLine2} onChange={(t) => setF("addressLine2", t)} />
        <Field label="Landmark" value={form.landmark} onChange={(t) => setF("landmark", t)} />
        <Field label="City" value={form.city} onChange={(t) => setF("city", t)} />
        <Field label="State" value={form.state} onChange={(t) => setF("state", t)} />
        <Field label="Postal code" value={form.postalCode} onChange={(t) => setF("postalCode", t)} />
        <View className="mt-6 mb-10">
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
    <View className="mb-3">
      <Text className="mb-1 text-sm text-slate-600">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
        placeholderTextColor="#94a3b8"
      />
    </View>
  );
}
