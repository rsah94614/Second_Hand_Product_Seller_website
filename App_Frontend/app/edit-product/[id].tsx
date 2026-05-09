import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { getProduct, updateProduct } from "../../lib/api/products";
import { PRODUCT_CONDITIONS } from "../../lib/product-options";
import { getImageUri } from "../../lib/product-image";
import { parseApiError, formatErrorForDisplay } from "../../lib/utils/errorHandler";
import { DynamicKeyboardView } from "../../components/ui/DynamicKeyboardView";

type Picked = { uri: string; mimeType: string; fileSize?: number | null; fileName?: string | null };

const getParamValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
};

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const productId = getParamValue(id);
  const { user, loading: authLoading } = useAuth();
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
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId),
    enabled: !!productId && !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/(auth)/login" as never);
    }
  }, [authLoading, user]);

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

  const setF = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission", "Photo access is required.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 5,
    });

    if (!res.canceled && res.assets?.length) {
      const next = res.assets.map((asset) => ({
        uri: asset.uri,
        mimeType: asset.mimeType || "image/jpeg",
        fileSize: asset.fileSize,
        fileName: asset.fileName,
      }));
      setImages((prev) => [...prev, ...next].slice(0, 5));
    }
  };

  const submit = async () => {
    if (!productId || !product || !user) return;

    const sellerId =
      product.seller && typeof product.seller === "object"
        ? String((product.seller as { _id?: string })._id)
        : String(product.seller || "");

    if (sellerId !== user.id) {
      Alert.alert("Access", "You can only edit your own listings.");
      return;
    }

    const oversizedImage = images.find((img) => Number(img.fileSize || 0) > 5 * 1024 * 1024);
    if (oversizedImage) {
      Alert.alert("Image Too Large", "One selected image is larger than 5 MB.");
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

      (product.images || []).forEach((image: string | { url?: string }) => {
        fd.append("existingImages", getImageUri(image));
      });

      for (let i = 0; i < images.length; i += 1) {
        const img = images[i];
        const mimeType = img.mimeType || "image/jpeg";
        const ext = mimeType.split("/")[1] || "jpg";

        if (Platform.OS === "web") {
          const response = await fetch(img.uri);
          const blob = await response.blob();
          fd.append("images", blob, `img_${i}.${ext}`);
        } else {
          fd.append("images", {
            uri: img.uri,
            name: `img_${i}.${ext}`,
            type: mimeType,
          } as unknown as Blob);
        }
      }

      await updateProduct(productId, fd);
      Alert.alert("Saved", "Listing updated.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error: any) {
      const parsedError = parseApiError(error, "Update failed.");
      if (error.message === "Network Error") {
        Alert.alert("Network Error", "Could not reach the server. Check your connection and try again.");
        return;
      }
      Alert.alert("Error", formatErrorForDisplay(parsedError));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user || !productId || isLoading) {
    return <CenteredMessage loading message={!productId ? "Product not selected." : undefined} />;
  }

  if (!product) {
    return <CenteredMessage message="Product not found." />;
  }

  const sellerId =
    product.seller && typeof product.seller === "object"
      ? String((product.seller as { _id?: string })._id || "")
      : String(product.seller || "");

  if (sellerId !== user.id) {
    return <CenteredMessage message="You can only edit your own listings." />;
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <DynamicKeyboardView>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[14px] font-outfit text-slate-500 dark:text-slate-400 leading-5 mb-3">
          Add new images to replace gallery (optional). Existing images stay if you add none.
        </Text>

        <ActionButton title={`New photos (${images.length})`} variant="outline" onPress={pickImages} />

        <Field label="Title" value={form.title} onChangeText={(value) => setF("title", value)} />
        <Field
          label="Description"
          value={form.description}
          onChangeText={(value) => setF("description", value)}
          multiline
        />
        <Field label="Category" value={form.category} onChangeText={(value) => setF("category", value)} />

        <Text className="mt-4 text-[14px] font-outfit-m text-slate-700 dark:text-slate-300 mb-2">Condition</Text>
        <View className="flex-row flex-wrap gap-2 mb-1">
          {PRODUCT_CONDITIONS.map((condition) => (
            <ActionButton
              key={condition}
              title={condition}
              variant={form.condition === condition ? "primary" : "outline"}
              compact
              onPress={() => setF("condition", condition)}
            />
          ))}
        </View>

        <Field
          label="Price"
          value={form.price}
          onChangeText={(value) => setF("price", value)}
          keyboardType="numeric"
        />
        <Field label="Location" value={form.location} onChangeText={(value) => setF("location", value)} />
        <Field
          label="Email"
          value={form.email}
          onChangeText={(value) => setF("email", value)}
          keyboardType="email-address"
        />

        <View className="mt-6">
          <ActionButton title="Save changes" loading={submitting} onPress={submit} />
        </View>
      </ScrollView>
      </DynamicKeyboardView>
    </View>
  );
}

function CenteredMessage({ loading, message }: { loading?: boolean; message?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950 px-6">
      {loading ? <ActivityIndicator size="large" color="#6366f1" /> : null}
      {message ? (
        <Text className="mt-3 text-center text-[16px] font-outfit-sb text-slate-900 dark:text-slate-200">
          {message}
        </Text>
      ) : null}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
}) {
  return (
    <View className="mt-4">
      <Text className="text-[14px] font-outfit-m text-slate-700 dark:text-slate-300 mb-2">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType || "default"}
        placeholderTextColor="#94a3b8"
        className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 text-[16px] font-outfit text-slate-900 dark:text-white ${
          multiline ? "min-h-[120px] text-top" : "min-h-[54px]"
        }`}
        style={multiline ? { textAlignVertical: "top" } : undefined}
      />
    </View>
  );
}

function ActionButton({
  title,
  onPress,
  variant = "primary",
  compact,
  loading,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline";
  compact?: boolean;
  loading?: boolean;
}) {
  const isOutline = variant === "outline";

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={`rounded-2xl items-center justify-center px-4.5 py-3 ${
        compact ? "min-h-[42px] mb-2" : "min-h-[54px]"
      } ${
        isOutline
          ? "border border-slate-300 dark:border-slate-700 bg-transparent active:bg-slate-100 dark:active:bg-slate-800"
          : "bg-primary-600 active:bg-primary-700"
      } ${loading ? "opacity-60" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? "#6366f1" : "#ffffff"} />
      ) : (
        <Text
          className={`text-[15px] font-outfit-sb ${
            isOutline ? "text-slate-700 dark:text-slate-200" : "text-white"
          }`}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
