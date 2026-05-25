import React from "react";
import { Text, ScrollView } from "react-native";
import { Screen } from "../../components/ui/Screen";

export default function TermsOfServiceScreen() {
  return (
    <Screen className="bg-white dark:bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <Text className="text-[14px] font-outfit-sb text-slate-500 mb-6">
          Last updated: August 2026
        </Text>

        <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mt-4 mb-2">
          1. Acceptance of Terms
        </Text>
        <Text className="text-[15px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          By accessing and using Campus Mitra, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application. Campus Mitra is designed exclusively for students, faculty, and staff of registered educational institutions.
        </Text>

        <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mt-4 mb-2">
          2. User Accounts and Verification
        </Text>
        <Text className="text-[15px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          To use certain features, you must create an account and verify your campus identity. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current, and complete information during the registration process.
        </Text>

        <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mt-4 mb-2">
          3. Prohibited Conduct
        </Text>
        <Text className="text-[15px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          You agree not to engage in any of the following activities:
          {"\n"}• Posting false, misleading, or deceptive listings.
          {"\n"}• Harassing, threatening, or abusing other users.
          {"\n"}• Selling illegal, dangerous, or strictly prohibited items on campus grounds.
          {"\n"}• Creating multiple accounts or attempting to circumvent the verification process.
        </Text>

        <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mt-4 mb-2">
          4. Transactions and Liability
        </Text>
        <Text className="text-[15px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          Campus Mitra is solely a platform to connect buyers and sellers within a campus. We are not a party to any transaction. All transactions are made at your own risk. We strongly advise meeting in public, well-lit areas on campus to complete any exchanges.
        </Text>

        <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mt-4 mb-2">
          5. Termination
        </Text>
        <Text className="text-[15px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users of the application.
        </Text>
      </ScrollView>
    </Screen>
  );
}
