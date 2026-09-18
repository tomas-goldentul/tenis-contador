import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "../src/components/BigButton";
import { PhaseIndicator } from "../src/components/PhaseIndicator";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { DRILL_TARGETS, DRILL_TYPES } from "../src/constants";
import { computeDrillStats } from "../src/core/stats";
import {
  useDrillEvents,
  useFinishDrill,
  useRecordDrillEvent,
  useStartDrill,
} from "../src/hooks/useDrills";
import type { DrillType } from "../src/types";

export default function DrillsScreen() {
  const [skill, setSkill] = useState<DrillType>("Saque");
  const [target, setTarget] = useState<number>(20);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const startDrill = useStartDrill();
  const finishDrill = useFinishDrill();
  const events = useDrillEvents(sessionId ?? "");
  const record = useRecordDrillEvent(sessionId ?? "");

  const eventsData = events.data ?? [];
  const stats = computeDrillStats(eventsData);
  const remaining = Math.max(0, target - eventsData.length);

  const handleStart = async () => {
    const s = await startDrill.mutateAsync({
      drillType: skill,
      targetShots: target,
      drillName: nameFor(skill, target),
    });
    setSessionId(s.id);
    setDone(false);
  };

  const handleRecord = async (successful: boolean) => {
    if (!sessionId) return;
    await record({ successful, shotSide: null });
    if (eventsData.length + 1 >= target) {
      await finish();
    }
  };

  const finish = async () => {
    if (!sessionId) return;
    await finishDrill.mutateAsync(sessionId);
    setDone(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-court-bg" edges={["top", "bottom"]}>
      <ScreenHeader title="Entrenamiento" />
      <View className="flex-1 px-4 pt-4">

        {!sessionId && (
          <View className="gap-4">
            <Text className="text-white text-sm font-bold uppercase tracking-wider">
              Tipo de golpe
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DRILL_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setSkill(t)}
                  className={`px-5 py-3 rounded-lg border ${
                    skill === t ? "bg-court-accent border-court-accent" : "bg-court-card border-court-border"
                  }`}
                >
                  <Text className={`font-bold ${skill === t ? "text-black" : "text-white"}`}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="text-white text-sm font-bold uppercase tracking-wider">
              Tamaño del bloque
            </Text>
            <View className="flex-row gap-2">
              {DRILL_TARGETS.map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setTarget(n)}
                  className={`flex-1 items-center justify-center h-14 rounded-lg border ${
                    target === n ? "bg-court-accent border-court-accent" : "bg-court-card border-court-border"
                  }`}
                >
                  <Text className={`font-bold text-lg ${target === n ? "text-black" : "text-white"}`}>
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>

            <BigButton
              label="Empezar serie"
              variant="accent"
              size="lg"
              haptic="success"
              onPress={handleStart}
              disabled={startDrill.isPending}
            />
          </View>
        )}

        {sessionId && !done && (
          <View className="flex-1 justify-between pb-6">
            <PhaseIndicator
              title={`${skill} · ${target} golpes`}
              subtitle={`Faltan ${remaining}`}
            />
            <View className="gap-3">
              <BigButton
                label="Entró"
                variant="green"
                size="lg"
                onPress={() => handleRecord(true)}
              />
              <BigButton
                label="No entró"
                variant="red"
                size="lg"
                onPress={() => handleRecord(false)}
              />
              <BigButton label="Terminar ahora" variant="dark" onPress={finish} />
            </View>
          </View>
        )}

        {sessionId && done && (
          <View className="gap-4">
            <View className="bg-court-card border border-court-border rounded-xl p-5 items-center">
              <Text className="text-white/50 text-[11px] font-bold uppercase tracking-wider">
                Resultado
              </Text>
              <Text className="text-white text-4xl font-bold mt-2">
                {stats.pct ?? "—"}%
              </Text>
              <Text className="text-white/50 mt-1">
                {stats.successful} de {stats.total} golpes entrados
              </Text>
            </View>
            <BigButton
              label="Nueva serie"
              variant="accent"
              size="lg"
              onPress={() => {
                setSessionId(null);
                setDone(false);
                setTarget(20);
              }}
            />
            <BigButton
              label="Listo"
              variant="dark"
              onPress={() => {
                setSessionId(null);
                setDone(false);
              }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function nameFor(skill: DrillType, target: number): string {
  return `${skill} ×${target}`;
}