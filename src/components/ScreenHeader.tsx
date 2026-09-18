import { Link } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface Props {
  title: string;
  right?: ReactNode;
}

export function ScreenHeader({ title, right }: Props) {
  return (
    <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-court-border">
      <Link href="/" asChild>
        <Pressable className="rounded-lg bg-court-card border border-court-border w-9 h-9 items-center justify-center active:bg-court-border">
          <Text className="text-white text-lg font-bold">{"‹"}</Text>
        </Pressable>
      </Link>
      <Text className="text-white text-lg font-bold flex-1">{title}</Text>
      {right}
    </View>
  );
}