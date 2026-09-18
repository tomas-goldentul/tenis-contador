import { useKeepAwake } from "expo-keep-awake";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "../../../src/components/BigButton";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { computeMatchStats } from "../../../src/core/stats";
import { useLiveTracking } from "../../../src/hooks/useLiveTracking";
import { useMatch } from "../../../src/hooks/useMatches";
import type { ServeDirectionLabel, StatDelta, StatField } from "../../../src/types";

const DIRECTIONS: ServeDirectionLabel[] = ["T", "Cuerpo", "Abierto"];

const DIR_FIELDS: Record<ServeDirectionLabel, StatField> = {
  T: "serveDirectionT",
  Cuerpo: "serveDirectionBody",
  Abierto: "serveDirectionWide",
};

function fmt(v: number | null): string {
  return v === null ? "—" : `${v}%`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-court-card border border-court-border rounded-lg px-3 py-2.5">
      <Text className="text-white/45 text-[10px] font-bold uppercase tracking-wider">
        {label}
      </Text>
      <Text className="text-white text-xl font-bold mt-0.5">{value}</Text>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="text-white/50 text-[11px] font-bold uppercase tracking-wider mt-5 mb-2">
      {children}
    </Text>
  );
}

export default function LiveTrackingScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const match = useMatch(id!);
  const { busy, canUndo, record, undoLast } = useLiveTracking(id!);
  const [dir, setDir] = useState<ServeDirectionLabel | null>(null);

  const m = match.data;
  const s = m ? computeMatchStats(m) : null;

  const withDir = (base: StatDelta): StatDelta => {
    if (!dir) return base;
    const field = DIR_FIELDS[dir];
    return { ...base, [field]: 1 } as StatDelta;
  };

  const serve = (base: StatDelta) => {
    if (busy) return;
    record(withDir(base));
    setDir(null);
  };

  const touchDir = (d: ServeDirectionLabel) => {
    if (busy) return;
    setDir((cur) => (cur === d ? null : d));
  };

  return (
    <SafeAreaView className="flex-1 bg-court-bg" edges={["top", "bottom"]}>
      <ScreenHeader title="En vivo" />

      <View className="flex-1 px-4 pt-3">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="flex-row gap-2">
            <Metric label="1º saque" value={s ? fmt(s.firstServePct) : "—"} />
            <Metric label="2º saque" value={s ? fmt(s.secondServePct) : "—"} />
            <Metric label="Aces" value={s ? String(s.aces) : "—"} />
            <Metric label="W / EF" value={s ? `${s.winners} / ${s.unforcedErrors}` : "—"} />
          </View>

          {m && s && s.firstServeAttempts > 0 && (
            <Text className="text-white/80 text-sm text-right mt-1.5 font-medium">
              {s.firstServeIn} de {s.firstServeAttempts} primeros · {s.secondServeIn} de{" "}
              {s.secondServeAttempts} segundos · {s.doubleFaults} dobles faltas
            </Text>
          )}

          <SectionLabel>Saque</SectionLabel>

          <View className="flex-row gap-2 mb-3">
            {DIRECTIONS.map((d) => (
              <Pressable
                key={d}
                onPress={() => touchDir(d)}
                className={`flex-1 items-center justify-center h-10 rounded-lg border ${
                  dir === d
                    ? "bg-court-blue border-court-blue"
                    : "bg-court-card border-court-border"
                }`}
              >
                <Text
                  className={`font-bold text-sm ${dir === d ? "text-white" : "text-white/60"}`}
                >
                  {d}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row gap-2">
            <BigButton
              label="1º entró"
              variant="green"
              size="lg"
              className="flex-1"
              flash
              haptic="success"
              onPress={() => serve({ firstServeIn: 1 })}
              disabled={busy}
            />
            <BigButton
              label="1º no entró"
              variant="red"
              size="lg"
              className="flex-1"
              flash
              haptic="error"
              onPress={() => serve({ firstServeOut: 1 })}
              disabled={busy}
            />
          </View>
          <View className="flex-row gap-2 mt-2">
            <BigButton
              label="2º entró"
              variant="green"
              size="lg"
              className="flex-1"
              flash
              haptic="success"
              onPress={() => serve({ secondServeIn: 1 })}
              disabled={busy}
            />
            <BigButton
              label="Doble falta"
              variant="red"
              size="lg"
              className="flex-1"
              sublabel="2º no entró"
              flash
              haptic="error"
              onPress={() => serve({ secondServeOut: 1 })}
              disabled={busy}
            />
          </View>

          <BigButton
            label="Ace"
            variant="yellow"
            size="lg"
            className="mt-2"
            sublabel="1º saque dentro + ace"
            flash
            haptic="success"
            onPress={() => serve({ aces: 1, firstServeIn: 1 })}
            disabled={busy}
          />

          <SectionLabel>Golpes</SectionLabel>
          <View className="flex-row gap-2">
            <BigButton
              label="Winner Der"
              variant="blue"
              className="flex-1"
              flash
              onPress={() => !busy && record({ winnersForehand: 1 })}
              disabled={busy}
            />
            <BigButton
              label="Winner Rev"
              variant="blue"
              className="flex-1"
              flash
              onPress={() => !busy && record({ winnersBackhand: 1 })}
              disabled={busy}
            />
          </View>
          <View className="flex-row gap-2 mt-2">
            <BigButton
              label="EF Der"
              variant="red"
              className="flex-1"
              flash
              onPress={() => !busy && record({ unforcedErrorsForehand: 1 })}
              disabled={busy}
            />
            <BigButton
              label="EF Rev"
              variant="red"
              className="flex-1"
              flash
              onPress={() => !busy && record({ unforcedErrorsBackhand: 1 })}
              disabled={busy}
            />
          </View>
        </ScrollView>

        <View className="py-3 border-t border-court-border mt-3">
          <BigButton
            label="Deshacer"
            variant="dark"
            haptic="selection"
            onPress={undoLast}
            disabled={!canUndo || busy}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}