import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "../../../src/components/BigButton";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { computeMatchStats } from "../../../src/core/stats";
import { useMatch } from "../../../src/hooks/useMatches";

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-white/45 text-xs">{label}</Text>
      <Text className={`text-sm font-bold ${tone ?? "text-white"}`}>{value}</Text>
    </View>
  );
}

export default function MatchDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const match = useMatch(id!);
  const m = match.data;

  if (!m) {
    return (
      <SafeAreaView className="flex-1 bg-court-bg items-center justify-center">
        <Text className="text-white/50">Cargando...</Text>
      </SafeAreaView>
    );
  }

  const s = computeMatchStats(m);

  return (
    <SafeAreaView className="flex-1 bg-court-bg" edges={["top", "bottom"]}>
      <ScreenHeader title={m.surface} />
      <View className="flex-1 px-4 pt-4">
        <View className="bg-court-card border border-court-border rounded-xl px-4 py-3.5">
          <Text className="text-court-muted text-xs font-semibold">{m.matchDate}</Text>
          <Row label="1º saque en pista" value={s.firstServePct !== null ? `${s.firstServePct}%` : "—"} />
          <Row label="2º saque en pista" value={s.secondServePct !== null ? `${s.secondServePct}%` : "—"} />
          <Row label="Aces" value={String(s.aces)} tone="text-court-yellow" />
          <Row label="Winners derecha" value={String(s.winnersForehand)} tone="text-court-green" />
          <Row label="Winners revés" value={String(s.winnersBackhand)} tone="text-court-green" />
          <Row label="EF derecha" value={String(s.unforcedErrorsForehand)} tone="text-court-red" />
          <Row label="EF revés" value={String(s.unforcedErrorsBackhand)} tone="text-court-red" />
          <Row label="Dobles faltas" value={String(s.doubleFaults)} tone="text-court-red" />
        </View>

        <View className="flex-row gap-3 mt-5">
          <BigButton
            label="En vivo"
            sublabel="Registrar puntos"
            variant="accent"
            className="flex-1"
            onPress={() => router.push(`/match/${id}/live`)}
          />
          <BigButton
            label="Dashboard"
            sublabel="Estadísticas"
            variant="blue"
            className="flex-1"
            onPress={() => router.push(`/match/${id}/dashboard`)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}