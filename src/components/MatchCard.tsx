import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { computeMatchStats } from "../core/stats";
import type { Match } from "../types";

const SURFACE_SHORT: Record<Match["surface"], string> = {
  "Polvo de ladrillo": "Polvo de ladrillo",
  Dura: "Dura",
};

export function MatchCard({ match }: { match: Match }) {
  const s = computeMatchStats(match);
  const summary = [
    s.firstServePct !== null ? `1º ${s.firstServePct}%` : null,
    s.aces > 0 ? `${s.aces} ace${s.aces > 1 ? "s" : ""}` : null,
    s.winners > 0 ? `${s.winners} W` : null,
    s.unforcedErrors > 0 ? `${s.unforcedErrors} EF` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <Link href={`/match/${match.id}`} asChild>
      <Pressable className="bg-court-card rounded-xl border border-court-border p-3.5 mb-2.5 active:bg-court-border">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-base font-bold flex-shrink" numberOfLines={1}>
            {SURFACE_SHORT[match.surface]}
          </Text>
          <Text className="text-court-muted text-xs">{match.matchDate}</Text>
        </View>
        {summary ? (
          <Text className="text-white/50 text-xs mt-1">{summary}</Text>
        ) : null}
      </Pressable>
    </Link>
  );
}