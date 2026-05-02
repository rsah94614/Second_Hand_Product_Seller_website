import { useQuery } from "@tanstack/react-query";
import { Redirect, useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Loading } from "../../components/Loading";
import { useAuth } from "../../context/AuthContext";
import { getProduct, updateProduct } from "../../lib/api/products";
import { PRODUCT_CONDITIONS } from "../../lib/product-options";
import { getImageUri } from "../../lib/product-image";

type Picked = { uri: string; mimeType: string };

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [images, setImages] = useState<Picked[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    condition: "",
    price: "",
    location: "",
    email: "",
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id!),
    enabled: !!id && !!user,
  });

  useEffect(() => {
    if (!product) return;
    const ci = product.contactInfo;
    const email = typeof ci === "object" && ci && "email" in ci ? String((ci as { email?: string }).email || "") : "";
    setForm({
      title: product.title || "",
      description: product.description || "",
      category: product.category || "",
      condition: product.condition || "",
      price: String(product.price ?? ""),
      location: product.location || "",
      email,
    });
  }, [product]);

  const setF = (key: keyof typeof form, v: string) => setForm((p) => ({ ...p, [key]: v }));

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 5,
    });
    if (!res.canceled && res.assets?.length) {
      const next = res.assets.map((a) => ({
        uri: a.uri,
        mimeType: a.mimeType || "image/jpeg",
      }));
      setImages((prev) => [...prev, ...next].slice(0, 5));
    }
  };

  const submit = async () => {
    if (!id || !product || !user) return;
    const sellerId =
      product.seller && typeof product.seller === "object"
        ? String((product.seller as { _id?: string })._id)
        : String(product.seller || "");
    if (sellerId !== user.id) {
      Alert.alert("Access", "You can only edit your own listings.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("category", form.category);
      fd.append("condition", form.condition);
      fd.append("price", form.price);
      fd.append("location", form.location.trim());
      fd.append("contactInfo", JSON.stringify({ email: form.email.trim() }));
      (product.images || []).forEach((im: string | { url?: string }) => {
        fd.append("existingImages", getImageUri(im));
      });
      images.forEach((img, i) => {
        const ext = img.uri.split(".").pop() || "jpg";
        fd.append("images", {
          uri: img.uri,
          name: `img_${i}.${ext}`,
          type: img.mimeType,
        } as unknown as Blob);
      });
      await updateProduct(String(id), fd);
      Alert.alert("Saved", "Listing updated.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert("Error", msg || "Update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!id || isLoading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen>
        <Text className="p-4">Not found.</Text>
      </Screen>
    );
  }

  const sellerId =
    product.seller && typeof product.seller === "object"
      ? String((product.seller as { _id?: string })._id || "")
      : String(product.seller || "");

  if (sellerId !== user.id) {
    return (
      <Screen>
        <Text className="p-4">You can only edit your own listings.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
        <Text className="mb-2 text-sm text-slate-600">
          Add new images to replace gallery (optional). Existing images stay if you add none.
        </Text>
        <Button title={`New photos (${images.length})`} variant="outline" onPress={pickImages} />
        <Input label="Title" value={form.title} onChangeText={(t) => setF("title", t)} />
        <Input label="Description" value={form.description} onChangeText={(t) => setF("description", t)} multiline />
        <Input label="Category" value={form.category} onChangeText={(t) => setF("category", t)} />
        <Text className="mb-1 text-sm font-medium text-slate-700">Condition</Text>
        <View className="mb-3 flex-row flex-wrap gap-2">
          {PRODUCT_CONDITIONS.map((c) => (
            <Button
              key={c}
              title={c}
              variant={form.condition === c ? "primary" : "outline"}
              onPress={() => setF("condition", c)}
            />
          ))}
        </View>
        <Input label="Price" value={form.price} onChangeText={(t) => setF("price", t)} keyboardType="numeric" />
        <Input label="Location" value={form.location} onChangeText={(t) => setF("location", t)} />
        <Input label="Email" value={form.email} onChangeText={(t) => setF("email", t)} keyboardType="email-address" />
        <View className="mb-10 mt-4">
          <Button title="Save changes" onPress={submit} loading={submitting} />
        </View>
      </ScrollView>
    </Screen>
  );
}
