import { Redirect, useRouter } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "../src/components/BigButton";
import { MatchCard } from "../src/components/MatchCard";
import { isSupabaseConfigured } from "../src/api/supabaseClient";
import { useDrillSessions } from "../src/hooks/useDrills";
import { useAuthSession, useLogout } from "../src/hooks/useAuth";
import { useMatches } from "../src/hooks/useMatches";
import { useNetwork } from "../src/hooks/useNetwork";

export default function HomeScreen() {
  const router = useRouter();
  const matches = useMatches();
  const drills = useDrillSessions();
  const isOnline = useNetwork();
  const { session, ready } = useAuthSession();
  const logout = useLogout();

  const authenticated = !isSupabaseConfigured() || Boolean(session);
  if (isSupabaseConfigured() && ready && !session) {
    return <Redirect href="/login" />;
  }

  const activeDrills = (drills.data ?? []).filter((d) => !d.finishedAt).length;

  return (
    <SafeAreaView className="flex-1 bg-court-bg" edges={["top", "bottom"]}>
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-2xl font-bold">TennisStats</Text>
          <View className="flex-row items-center gap-1 rounded-md px-2 py-1 bg-court-card border border-court-border">
            <View
              className={`w-2 h-2 rounded-full ${isOnline ? "bg-court-green" : "bg-court-yellow"}`}
            />
            <Text className="text-white/70 text-xs font-bold">
              {isOnline ? "en línea" : "local"}
            </Text>
          </View>
        </View>

        <BigButton
          label="+ Nuevo partido"
          variant="accent"
          size="lg"
          haptic="success"
          className="mt-4"
          onPress={() => router.push("/match/new")}
        />

        <BigButton
          label="Entrenamiento"
sublabel={
            activeDrills > 0
              ? `${activeDrills} serie(s) activa(s)`
              : "Series de saque, devolución, red y fondo"
          }
          variant="green"
          className="mt-3"
          onPress={() => router.push("/drills")}
        />
      </View>

      <Text className="px-4 pt-4 pb-2 text-white/50 text-xs font-bold uppercase tracking-wider">
        Partidos
      </Text>

      <FlatList
        className="px-4"
        data={matches.data ?? []}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MatchCard match={item} />}
        ListEmptyComponent={
          <View className="mt-8 items-center">
            <Text className="text-white/40 text-center">
              Sin partidos todavía. Tocá “Nuevo partido” para empezar.
            </Text>
          </View>
        }
      />

      <View className="px-4 pb-4 pt-2 items-center">
        <Text className="text-white/50 text-xs">
          Datos guardados localmente · Sync automático al recuperar conexión
        </Text>
        {authenticated && isSupabaseConfigured() && (isOnline || session) && (
          <Pressable onPress={() => logout.mutate()} className="mt-2 px-4 py-1">
            <Text className="text-court-red text-xs font-bold">Cerrar sesión</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}