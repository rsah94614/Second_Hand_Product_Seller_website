import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { getAdminOverview } from "../../lib/api/admin";
import { Ionicons } from "@expo/vector-icons";

const ADMIN_LINKS = [
  { href: "/admin/users", title: "Users", icon: "people-outline" as const, color: "#6366f1", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
  { href: "/admin/products", title: "Products", icon: "cube-outline" as const, color: "#0891b2", bg: "bg-cyan-50 dark:bg-cyan-950/40" },
  { href: "/admin/categories", title: "Categories", icon: "grid-outline" as const, color: "#059669", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  { href: "/admin/orders", title: "Orders", icon: "receipt-outline" as const, color: "#d97706", bg: "bg-amber-50 dark:bg-amber-950/40" },
  { href: "/admin/reports", title: "Reports", icon: "flag-outline" as const, color: "#e11d48", bg: "bg-red-50 dark:bg-red-950/40" },
  { href: "/admin/moderation-queue", title: "Mod Queue", icon: "shield-checkmark-outline" as const, color: "#7c3aed", bg: "bg-violet-50 dark:bg-violet-950/40" },
  { href: "/admin/seller-verifications", title: "Verifications", icon: "id-card-outline" as const, color: "#059669", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  { href: "/admin/bulk-actions", title: "Bulk Actions", icon: "layers-outline" as const, color: "#d97706", bg: "bg-amber-50 dark:bg-amber-950/40" },
  { href: "/admin/activity", title: "Activity", icon: "time-outline" as const, color: "#6366f1", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
  { href: "/admin/audit", title: "Audit Logs", icon: "list-outline" as const, color: "#64748b", bg: "bg-slate-100 dark:bg-slate-800" },
] as const;

const METRIC_META: Record<string, { icon: typeof Ionicons.defaultProps; color: string; bg: string }> = {
  totalUsers: { icon: "people", color: "#6366f1", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
  totalProducts: { icon: "cube", color: "#0891b2", bg: "bg-cyan-50 dark:bg-cyan-950/40" },
  totalOrders: { icon: "receipt", color: "#d97706", bg: "bg-amber-50 dark:bg-amber-950/40" },
  totalRevenue: { icon: "cash", color: "#059669", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
};

export default function AdminHomeScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: getAdminOverview,
  });

  if (isLoading) {
    return <Screen><Loading /></Screen>;
  }

  const metrics = (data as { metrics?: Record<string, number> } | undefined)?.metrics;

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      <ScrollView className="flex-1 px-4 pt-4 pb-10" showsVerticalScrollIndicator={false}>
        <Text className="text-[13px] font-outfit-m text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Control Panel</Text>
        <Text className="text-[26px] font-outfit-bl text-slate-900 dark:text-white mb-5">Admin Dashboard</Text>

        {/* Metric Cards */}
        {metrics && (
          <>
            <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Overview</Text>
            <View className="flex-row flex-wrap gap-[10px] mb-6">
              {Object.entries(metrics).map(([k, v]) => {
                const meta = METRIC_META[k] || { icon: "analytics", color: "#64748b", bg: "bg-slate-100 dark:bg-slate-800" };
                const label = k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                return (
                  <View key={k} className={`w-[48%] rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none`}>
                    <View className={`h-10 w-10 rounded-full items-center justify-center mb-3 ${meta.bg}`}>
                      <Ionicons name={meta.icon} size={20} color={meta.color} />
                    </View>
                    <Text className="text-[28px] font-outfit-bl leading-tight text-slate-900 dark:text-white">{String(v)}</Text>
                    <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 mt-0.5">{label}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Navigation Links */}
        <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Manage</Text>
        <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm shadow-slate-200/50 dark:shadow-none">
          {ADMIN_LINKS.map((l, idx) => (
            <Link key={l.href} href={l.href as never} asChild>
              <Pressable className={`flex-row items-center px-5 py-4 active:bg-slate-50 dark:active:bg-slate-800/50 ${idx < ADMIN_LINKS.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""}`}>
                <View className={`h-9 w-9 rounded-2xl items-center justify-center mr-4 ${l.bg}`}>
                  <Ionicons name={l.icon} size={18} color={l.color} />
                </View>
                <Text className="flex-1 text-[16px] font-outfit-m text-slate-800 dark:text-slate-200">{l.title}</Text>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </Pressable>
            </Link>
          ))}
        </View>
        <View className="h-8" />
      </ScrollView>
    </Screen>
  );
}
