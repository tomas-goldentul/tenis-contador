import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "../../src/components/BigButton";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { SURFACES } from "../../src/constants";
import { useCreateMatch } from "../../src/hooks/useMatches";
import type { Surface } from "../../src/types";

function todayLocal(d = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function displayDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function NewMatchScreen() {
  const router = useRouter();
  const createMatch = useCreateMatch();
  const [surface, setSurface] = useState<Surface>("Dura");
  const [date] = useState(todayLocal);

  const handleCreate = async () => {
    const m = await createMatch.mutateAsync({ surface, matchDate: date });
    router.replace(`/match/${m.id}/live`);
  };

  return (
    <SafeAreaView className="flex-1 bg-court-bg" edges={["top", "bottom"]}>
      <ScreenHeader title="Nuevo partido" />
      <View className="flex-1 px-4 pt-5 gap-6">
        <View className="bg-court-card border border-court-border rounded-xl px-4 py-3.5">
          <Text className="text-white/50 text-[11px] font-bold uppercase tracking-wider">
            Fecha
          </Text>
          <Text className="text-white text-lg font-bold mt-0.5">{displayDate(date)}</Text>
          <Text className="text-white/40 text-xs mt-0.5">Se toma el día de hoy automáticamente</Text>
        </View>

        <View>
          <Text className="text-white/50 text-[11px] font-bold uppercase tracking-wider mb-2">
            Superficie
          </Text>
          <View className="flex-row gap-2">
            {SURFACES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setSurface(s)}
                className={`flex-1 items-center justify-center h-12 rounded-lg border ${
                  surface === s ? "bg-court-accent border-court-accent" : "bg-court-card border-court-border"
                }`}
              >
                <Text
                  className={`font-bold text-sm ${surface === s ? "text-black" : "text-white"}`}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-auto mb-4">
          <BigButton
            label={createMatch.isPending ? "Creando..." : "Crear y empezar a registrar"}
            variant="accent"
            size="lg"
            haptic="success"
            onPress={handleCreate}
            disabled={createMatch.isPending}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}