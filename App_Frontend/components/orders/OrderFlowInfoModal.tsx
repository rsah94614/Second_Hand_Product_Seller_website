import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onClose: () => void;
  activeTab: "buying" | "selling";
};

type StepProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  isLast?: boolean;
  isDark: boolean;
};

const Step = ({ icon, title, description, isLast = false, isDark }: StepProps) => (
  <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: isLast ? 0 : 28 }}>
    {/* Icon Circle + Line */}
    <View style={{ alignItems: "center", marginRight: 16, width: 40 }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isDark ? "#1e1b4b" : "#eef2ff",
          borderWidth: 2,
          borderColor: isDark ? "#4338ca" : "#c7d2fe",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isDark ? "#818cf8" : "#4f46e5"}
        />
      </View>
      {!isLast && (
        <View
          style={{
            flex: 1,
            width: 2,
            backgroundColor: isDark ? "#334155" : "#e2e8f0",
            marginTop: 6,
            minHeight: 20,
          }}
        />
      )}
    </View>

    {/* Text Content */}
    <View style={{ flex: 1, paddingBottom: isLast ? 0 : 8 }}>
      <Text
        style={{
          fontSize: 16,
          fontFamily: "Outfit-Bold",
          color: isDark ? "#f1f5f9" : "#0f172a",
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontFamily: "Outfit",
          color: isDark ? "#94a3b8" : "#64748b",
          lineHeight: 20,
        }}
      >
        {description}
      </Text>
    </View>
  </View>
);

const BUYING_STEPS: Omit<StepProps, "isDark">[] = [
  {
    icon: "cart-outline",
    title: "1. Request Item",
    description:
      "Find an item you like and tap 'Buy Now' or 'Request Deal'. The seller gets notified instantly.",
  },
  {
    icon: "checkmark-circle-outline",
    title: "2. Seller Accepts",
    description:
      "The seller reviews your request and accepts it. Your order status changes to 'Accepted'.",
  },
  {
    icon: "location-outline",
    title: "3. Schedule Meetup",
    description:
      "Once accepted, you or the seller can propose a campus location and time to meet up.",
  },
  {
    icon: "bag-handle-outline",
    title: "4. Meet & Receive",
    description:
      "Meet the seller at the agreed spot, inspect the item, and pay via cash or UPI. The seller marks it as 'Delivered'.",
  },
  {
    icon: "star-outline",
    title: "5. Confirm & Review",
    description:
      "Tap 'Confirm Receipt' to complete the deal. Leave a review to help the campus community!",
    isLast: true,
  },
];

const SELLING_STEPS: Omit<StepProps, "isDark">[] = [
  {
    icon: "pricetag-outline",
    title: "1. Receive Request",
    description:
      "A buyer requests to purchase your listed item. You'll get a notification with their details.",
  },
  {
    icon: "checkmark-circle-outline",
    title: "2. Accept Request",
    description:
      'Review the buyer\'s profile and tap "Accept Order" if you agree to sell it to them.',
  },
  {
    icon: "location-outline",
    title: "3. Schedule Meetup",
    description:
      "You or the buyer can suggest a safe campus location and time to complete the transaction.",
  },
  {
    icon: "cash-outline",
    title: "4. Meet & Deliver",
    description:
      'Meet the buyer, collect payment (cash or UPI), hand over the item, then tap "Item Handed Over".',
  },
  {
    icon: "trophy-outline",
    title: "5. Buyer Confirms",
    description:
      "The buyer confirms receipt on their end. The deal is complete and both can leave a review!",
    isLast: true,
  },
];

export function OrderFlowInfoModal({ visible, onClose, activeTab }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const isBuying = activeTab === "buying";
  const steps = isBuying ? BUYING_STEPS : SELLING_STEPS;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        {/* Prevent inner taps from closing */}
        <Pressable onPress={() => {}}>
          <View
            style={{
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              overflow: "hidden",
              maxHeight: "90%",
            }}
          >
            {/* Handle Bar */}
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? "#334155" : "#e2e8f0",
                alignSelf: "center",
                marginTop: 12,
                marginBottom: 4,
              }}
            />

            {/* Header */}
            <View
              style={{
                padding: 24,
                paddingBottom: 20,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? "#1e293b" : "#f1f5f9",
                backgroundColor: isDark ? "#1e293b" : "#f8faff",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: isDark ? "#1e1b4b" : "#eef2ff",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <Ionicons
                      name={isBuying ? "cart-outline" : "pricetag-outline"}
                      size={20}
                      color={isDark ? "#818cf8" : "#4f46e5"}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 20,
                      fontFamily: "Outfit-Black",
                      color: isDark ? "#f1f5f9" : "#0f172a",
                    }}
                  >
                    {isBuying ? "Buying Workflow" : "Selling Workflow"}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Outfit",
                    color: isDark ? "#64748b" : "#64748b",
                    lineHeight: 20,
                  }}
                >
                  {isBuying
                    ? "How to safely purchase items from other students."
                    : "How to successfully sell your items on campus."}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isDark ? "#334155" : "#e2e8f0",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 12,
                }}
              >
                <Ionicons name="close" size={18} color={isDark ? "#94a3b8" : "#64748b"} />
              </Pressable>
            </View>

            {/* Steps */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
            >
              {steps.map((step) => (
                <Step key={step.title} {...step} isDark={isDark} />
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
