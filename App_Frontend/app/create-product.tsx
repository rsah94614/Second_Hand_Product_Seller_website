import { useQuery } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, Text, View, Pressable, Platform, KeyboardAvoidingView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Screen } from "../components/ui/Screen";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { createProduct, getProductCategories } from "../lib/api/products";
import { PRODUCT_CONDITIONS } from "../lib/product-options";
import { Ionicons } from "@expo/vector-icons";
import { parseApiError, formatErrorForDisplay } from "../lib/utils/errorHandler";

const LISTING_POLICIES = [
  {
    icon: "🚀",
    title: "How CampusMitra Helps You",
    items: [
      "Your listing reaches all verified students on your campus.",
      "Built-in chat so buyers contact you directly — no middlemen.",
      "Wishlist & price-drop alerts bring buyers back to your listing.",
      "Listings auto-expire after 60 days (you can relist).",
      "Free platform — no commission or fees ever.",
    ],
  },
  {
    icon: "✅",
    title: "Listing Guidelines",
    items: [
      "Use clear, honest photos — at least 1 required (2 for electronics).",
      "Set a fair price — you can negotiate in chat.",
      "Describe the actual condition accurately.",
      "Only list items you physically own and can hand over on campus.",
    ],
  },
  {
    icon: "🚫",
    title: "Not Allowed",
    items: [
      "Counterfeit, stolen, or prohibited items.",
      "Digital goods, services, or subscriptions.",
      "Misleading titles or fake photos.",
      "Listing the same item multiple times simultaneously.",
    ],
  },
  {
    icon: "🤝",
    title: "Safety & Meetup",
    items: [
      "Always meet in a public campus location (Library, Main Gate, Canteen, etc.).",
      "Never share personal financial details in chat.",
      "Use the in-app confirmation photo after completing a deal.",
      "Report suspicious buyers/sellers immediately.",
    ],
  },
  {
    icon: "💰",
    title: "Pricing & Payments",
    items: [
      "All payments are handled directly between buyer and seller (cash on meetup).",
      "Never pay in advance before seeing the item.",
      "Disputes can be filed through the app if something goes wrong.",
    ],
  },
  {
    icon: "⚠️",
    title: "Account Consequences",
    items: [
      "Misleading listings may be removed without notice.",
      "Repeated violations lead to account suspension.",
      "No-shows affect your trust score and reputation.",
      "Verified sellers get a badge — builds buyer confidence.",
    ],
  },
];

type Picked = { uri: string; mimeType: string };

