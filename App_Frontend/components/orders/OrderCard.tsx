import React, { memo } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { formatInr } from "../../lib/format";
import type { OrderRow } from "../../lib/types";

type ActionBtnProps = {
  label: string;
  onPress: () => void;
  color: string;
  loading?: boolean;
  disabled?: boolean;
};

function ActionBtn({ label, onPress, color, loading = false, disabled = false }: ActionBtnProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      className={`rounded-xl px-3 py-2 ${color} ${loading || disabled ? "opacity-60" : ""}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#6366f1" />
      ) : (
        <Text className="text-[13px] font-outfit-sb text-slate-700 dark:text-slate-200">{label}</Text>
      )}
    </Pressable>
  );
}

const statusTone = (s: string) => {
  switch (s) {
    case "requested": return { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-400" };
    case "accepted": return { bg: "bg-indigo-100 dark:bg-indigo-900/40", text: "text-indigo-700 dark:text-indigo-400" };
    case "meetup_scheduled": return { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-400" };
    case "delivered": return { bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-700 dark:text-teal-400" };
    case "completed": return { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-400" };
    case "cancelled": return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-500 dark:text-slate-400" };
    case "disputed": return { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-400" };
    case "no_show": return { bg: "bg-rose-100 dark:bg-rose-900/40", text: "text-rose-700 dark:text-rose-400" };
    default: return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-500 dark:text-slate-400" };
  }
};

type OrderCardProps = {
  order: OrderRow;
  currentId: string;
  onAccept: (id: string) => void;
  onCancel: (id: string) => void;
  onSchedule: (id: string) => void;
  onDeliver: (id: string) => void;
  onComplete: (id: string) => void;
  onNoShow: (id: string) => void;
  onDispute: (id: string) => void;
  onPhoto: (id: string) => void;
  isAccepting?: boolean;
  isCancelling?: boolean;
  isDelivering?: boolean;
  isCompleting?: boolean;
  isNoShow?: boolean;
};

export const OrderCard = memo(({
  order,
  currentId,
  onAccept,
  onCancel,
  onSchedule,
  onDeliver,
  onComplete,
  onNoShow,
  onDispute,
  onPhoto,
  isAccepting,
  isCancelling,
  isDelivering,
  isCompleting,
  isNoShow,
}: OrderCardProps) => {
  const first = order.items?.[0];
  const buyerId = typeof order.user === 'object' && order.user ? (order.user as any)._id : order.user;
  const sellerId = typeof order.seller === 'object' && order.seller ? (order.seller as any)._id : order.seller;
  const isBuyer = buyerId === currentId;
  const isSeller = sellerId === currentId;
  const status = order.status;

  const canCancel = (status === "requested" || status === "accepted") && (isBuyer || isSeller);
  const canAccept = status === "requested" && isSeller;
  const canSchedule = (status === "accepted") && (isBuyer || isSeller);
  const canDeliver = ["accepted", "meetup_scheduled"].includes(status) && isSeller;
  const canComplete = ["meetup_scheduled", "accepted", "delivered"].includes(status) && isBuyer;
  const canNoShow = status === "meetup_scheduled" && (isBuyer || isSeller);
  const canDispute = ["meetup_scheduled", "delivered", "completed", "no_show"].includes(status) && (isBuyer || isSeller);
  const canConfirmPhoto = status === "completed" && (isBuyer || isSeller);

  const tone = statusTone(status);

  return (
    <View className="mb-4 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 pr-4">
          <Text className="text-[17px] font-outfit-sb text-slate-900 dark:text-white leading-tight">
            {first?.title || "Order"}
          </Text>
          {(isBuyer || isSeller) && (
            <View className="mt-1 self-start px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
              <Text className="text-[10px] font-outfit-m text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isBuyer ? "You're buying" : "You're selling"}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-lg font-outfit-b text-primary-600 dark:text-primary-400">
          {formatInr(order.total || 0)}
        </Text>
      </View>

      <View className="flex-row justify-between items-center mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
        <View className={`px-2.5 py-1 rounded-lg ${tone.bg}`}>
          <Text className={`text-[12px] font-outfit-sb uppercase tracking-wider ${tone.text}`}>
            {status.replace(/_/g, " ")}
          </Text>
        </View>
      </View>

      {status === "meetup_scheduled" ? (
        <View className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
          <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 mb-1">
            Meetup Location
          </Text>
          <Text className="text-[14px] font-outfit-sb text-slate-900 dark:text-white">
            {order.meetupDetails?.location || "Location TBD"}
          </Text>
          {order.meetupDetails?.scheduledAt ? (
            <Text className="mt-1 text-[12px] text-slate-600 dark:text-slate-300">
              {new Date(order.meetupDetails.scheduledAt).toLocaleString()}
            </Text>
          ) : null}
          {order.meetupDetails?.notes ? (
            <Text className="mt-1 text-[12px] text-slate-600 dark:text-slate-300 italic">
              {order.meetupDetails.notes}
            </Text>
          ) : null}
        </View>
      ) : null}

      {status === "delivered" ? (
        <View className="mt-3 p-3 rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/40">
          <Text className="text-[12px] font-outfit-sb text-teal-700 dark:text-teal-300">
            📦 Item Handed Over
          </Text>
          <Text className="mt-0.5 text-[12px] font-outfit text-teal-600 dark:text-teal-400">
            {isBuyer ? "The seller has marked the item as handed over. Please confirm receipt." : "Waiting for buyer to confirm receipt."}
          </Text>
        </View>
      ) : null}

      <View className="mt-4 flex-row flex-wrap gap-2">
        {canCancel && (
          <ActionBtn
            label="Cancel"
            color="bg-red-50 dark:bg-red-950/30"
            loading={isCancelling}
            onPress={() => {
              Alert.alert("Cancel order", "Are you sure you want to cancel?", [
                { text: "No", style: "cancel" },
                {
                  text: "Cancel order",
                  style: "destructive",
                  onPress: () => onCancel(order._id),
                },
              ]);
            }}
          />
        )}

        {canAccept && (
          <ActionBtn
            label="Accept"
            color="bg-indigo-50 dark:bg-indigo-900/30"
            loading={isAccepting}
            onPress={() => onAccept(order._id)}
          />
        )}

        {canSchedule && (
          <ActionBtn
            label="Schedule Meetup"
            color="bg-indigo-50 dark:bg-indigo-900/30"
            onPress={() => onSchedule(order._id)}
          />
        )}

        {canDeliver && (
          <ActionBtn
            label="Item Handed Over"
            color="bg-teal-50 dark:bg-teal-900/30"
            loading={isDelivering}
            onPress={() =>
              Alert.alert("Confirm", "Mark this item as physically handed over to the buyer?", [
                { text: "No", style: "cancel" },
                { text: "Yes, Handed Over", onPress: () => onDeliver(order._id) },
              ])
            }
          />
        )}

        {canComplete && (
          <ActionBtn
            label="Confirm Receipt"
            color="bg-emerald-50 dark:bg-emerald-900/30"
            loading={isCompleting}
            onPress={() =>
              Alert.alert("Confirm Receipt", "Confirm that you have received the item and the deal is complete?", [
                { text: "No", style: "cancel" },
                { text: "Yes, Received", onPress: () => onComplete(order._id) },
              ])
            }
          />
        )}

        {canNoShow && (
          <ActionBtn
            label={isBuyer ? "Seller didn't show" : "Buyer didn't show"}
            color="bg-rose-50 dark:bg-rose-950/30"
            loading={isNoShow}
            onPress={() =>
              Alert.alert("Report No-Show", "Report that the other party did not show up for the meetup?", [
                { text: "No", style: "cancel" },
                { text: "Yes, Report", onPress: () => onNoShow(order._id) },
              ])
            }
          />
        )}

        {canDispute && (
          <ActionBtn
            label="Report Problem"
            color="bg-orange-50 dark:bg-orange-900/30"
            onPress={() => onDispute(order._id)}
          />
        )}

        {canConfirmPhoto && (
          <ActionBtn
            label="Add Photo proof"
            color="bg-indigo-50 dark:bg-indigo-900/30"
            onPress={() => onPhoto(order._id)}
          />
        )}
      </View>
    </View>
  );
});

OrderCard.displayName = "OrderCard";
