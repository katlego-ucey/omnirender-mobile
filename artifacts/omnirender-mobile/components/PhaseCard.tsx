import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface PhaseCardProps {
  phase: number;
  title: string;
  months: string;
  items: string[];
  status: "done" | "active" | "upcoming";
}

export function PhaseCard({ phase, title, months, items, status }: PhaseCardProps) {
  const colors = useColors();

  const statusColor =
    status === "done" ? colors.primary : status === "active" ? colors.accent : colors.mutedForeground;

  const statusLabel = status === "done" ? "LIVE" : status === "active" ? "IN PROGRESS" : "PLANNED";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: status === "done" || status === "active" ? statusColor : colors.border,
          borderWidth: status === "done" ? 1.5 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.phaseBadge, { backgroundColor: statusColor + "22" }]}>
          <Text style={[styles.phaseNum, { color: statusColor }]}>Phase {phase}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
          {status === "done" && (
            <Ionicons name="checkmark-circle" size={12} color={statusColor} />
          )}
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.months, { color: colors.mutedForeground }]}>{months}</Text>
      <View style={styles.items}>
        {items.map((item, i) => (
          <View key={i} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={[styles.itemText, { color: colors.foreground }]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  phaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  phaseNum: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  months: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  items: {
    gap: 6,
    marginTop: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  itemText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
});
