import { useQuery } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View, Pressable } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Screen } from "../components/ui/Screen";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { createProduct, getProductCategories } from "../lib/api/products";
import { PRODUCT_CONDITIONS } from "../lib/product-options";
import { Ionicons } from "@expo/vector-icons";

type Picked = { uri: string; mimeType: string };

export default function CreateProductScreen() {
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
    phone: "",
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
        phone: f.phone || user.phone || "",
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
    if (!form.title.trim() || !form.category || !form.condition || !form.price) {
      Alert.alert("Form", "Fill title, category, condition, and price.");
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
      fd.append("contactInfo", JSON.stringify({ phone: form.phone.trim(), email: form.email.trim() }));
      images.forEach((img, i) => {
        const ext = img.uri.split(".").pop() || "jpg";
        fd.append("images", {
          uri: img.uri,
          name: `img_${i}.${ext}`,
          type: img.mimeType,
        } as unknown as Blob);
      });
      await createProduct(fd);
      Alert.alert("Success", "Listing created.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert("Error", msg || "Could not create listing.");
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
      <ScrollView className="flex-1 px-5 pt-6 pb-12" keyboardShouldPersistTaps="handled">
        <Text className="text-[28px] font-outfit-bl text-slate-900 dark:text-white mb-2 leading-tight">Create Listing</Text>
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
                 {(catRes?.categories?.map((c: { name: string }) => c.name) || ["Books", "Electronics", "Cycles", "Misc"]).map((cat: string) => (
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
           <View className="mb-3 flex-row flex-wrap gap-2.5">
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
        </View>

        <View className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none mb-8">
           <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mb-5 tracking-wide">Contact Details</Text>
           <Input label="Location / Pickup Area" placeholder="Enter pickup location" value={form.location} onChangeText={(t) => setF("location", t)} />
           <Input label="Contact Phone" placeholder="Enter contact phone number" value={form.phone} onChangeText={(t) => setF("phone", t)} keyboardType="phone-pad" />
           <Input label="Contact Email" placeholder="Enter contact email address" value={form.email} onChangeText={(t) => setF("email", t)} keyboardType="email-address" />
        </View>

        <View className="mb-16">
          <Button title="Publish Listing" onPress={submit} loading={submitting} />
        </View>
      </ScrollView>
    </Screen>
  );
}