export default function CreateProductScreen() {
  const { user } = useAuth();
  const [images, setImages] = useState<Picked[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    condition: "",
    price: "",
    location: "",
    email: "",
  });

  const { data: catRes } = useQuery({
    queryKey: ["product-categories"],
    queryFn: getProductCategories,
  });

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        location: f.location || user.location || "",
        email: f.email || user.email || "",
      }));
    }
  }, [user]);

  const setF = (key: keyof typeof form, v: string) => setForm((p) => ({ ...p, [key]: v }));

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission", "Photo access is required.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 5 - images.length,
    });
    if (!res.canceled && res.assets?.length) {
      const next = res.assets.map((a) => ({
        uri: a.uri,
        mimeType: a.mimeType || "image/jpeg",
      }));
      setImages((prev) => [...prev, ...next].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!user || user.role !== "user") {
      Alert.alert("Access", "Seller account required.");
      return;
    }
    if (images.length < 1) {
      Alert.alert("Images", "Add at least one image.");
      return;
    }
    if (!form.title.trim() || !form.description.trim() || !form.category || !form.condition || !form.price) {
      Alert.alert("Form", "Please fill in all required fields (title, description, category, condition, and price).");
      return;
    }
    if (form.title.trim().length > 100) {
      Alert.alert("Form", "Title is too long (maximum 100 characters).");
      return;
    }
    if (form.description.trim().length > 5000) {
      Alert.alert("Form", "Description is too long (maximum 5000 characters).");
      return;
    }
    const priceNum = Number(form.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Form", "Price must be a valid number greater than 0.");
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
      for (let i = 0; i < images.length; i++) {
        const img = images[i];

        if (Platform.OS === 'web') {
          const res = await fetch(img.uri);
          const blob = await res.blob();
          const ext = img.mimeType?.split('/')[1] || 'jpg';
          fd.append("images", blob, `img_${i}.${ext}`);
        } else {
          const mimeType = img.mimeType || "image/jpeg";
          const ext = mimeType.split("/")[1] || "jpg";
          fd.append("images", {
            uri: img.uri,
            name: `img_${i}.${ext}`,
            type: mimeType,
          } as unknown as Blob);
        }
      }
      await createProduct(fd);
      if (Platform.OS === 'web') {
        window.alert("Listing created successfully!");
        router.back();
      } else {
        Alert.alert("Success", "Listing created.", [{ text: "OK", onPress: () => router.back() }]);
      }
    } catch (e: any) {
      const parsedError = parseApiError(e, "Could not create listing.");
      const code = parsedError.code;

      if (code === "PROFILE_INCOMPLETE") {
        Alert.alert(
          "Complete Your Profile First",
          `You need to complete your profile before creating a listing.\n\n${parsedError.details}\n\nGo to your Profile tab to fill in the missing details.`
        );
      } else if (code === "DAILY_LISTING_CAP") {
        Alert.alert("Daily Limit Reached", parsedError.message || "You can only create 2 listings per day for new accounts.");
      } else if (code === "TOTAL_LISTING_CAP") {
        Alert.alert("Listing Limit Reached", parsedError.message || "New accounts can have at most 3 active listings.");
      } else if (code === "MIN_IMAGES_REQUIRED") {
        Alert.alert("More Photos Needed", parsedError.message || "This category requires at least 2 photos.");
      } else {
        Alert.alert("Error", formatErrorForDisplay(parsedError));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== "user") {
    return <Screen><View className="flex-1 items-center justify-center"><Text className="font-outfit-sb text-lg text-slate-800 dark:text-slate-200">Seller access only.</Text></View></Screen>;
  }

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      {/* Listing Policies Modal */}
      <Modal visible={policyOpen} animationType="slide" transparent onRequestClose={() => setPolicyOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="h-[88%] rounded-t-3xl bg-white dark:bg-slate-950 overflow-hidden">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <View>
                <Text className="text-[20px] font-outfit-bl text-slate-900 dark:text-white">Listing Policies</Text>
                <Text className="text-[13px] font-outfit text-slate-500 dark:text-slate-400">Read before you publish</Text>
              </View>
              <Pressable
                onPress={() => setPolicyOpen(false)}
                className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200"
              >
                <Ionicons name="close" size={18} color="#64748b" />
              </Pressable>
            </View>
            {/* Content */}
            <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
              {LISTING_POLICIES.map((section) => (
                <View key={section.title} className="mb-6">
                  <View className="flex-row items-center gap-2 mb-3">
                    <Text className="text-[20px]">{section.icon}</Text>
                    <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white">{section.title}</Text>
                  </View>
                  {section.items.map((item, i) => (
                    <View key={i} className="flex-row items-start gap-2.5 mb-2">
                      <View className="mt-2 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
                      <Text className="flex-1 text-[14px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed">{item}</Text>
                    </View>
                  ))}
                </View>
              ))}
              <View className="h-4" />
            </ScrollView>
            {/* Footer */}
            <View className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <Button title="Got it" onPress={() => setPolicyOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5 pt-6 pb-12" keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center gap-3 mb-2">
            <Text className="text-[28px] font-outfit-bl text-slate-900 dark:text-white leading-tight flex-1">Create Listing</Text>
            <Pressable
              onPress={() => setPolicyOpen(true)}
              className="h-9 w-9 rounded-full bg-primary-50 dark:bg-primary-950/40 items-center justify-center active:bg-primary-100"
            >
              <Ionicons name="information-circle-outline" size={22} color="#6366f1" />
            </Pressable>
          </View>
          <Text className="text-[15px] font-outfit text-slate-500 dark:text-slate-400 mb-8">Add details about what you&apos;re selling.</Text>

          <View className="mb-8">
            <Text className="text-[17px] font-outfit-sb text-slate-900 dark:text-white mb-3">Photos ({images.length}/5)</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
              <View className="flex-row gap-3 items-center">
                {images.length < 5 && (
                  <Pressable
                    onPress={pickImages}
                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-primary-300 dark:border-primary-800/80 bg-primary-50 dark:bg-primary-950/20 items-center justify-center active:bg-primary-100"
                  >
                    <Ionicons name="camera" size={28} color="#6366f1" />
                    <Text className="text-[12px] font-outfit-sb text-primary-600 dark:text-primary-400 mt-1">Add Photo</Text>
                  </Pressable>
                )}
                {images.map((img, index) => (
                  <View key={index} className="w-24 h-24 rounded-2xl border border-slate-200 dark:border-slate-800 relative bg-slate-100 dark:bg-slate-900">
                    <Image source={{ uri: img.uri }} style={{ width: '100%', height: '100%', borderRadius: 16 }} contentFit="cover" />
                    <Pressable
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm"
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          <View className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none mb-6">
            <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mb-5 tracking-wide">Product Info</Text>
            <Input label="Title" placeholder="Enter product title" value={form.title} onChangeText={(t) => setF("title", t)} />
            <Input
              label="Price (₹)"
              placeholder="Enter price"
              value={form.price}
              onChangeText={(t) => setF("price", t)}
              keyboardType="numeric"
            />
            <Input
              label="Description"
              placeholder="Enter product description"
              value={form.description}
              onChangeText={(t) => setF("description", t)}
              multiline
              inputClassName="min-h-[100px]"
            />

            <Text className="mb-2 mt-2 text-[14px] font-outfit-m text-slate-700 dark:text-slate-300">Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 -mx-5 px-5">
              <View className="flex-row gap-2.5">
                {(catRes?.categories?.map((c: { name: string }) => c.name) || ["Books & Study Materials", "Electronics", "Cycles", "Other"]).map((cat: string) => (
                  <Pressable
                    key={cat}
                    onPress={() => setF("category", cat)}
                    className={`px-4 py-2.5 rounded-xl border ${form.category === cat ? "bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}
                  >
                    <Text className={`text-[13px] font-outfit-sb tracking-wide ${form.category === cat ? "text-white" : "text-slate-700 dark:text-slate-300"}`}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text className="mb-2 text-[14px] font-outfit-m text-slate-700 dark:text-slate-300">Condition</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 -mx-5 px-5">
              <View className="flex-row gap-2.5">
                {PRODUCT_CONDITIONS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setF("condition", c)}
                    className={`px-4 py-2.5 rounded-xl border ${form.condition === c ? "bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}
                  >
                    <Text className={`text-[13px] font-outfit-sb tracking-wide ${form.condition === c ? "text-white" : "text-slate-700 dark:text-slate-300"}`}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none mb-8">
            <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mb-5 tracking-wide">Contact Details</Text>
            <Input label="Location / Pickup Area" placeholder="Enter pickup location" value={form.location} onChangeText={(t) => setF("location", t)} />
            <Input label="Contact Email" placeholder="Enter contact email address" value={form.email} onChangeText={(t) => setF("email", t)} keyboardType="email-address" />
          </View>

          <View className="mb-16">
            <Button title="Publish Listing" onPress={submit} loading={submitting} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
