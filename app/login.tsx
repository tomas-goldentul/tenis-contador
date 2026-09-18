import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "../src/components/BigButton";
import { getSupabase, isSupabaseConfigured } from "../src/api/supabaseClient";
import { AUTH_EMAIL } from "../src/config";
import { useAuthSession } from "../src/hooks/useAuth";

export default function LoginScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState(AUTH_EMAIL);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!configured || session) {
    return <Redirect href="/" />;
  }

  const handleLogin = async () => {
    if (!configured || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await getSupabase()!.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(err.message);
      } else {
        router.replace("/");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al iniciar sesión");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-court-bg" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center px-6"
      >
        <Text className="text-white text-2xl font-bold text-center">TennisStats</Text>
        <Text className="text-court-muted text-sm text-center mt-1 mb-8">
          Iniciá sesión para sincronizar tus datos
        </Text>

        <Text className="text-white/50 text-[11px] font-bold uppercase tracking-wider mb-1.5">
          Usuario
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          className="bg-court-card border border-court-border rounded-xl px-4 h-12 text-white text-base mb-4"
          placeholderTextColor="#98A29B"
        />

        <Text className="text-white/50 text-[11px] font-bold uppercase tracking-wider mb-1.5">
          Contraseña
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          className="bg-court-card border border-court-border rounded-xl px-4 h-12 text-white text-base mb-4"
          placeholderTextColor="#98A29B"
          placeholder="••••••••"
        />

        {error ? (
          <Text className="text-court-red text-sm mb-3">{error}</Text>
        ) : null}

        <BigButton
          label={busy ? "Ingresando..." : "Ingresar"}
          variant="accent"
          size="lg"
          haptic="success"
          onPress={handleLogin}
          disabled={busy || !password}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}