import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Building } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

interface BuildingCardProps {
  building: Building;
  rank: number;
  isFavorite?: boolean;
  onFavorite?: () => void;
}

export function BuildingCard({ building, rank, isFavorite, onFavorite }: BuildingCardProps) {
  const colors = useColors();

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFavorite?.();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.rank, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.rankText, { color: colors.primary }]}>#{rank}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {building.name ?? `Building ${building.id.slice(-4)}`}
        </Text>
        <View style={styles.meta}>
          {building.height != null ? (
            <View style={styles.chip}>
              <Ionicons name="trending-up" size={10} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.mutedForeground }]}>
                {building.height}m
              </Text>
            </View>
          ) : null}
          {building.levels != null ? (
            <View style={styles.chip}>
              <Ionicons name="layers" size={10} color={colors.accent} />
              <Text style={[styles.chipText, { color: colors.mutedForeground }]}>
                {building.levels}F
              </Text>
            </View>
          ) : null}
          {building.type ? (
            <View style={styles.chip}>
              <Text style={[styles.chipText, { color: colors.mutedForeground }]}>
                {building.type}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <TouchableOpacity onPress={handleFavorite} style={styles.favBtn} activeOpacity={0.7}>
        <Ionicons
          name={isFavorite ? "star" : "star-outline"}
          size={20}
          color={isFavorite ? "#FFD700" : colors.mutedForeground}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  rank: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  chipText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  favBtn: {
    padding: 4,
  },
});
