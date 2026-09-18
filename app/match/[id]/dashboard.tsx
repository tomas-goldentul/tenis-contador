import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import {
  computeMatchStats,
  mergeMatchStats,
  type MatchStats,
} from "../../../src/core/stats";
import { exportStatsPdf } from "../../../src/export/pdf";
import { useMatch, useMatches } from "../../../src/hooks/useMatches";

function Bar({
  label,
  inCount,
  attempts,
  color,
}: {
  label: string;
  inCount: number;
  attempts: number;
  color: string;
}) {
  const value = attempts > 0 ? Math.min(100, Math.round((inCount / attempts) * 100)) : 0;
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-white/60 text-xs font-semibold">{label}</Text>
        <Text className="text-white text-sm font-bold">
          {inCount}/{attempts}
        </Text>
      </View>
      <View className="h-2 rounded bg-court-border overflow-hidden">
        <View className={`h-full rounded ${color}`} style={{ width: `${value}%` }} />
      </View>
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-white/45 text-xs">{label}</Text>
      <Text className="text-white text-sm font-bold">{value}</Text>
    </View>
  );
}

function StatsView({ stats }: { stats: MatchStats }) {
  return (
    <View className="gap-4">
      <View className="bg-court-card border border-court-border rounded-xl px-4 py-4">
        <Text className="text-white/50 text-[11px] font-bold uppercase tracking-wider mb-3">
          Efectividad de saque
        </Text>
        <Bar label="1º saque en pista" inCount={stats.firstServeIn} attempts={stats.firstServeAttempts} color="bg-court-green" />
        <Bar label="2º saque en pista" inCount={stats.secondServeIn} attempts={stats.secondServeAttempts} color="bg-court-accent" />
        <StatRow label="Dobles faltas" value={String(stats.doubleFaults)} />
      </View>

      <View className="bg-court-card border border-court-border rounded-xl px-4 py-4">
        <Text className="text-white/50 text-[11px] font-bold uppercase tracking-wider mb-1">
          Resumen
        </Text>
        <StatRow label="Aces" value={String(stats.aces)} />
        <StatRow label="Winners totales" value={String(stats.winners)} />
        <StatRow label="Winners derecha" value={String(stats.winnersForehand)} />
        <StatRow label="Winners revés" value={String(stats.winnersBackhand)} />
        <StatRow label="Errores no forzados totales" value={String(stats.unforcedErrors)} />
        <StatRow label="EF derecha" value={String(stats.unforcedErrorsForehand)} />
        <StatRow label="EF revés" value={String(stats.unforcedErrorsBackhand)} />
        <StatRow
          label="Ratio W / EF"
          value={stats.ratio === null ? "—" : stats.ratio.toFixed(2)}
        />
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const match = useMatch(id!);
  const allMatches = useMatches();
  const [scope, setScope] = useState<"match" | "all">("match");

  const m = match.data;
  const stats = scope === "match" && m ? computeMatchStats(m) : null;
  const totalStats =
    scope === "all"
      ? mergeMatchStats((allMatches.data ?? []).map((x) => ({
          firstServeIn: x.firstServeIn,
          firstServeOut: x.firstServeOut,
          secondServeIn: x.secondServeIn,
          secondServeOut: x.secondServeOut,
          aces: x.aces,
          winnersForehand: x.winnersForehand,
          winnersBackhand: x.winnersBackhand,
          unforcedErrorsForehand: x.unforcedErrorsForehand,
          unforcedErrorsBackhand: x.unforcedErrorsBackhand,
        })))
      : null;

  const handleExport = async () => {
    const target = scope === "match" ? stats : totalStats;
    if (!target) return;
    await exportStatsPdf({
      title: "TennisStats",
      subtitle: scope === "match" && m ? `${m.matchDate} · ${m.surface}` : "Todos los partidos",
      stats: target,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-court-bg" edges={["top", "bottom"]}>
      <ScreenHeader
        title="Dashboard"
        right={
          <Pressable
            onPress={handleExport}
            disabled={!stats && !totalStats}
            className="rounded-lg bg-court-card border border-court-border px-3.5 h-9 items-center justify-center active:bg-court-border"
          >
            <Text className="text-white text-sm font-bold">PDF</Text>
          </Pressable>
        }
      />

      <ScrollView className="flex-1 px-4 pt-4 pb-8">
        <View className="flex-row gap-2 mb-4">
          {(["match", "all"] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setScope(s)}
              className={`flex-1 items-center justify-center h-10 rounded-lg border ${
                scope === s ? "bg-court-accent border-court-accent" : "bg-court-card border-court-border"
              }`}
            >
              <Text className={`font-bold text-xs ${scope === s ? "text-black" : "text-white"}`}>
                {s === "match" ? "Este partido" : "Todos"}
              </Text>
            </Pressable>
          ))}
        </View>

        {scope === "match" && stats ? (
          <StatsView stats={stats} />
        ) : null}
        {scope === "all" && totalStats ? (
          <StatsView stats={totalStats} />
        ) : null}

        {scope === "match" && !stats ? (
          <Text className="text-white/40 text-center mt-10">Sin datos para mostrar aún.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}