import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";

const YEAR_OPTIONS = ["1st", "2nd", "3rd", "4th", "5th", "Alumni", "Faculty"] as const;

export default function RegisterScreen() {
  const { register } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    location: "",
  });
  const [campus, setCampus] = useState({
    collegeName: "",
    department: "",
    year: "",
    hostel: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form, v: string) => setForm((p) => ({ ...p, [key]: v }));
  const setC = (key: keyof typeof campus, v: string) => setCampus((p) => ({ ...p, [key]: v }));

  const onSubmit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name.trim()) {
      setErrorMessage("Full name is required.");
      Alert.alert("Required", "Full name is required.");
      return;
    }
    if (!emailRegex.test(form.email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (form.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (campus.year && !YEAR_OPTIONS.includes(campus.year as (typeof YEAR_OPTIONS)[number])) {
      setErrorMessage("Choose a valid year option.");
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim(),
      location: form.location.trim(),
    };

    const hasCampus = Object.values(campus).some((v) => v.trim());
    if (hasCampus) {
      payload.campus = {
        collegeName: campus.collegeName.trim(),
        department: campus.department.trim(),
        year: campus.year.trim(),
        enrollmentId: "",
        hostel: campus.hostel.trim(),
      };
    }

    setLoading(true);
    setErrorMessage("");
    const res = await register(payload);
    setLoading(false);

    if (res.success) {
      router.replace(`/login?email=${encodeURIComponent(form.email.trim())}` as never);
    } else {
      setErrorMessage(res.message || "Registration failed");
      Alert.alert("Registration failed", res.message || "Try again.");
    }
  };

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-10" keyboardShouldPersistTaps="handled">
        <View className="mb-8">
           <Text className="text-3xl font-outfit-bl text-slate-900 dark:text-white leading-tight">
              Create an Account
           </Text>
           <Text className="mt-2 text-[15px] font-outfit text-slate-500 dark:text-slate-400">
             Join our campus community today.
           </Text>
        </View>

        <View className="mb-2">
          {errorMessage ? (
            <View className="mb-6 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/20 px-4 py-4">
              <Text className="text-[14px] font-outfit-m text-red-600 dark:text-red-400">{errorMessage}</Text>
            </View>
          ) : null}
          
          <Input label="Full Name" placeholder="Enter your full name" value={form.name} onChangeText={(t) => set("name", t)} />
          <Input
            label="Email Address"
            placeholder="Enter your email address"
            value={form.email}
            onChangeText={(t) => set("email", t)}
            keyboardType="email-address"
          />
          <Input
            label="Password"
            placeholder="Create a password"
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
          <Input
            label="Phone"
            placeholder="Enter your phone number"
            value={form.phone}
            onChangeText={(t) => set("phone", t)}
            keyboardType="phone-pad"
          />
          <Input label="Location" placeholder="Enter your location" value={form.location} onChangeText={(t) => set("location", t)} />

          <View className="my-6 h-[1px] bg-slate-200 dark:bg-slate-800 w-full" />
          
          <Text className="mb-4 text-lg font-outfit-bd text-slate-800 dark:text-slate-200">Campus Details (Optional)</Text>
          <Input
            label="College Name"
            placeholder="Enter your college name"
            value={campus.collegeName}
            onChangeText={(t) => setC("collegeName", t)}
          />
          <Input
            label="Department"
            placeholder="Enter your department"
            value={campus.department}
            onChangeText={(t) => setC("department", t)}
          />

          <Text className="mb-2 text-sm font-outfit-m text-slate-700 dark:text-slate-300">Year</Text>
          <View className="mb-5 flex-row flex-wrap gap-2">
            {YEAR_OPTIONS.map((year) => (
              <Button
                key={year}
                title={year}
                variant={campus.year === year ? "primary" : "outline"}
                onPress={() => setC("year", campus.year === year ? "" : year)}
                className="py-2.5 px-4 min-h-0 rounded-xl"
                textClassName="text-[13px]"
              />
            ))}
          </View>

          <Input label="Hostel" placeholder="Enter your hostel name" value={campus.hostel} onChangeText={(t) => setC("hostel", t)} />
        </View>

        <Button title="Register" onPress={onSubmit} loading={loading} className="mt-4" />
        
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
    </Screen>
  );
}
