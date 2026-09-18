import { Text, View } from "react-native";

interface Props {
  title: string;
  subtitle: string;
  tone?: "neutral" | "positive" | "negative";
}

const toneClasses: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "bg-court-accent/20 text-court-accent",
  positive: "bg-court-green/20 text-court-green",
  negative: "bg-court-red/20 text-court-red",
};

export function PhaseIndicator({ title, subtitle, tone = "neutral" }: Props) {
  return (
    <View className="px-4 py-3">
      <View className="self-start px-2.5 py-0.5 rounded-md bg-court-accent/20">
        <Text className={`text-[11px] font-bold uppercase tracking-wide ${toneClasses[tone]}`}>
          {title}
        </Text>
      </View>
      <Text className="text-white text-xl font-bold mt-1">{subtitle}</Text>
    </View>
  );
}