import * as Haptics from "expo-haptics";
import { useRef } from "react";
import { Animated, Pressable, Text } from "react-native";

type Variant =
  | "green"
  | "red"
  | "blue"
  | "yellow"
  | "accent"
  | "neutral"
  | "dark";

const variantClasses: Record<Variant, string> = {
  green: "bg-court-green active:bg-court-green/80",
  red: "bg-court-red active:bg-court-red/80",
  blue: "bg-court-blue active:bg-court-blue/80",
  yellow: "bg-court-yellow active:bg-court-yellow/80",
  accent: "bg-court-accent active:bg-court-accent/80",
  neutral: "bg-court-card border border-court-border active:bg-court-border",
  dark: "bg-black/40 border border-court-border active:bg-black/60",
};

interface Props {
  label: string;
  sublabel?: string;
  variant?: Variant;
  onPress?: () => void;
  disabled?: boolean;
  size?: "md" | "lg";
  haptic?: "none" | "selection" | "success" | "error";
  flash?: boolean;
  className?: string;
}

export function BigButton({
  label,
  sublabel,
  variant = "neutral",
  onPress,
  disabled,
  size = "md",
  haptic = "selection",
  flash = false,
  className = "",
}: Props) {
  const flashAnim = useRef(new Animated.Value(0)).current;

  const fireHaptic = () => {
    if (haptic === "none") return;
    const p =
      haptic === "success"
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : haptic === "error"
          ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    p.catch(() => undefined);
  };

  const runFlash = () => {
    flashAnim.setValue(0);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 110, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        fireHaptic();
        if (flash) runFlash();
        onPress?.();
      }}
      disabled={disabled}
      className={`items-center justify-center rounded-xl py-2.5 ${variantClasses[variant]} ${
        size === "lg" ? "min-h-20" : "min-h-14"
      } ${disabled ? "opacity-40" : ""} ${className}`}
    >
      <Text
        className={`text-white font-bold text-center ${size === "lg" ? "text-2xl" : "text-lg"}`}
      >
        {label}
      </Text>
      {sublabel ? (
        <Text className="text-white/60 text-xs mt-0.5">{sublabel}</Text>
      ) : null}
      {flash ? (
        <Animated.View
          pointerEvents="none"
          style={{ opacity: flashAnim }}
          className="absolute inset-0 rounded-xl border-2 border-white"
        />
      ) : null}
    </Pressable>
  );
}