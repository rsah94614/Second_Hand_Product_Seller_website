import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Link, router } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { DynamicKeyboardView } from "../../components/ui/DynamicKeyboardView";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/AppToast";

const YEAR_OPTIONS = ["1st", "2nd", "3rd", "4th", "5th", "Alumni", "Faculty"] as const;
const PROFILE_ROLES = [
  { id: "student", label: "Student" },
  { id: "faculty", label: "Faculty" },
  { id: "staff", label: "Staff" },
] as const;

// ─── Inline error banner (dark-mode aware, no Alert) ─────────────────────────
function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View className="mb-4 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/20 px-4 py-3">
      <Text className="text-[14px] font-outfit-m text-red-600 dark:text-red-400">{message}</Text>
    </View>
  );
}

export default function RegisterScreen() {
  const { register, sendSignupOtp } = useAuth();
  const { showToast } = useToast();

  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: "",
    otp: "",
    profileRole: "student",
  });
  const [campus, setCampus] = useState({
    department: "",
    year: "",
    hostel: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setInterval(() => setTimer((t) => t - 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timer]);

  const set = (key: keyof typeof form, v: string) => {
    setError("");
    setForm((p) => ({ ...p, [key]: v }));
  };
  const setC = (key: keyof typeof campus, v: string) => setCampus((p) => ({ ...p, [key]: v }));

  const handleSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address before sending the code.");
      return;
    }
    setError("");
    setOtpSending(true);
    const res = await sendSignupOtp(form.email.trim());
    setOtpSending(false);
    if (res.success) {
      setOtpSent(true);
      setTimer(60);
      showToast("Verification code sent to your email.");
      if (__DEV__ && res.code) console.log(`[DEBUG] OTP: ${res.code}`);
    } else {
      setError(res.message || "Could not send verification code.");
    }
  };

  const onSubmit = async () => {
    setError("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name.trim()) { setError("Full name is required."); return; }
    if (!emailRegex.test(form.email)) { setError("Enter a valid email address."); return; }
    if (!otpSent) { setError("Please verify your email first — tap Send Code."); return; }
    if (!form.otp || form.otp.length !== 6) { setError("Enter the 6-digit code from your email."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (!termsAccepted) { setError("Please accept the terms and privacy policy to continue."); return; }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      otp: form.otp.trim(),
      location: form.location.trim(),
      profileRole: form.profileRole,
      termsAccepted: true,
      privacyAccepted: true,
    };

    const hasCampus = Object.values(campus).some((v) => v.trim());
    if (hasCampus) {
      payload.campus = {
        department: campus.department.trim(),
        year: campus.year.trim(),
        hostel: campus.hostel.trim(),
      };
    }

    setLoading(true);
    const res = await register(payload);
    setLoading(false);

    if (res.success) {
      showToast(res.message || "Registration successful!");
      router.replace("/" as never);
    } else {
      setError(res.message || "Registration failed. Please try again.");
    }
  };

  return (
    <Screen>
      <DynamicKeyboardView>
        <ScrollView
          className="flex-1 px-6 pt-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View className="mb-8">
          <Text className="text-3xl font-outfit-bl text-slate-900 dark:text-white leading-tight">
            Create an Account
          </Text>
          <Text className="mt-2 text-[15px] font-outfit text-slate-500 dark:text-slate-400">
            Join our campus community today.
          </Text>
        </View>

        <ErrorBanner message={error} />

        {/* Name */}
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={form.name}
          onChangeText={(t) => set("name", t)}
        />

        {/* Email + OTP */}
        <View className="mb-4">
          <Text className="mb-2 text-sm font-outfit-m text-slate-700 dark:text-slate-300">
            Email Address
          </Text>
          <View className="relative justify-center">
            <TextInput
              value={form.email}
              onChangeText={(t) => { setError(""); setForm((p) => ({ ...p, email: t })); }}
              placeholder="Enter your email"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!otpSent || timer === 0}
              className={`rounded-2xl border px-4 py-4 pr-[100px] text-[16px] font-outfit text-slate-900 dark:text-white ${
                otpSent && timer > 0
                  ? "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900"
              }`}
            />
            <Pressable
              onPress={handleSendOtp}
              disabled={otpSending || timer > 0}
              className={`absolute right-2 top-2 bottom-2 px-3 rounded-xl items-center justify-center min-w-[80px] ${
                timer > 0
                  ? "bg-slate-200 dark:bg-slate-800"
                  : otpSending
                    ? "bg-primary-400 dark:bg-primary-700"
                    : "bg-primary-600 dark:bg-primary-500"
              }`}
            >
              <Text
                className={`text-[12px] font-outfit-sb ${
                  timer > 0 ? "text-slate-500 dark:text-slate-400" : "text-white"
                }`}
              >
                {otpSending ? "Sending…" : timer > 0 ? `${timer}s` : otpSent ? "Resend" : "Send Code"}
              </Text>
            </Pressable>
          </View>

          {/* OTP input — shown after code is sent */}
          {otpSent && (
            <View className="mt-3">
              <TextInput
                value={form.otp}
                onChangeText={(t) => { setError(""); setForm((p) => ({ ...p, otp: t })); }}
                placeholder="Enter 6-digit code"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={6}
                className="rounded-2xl border border-primary-300 dark:border-primary-700 bg-primary-50/30 dark:bg-primary-950/20 px-4 py-4 text-[16px] font-outfit text-slate-900 dark:text-white tracking-widest text-center"
              />
              <Text className="text-[11px] font-outfit text-primary-600 dark:text-primary-400 mt-1.5 ml-1">
                ✓ Check your inbox for the 6-digit verification code.
              </Text>
            </View>
          )}
        </View>

        {/* Password */}
        <Input
          label="Password"
          placeholder="Create a password (min 8 chars)"
          value={form.password}
          onChangeText={(t) => set("password", t)}
          secureTextEntry
        />
        <Input
          label="Confirm Password"
          placeholder="Confirm your password"
          value={form.confirmPassword}
          onChangeText={(t) => set("confirmPassword", t)}
          secureTextEntry
        />

        {/* Location (optional) */}
        <Input
          label="Location (Optional)"
          placeholder="Hostel or area"
          value={form.location}
          onChangeText={(t) => set("location", t)}
        />

        {/* Profile Role */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-outfit-m text-slate-700 dark:text-slate-300">I am a…</Text>
          <View className="flex-row gap-2">
            {PROFILE_ROLES.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => set("profileRole", r.id)}
                className={`flex-1 py-3 rounded-2xl border items-center ${form.profileRole === r.id
                  ? "bg-primary-600 dark:bg-primary-500 border-primary-600 dark:border-primary-500"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  }`}
              >
                <Text
                  className={`text-[13px] font-outfit-sb ${form.profileRole === r.id
                    ? "text-white"
                    : "text-slate-700 dark:text-slate-300"
                    }`}
                >
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Campus Details (optional) */}
        <View className="mb-2 h-px bg-slate-200 dark:bg-slate-800" />
        <Text className="mb-4 mt-4 text-[16px] font-outfit-sb text-slate-800 dark:text-slate-200">
          Campus Details{" "}
          <Text className="text-[13px] font-outfit text-slate-400 dark:text-slate-500">(Optional)</Text>
        </Text>

        <Input
          label="Department"
          placeholder="e.g. Computer Science"
          value={campus.department}
          onChangeText={(t) => setC("department", t)}
        />

        <View className="mb-5">
          <Text className="mb-2 text-sm font-outfit-m text-slate-700 dark:text-slate-300">Year</Text>
          <View className="flex-row flex-wrap gap-2">
            {YEAR_OPTIONS.map((year) => (
              <Pressable
                key={year}
                onPress={() => setC("year", campus.year === year ? "" : year)}
                className={`px-4 py-2 rounded-xl border ${campus.year === year
                  ? "bg-primary-600 dark:bg-primary-500 border-primary-600 dark:border-primary-500"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  }`}
              >
                <Text
                  className={`text-[13px] font-outfit-sb ${campus.year === year ? "text-white" : "text-slate-700 dark:text-slate-300"
                    }`}
                >
                  {year}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Input
          label="Hostel (Optional)"
          placeholder="e.g. PG Boys Hostel"
          value={campus.hostel}
          onChangeText={(t) => setC("hostel", t)}
        />

        {/* Terms */}
        <Pressable
          onPress={() => setTermsAccepted((v) => !v)}
          className="flex-row items-start gap-3 mb-6 mt-2"
        >
          <View
            className={`mt-0.5 h-5 w-5 rounded border-2 items-center justify-center shrink-0 ${termsAccepted
              ? "bg-primary-600 dark:bg-primary-500 border-primary-600 dark:border-primary-500"
              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              }`}
          >
            {termsAccepted && (
              <Text className="text-white text-[11px] font-outfit-b">✓</Text>
            )}
          </View>
          <Text className="flex-1 text-[13px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed">
            I agree to the{" "}
            <Text className="text-primary-600 dark:text-primary-400 font-outfit-m">Terms of Service</Text>
            {" "}and{" "}
            <Text className="text-primary-600 dark:text-primary-400 font-outfit-m">Privacy Policy</Text>
            . I understand that CampusMitra is a campus-only marketplace.
          </Text>
        </Pressable>

        <Button title="Create Account" onPress={onSubmit} loading={loading} className="mt-2" />

        <View className="mt-6 mb-12 flex-row justify-center items-center">
          <Text className="text-[15px] font-outfit text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
          </Text>
          <Link href="/login" asChild>
            <Pressable className="py-2">
              <Text className="text-[15px] font-outfit-sb text-primary-600 dark:text-primary-400">
                Sign in
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
      </DynamicKeyboardView>
    </Screen>
  );
}
