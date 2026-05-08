import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { createAdminCategory, deleteAdminCategory, getAdminCategories } from "../../lib/api/admin";
import { Ionicons } from "@expo/vector-icons";

export default function AdminCategoriesScreen() {
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: getAdminCategories,
  });

  const createM = useMutation({
    mutationFn: () => createAdminCategory({ name: name.trim() }),
    onSuccess: () => { setName(""); qc.invalidateQueries({ queryKey: ["admin-categories"] }); },
  });

  const delM = useMutation({
    mutationFn: deleteAdminCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] }),
  });

  if (isLoading) {
    return <Screen><Loading /></Screen>;
  }

  const categories = (data as { categories?: { _id: string; name: string }[] })?.categories || [];

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950" safeAreaTop={false} safeAreaBottom={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <View className="flex-row gap-2 px-4 pt-3 pb-2">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="New category name..."
          placeholderTextColor="#94a3b8"
          className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white"
          returnKeyType="done"
          onSubmitEditing={() => { if (name.trim()) createM.mutate(); }}
        />
        <Pressable
          onPress={() => { if (!name.trim()) return; createM.mutate(); }}
          className="justify-center rounded-2xl bg-primary-600 px-5 active:bg-primary-700"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(c) => c._id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListEmptyComponent={
          <View className="py-12 items-center">
            <Text className="text-[15px] font-outfit-m text-slate-500 dark:text-slate-400">No categories yet.</Text>
          </View>
        }
        renderItem={({ item: c }) => (
          <View className="mb-2.5 flex-row items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 shadow-sm shadow-slate-200/50 dark:shadow-none">
            <View className="flex-row items-center gap-3">
              <View className="h-8 w-8 rounded-full bg-primary-50 dark:bg-primary-950/40 items-center justify-center">
                <Ionicons name="grid" size={14} color="#6366f1" />
              </View>
              <Text className="text-[16px] font-outfit-m text-slate-800 dark:text-slate-200">{c.name}</Text>
            </View>
            <Pressable
              onPress={() =>
                Alert.alert("Delete category?", `"${c.name}" will be removed.`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => delM.mutate(c._id) },
                ])
              }
              className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-950/40 items-center justify-center"
            >
              <Ionicons name="trash-outline" size={14} color="#e11d48" />
            </Pressable>
          </View>
        )}
      />
      </KeyboardAvoidingView>
    </Screen>
  );
}
