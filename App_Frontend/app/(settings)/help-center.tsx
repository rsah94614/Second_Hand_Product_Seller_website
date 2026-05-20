import React from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";

const FAQItem = ({ question, answer }: { question: string; answer: string }) => (
  <View className="mb-6">
    <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white mb-2">
      {question}
    </Text>
    <Text className="text-[15px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed">
      {answer}
    </Text>
  </View>
);

export default function HelpCenterScreen() {
  return (
    <Screen className="bg-white dark:bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="items-center mb-4">
          <View className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl items-center justify-center mb-2">
            <Ionicons name="help-buoy" size={32} color="#3b82f6" />
          </View>
        </View>


        <Text className="text-[13px] font-outfit-sb text-slate-500 uppercase tracking-widest mb-6">
          Frequently Asked Questions
        </Text>

        <FAQItem
          question="How do I become a verified seller?"
          answer="Go to your Profile and complete the campus verification steps. You'll need to upload a valid student ID."
        />
        <FAQItem
          question="Is it safe to buy items here?"
          answer="Yes. We restrict the platform to verified campus students and staff. Always meet in public places on campus during daylight."
        />
        <FAQItem
          question="What if a buyer doesn't show up?"
          answer="You can mark the order as a 'No Show' in the Order Details page. The buyer's reputation score will be negatively impacted."
        />
        <FAQItem
          question="How do I change my college?"
          answer="Currently, you cannot change your college once registered. If you made a mistake, please contact support to reset your account."
        />

        <View className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 mt-4 items-center">
          <Ionicons name="mail-outline" size={32} color="#64748b" style={{ marginBottom: 16 }} />
          <Text className="text-[18px] font-outfit-b text-slate-900 dark:text-white mb-2">
            Still need help?
          </Text>
          <Text className="text-center text-[15px] font-outfit text-slate-600 dark:text-slate-400 mb-6">
            Our campus moderation team is here to help you.
          </Text>
          <Button
            title="Contact Support"
            onPress={() => {
              Alert.alert("Coming Soon", "In-app support messaging is currently under development. Please email support@campusmitra.com for assistance in the meantime.");
            }}
            className="w-full"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
