import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Screen } from "../../components/ui/Screen";

export default function PrivacyPolicyScreen() {
  return (
    <Screen className="bg-white dark:bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <Text className="text-2xl font-outfit-b text-slate-900 dark:text-white mb-6">
          Privacy Policy
        </Text>
        <Text className="text-[14px] font-outfit-sb text-slate-500 mb-6">
          Last updated: August 2026
        </Text>

        <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mt-4 mb-2">
          1. Information We Collect
        </Text>
        <Text className="text-[15px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          We collect information you provide directly to us, such as when you create or modify your account, request support, or communicate with us. This includes your name, institutional email address, campus identity details (course, year, hostel), and any profile pictures you upload.
        </Text>

        <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mt-4 mb-2">
          2. How We Use Information
        </Text>
        <Text className="text-[15px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          We use the information we collect to operate, maintain, and improve Campus Mitra. This includes verifying your campus identity to ensure a safe trading environment, facilitating communications between buyers and sellers, and personalizing your experience.
        </Text>

        <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mt-4 mb-2">
          3. Information Sharing
        </Text>
        <Text className="text-[15px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          Your basic profile information (name, avatar, campus affiliation, and reputation score) is visible to other verified users on the platform. We do not share your personal information with third parties for their direct marketing purposes without your consent.
        </Text>

        <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mt-4 mb-2">
          4. Data Security
        </Text>
        <Text className="text-[15px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration, and destruction. However, no internet transmission is completely secure, and we cannot guarantee the absolute security of your data.
        </Text>

        <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mt-4 mb-2">
          5. Your Choices
        </Text>
        <Text className="text-[15px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          You may update or correct your account information at any time by logging into your account. If you wish to delete your account entirely, you can do so from the Settings menu. Upon deletion, your personal information will be anonymized or removed in accordance with our data retention policy.
        </Text>
      </ScrollView>
    </Screen>
  );
}
