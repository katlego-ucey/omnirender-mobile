import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCity } from "@/context/CityContext";
import { useColors } from "@/hooks/useColors";

interface Block {
  id: string;
  x: number;
  y: number;
  height: number;
  color: string;
  label: string | null;
}

const COLS = 12;
const ROWS = 14;
const CELL = 26;

function getBlockColor(height: number, primary: string, accent: string): string {
  if (height > 80) return accent;
  if (height > 40) return primary;
  if (height > 20) return primary + "BB";
  return primary + "66";
}

export default function RenderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cityData, selectedCity, isLoading } = useCity();
  const [renderMode, setRenderMode] = useState<"top" | "iso">("iso");
  const [isRendering, setIsRendering] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (!cityData) return;
    const newBlocks: Block[] = [];
    const usedSlots = new Set<string>();

    cityData.buildings.slice(0, COLS * ROWS).forEach((b, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const slot = `${col}-${row}`;
      if (!usedSlots.has(slot)) {
        usedSlots.add(slot);
        const h = b.levels ? b.levels * 3.5 : b.height ?? 5 + Math.random() * 20;
        newBlocks.push({
          id: b.id,
          x: col,
          y: row,
          height: h,
          color: getBlockColor(h, colors.primary, colors.accent),
          label: b.name,
        });
      }
    });

    setBlocks(newBlocks);
  }, [cityData, colors.primary, colors.accent]);

  const triggerRender = () => {
    setIsRendering(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      { iterations: 3 },
    ).start(() => setIsRendering(false));
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  const gridH = ROWS * CELL;
  const gridW = COLS * CELL;

  const scanY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, gridH] });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Game Render</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {selectedCity.name} · Phase 1 Preview
          </Text>
        </View>
        <View style={styles.modeTabs}>
          {(["iso", "top"] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.modeTab,
                {
                  backgroundColor: renderMode === m ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                setRenderMode(m);
                Haptics.selectionAsync();
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={m === "iso" ? "cube" : "grid"}
                size={14}
                color={renderMode === m ? colors.primaryForeground : colors.mutedForeground}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Grid viewport */}
        <View style={[styles.viewport, { borderColor: colors.primary + "44" }]}>
          <View style={{ width: gridW, height: gridH, position: "relative" }}>
            {/* Grid lines */}
            {Array.from({ length: COLS + 1 }).map((_, i) => (
              <View
                key={`v${i}`}
                style={[styles.gridLine, styles.vertLine, { left: i * CELL, height: gridH, backgroundColor: colors.primary + "18" }]}
              />
            ))}
            {Array.from({ length: ROWS + 1 }).map((_, i) => (
              <View
                key={`h${i}`}
                style={[styles.gridLine, styles.horzLine, { top: i * CELL, width: gridW, backgroundColor: colors.primary + "18" }]}
              />
            ))}

            {/* Blocks */}
            {blocks.map((block) => {
              const blockH = renderMode === "iso"
                ? Math.min(block.height * 0.3, CELL - 2)
                : CELL - 4;
              const blockW = CELL - 2;

              return (
                <Animated.View
                  key={block.id}
                  style={[
                    styles.block,
                    {
                      left: block.x * CELL + 1,
                      top: block.y * CELL + 1,
                      width: blockW,
                      height: blockH,
                      backgroundColor: block.color,
                      bottom: renderMode === "iso" ? undefined : undefined,
                    },
                    renderMode === "iso" && {
                      top: block.y * CELL + CELL - 1 - blockH,
                    },
                  ]}
                />
              );
            })}

            {/* Scanner line */}
            {isRendering && (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    width: gridW,
                    backgroundColor: colors.primary,
                    transform: [{ translateY: scanY }],
                  },
                ]}
              />
            )}

            {isLoading && (
              <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                <Text style={[styles.loadingLabel, { color: colors.primary }]}>
                  Fetching OSM data…
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {[
            { color: colors.accent, label: "Skyscraper (>80m)" },
            { color: colors.primary, label: "High-rise (>40m)" },
            { color: colors.primary + "BB", label: "Mid-rise (>20m)" },
            { color: colors.primary + "66", label: "Low-rise (<20m)" },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Pipeline status */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DATA PIPELINE STATUS</Text>
        {[
          { label: "OSM Geometry", status: "live", value: `${cityData?.buildings_count ?? 0} buildings` },
          { label: "Road Network", status: "live", value: `${cityData?.roads_count ?? 0} roads` },
          { label: "POIs", status: "live", value: `${cityData?.pois_count ?? 0} points` },
          { label: "3DGS Rendering", status: "phase2", value: "Month 3–4" },
          { label: "On-device LLM NPCs", status: "phase3", value: "Month 5–6" },
          { label: "60 FPS Optimization", status: "phase4", value: "Month 7" },
        ].map((row) => (
          <View
            key={row.label}
            style={[styles.pipelineRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    row.status === "live"
                      ? colors.primary
                      : row.status === "phase2"
                        ? colors.accent
                        : colors.mutedForeground,
                },
              ]}
            />
            <Text style={[styles.pipelineLabel, { color: colors.foreground }]}>{row.label}</Text>
            <Text style={[styles.pipelineValue, { color: row.status === "live" ? colors.primary : colors.mutedForeground }]}>
              {row.value}
            </Text>
          </View>
        ))}

        {/* Render button */}
        <TouchableOpacity
          style={[
            styles.renderBtn,
            { backgroundColor: isRendering ? colors.secondary : colors.primary },
          ]}
          onPress={triggerRender}
          disabled={isRendering || isLoading}
          activeOpacity={0.85}
        >
          <Animated.View style={{ transform: [{ scale: isRendering ? pulseAnim : 1 }], flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons
              name={isRendering ? "pulse" : "flash"}
              size={20}
              color={isRendering ? colors.primary : colors.primaryForeground}
            />
            <Text style={[styles.renderBtnText, { color: isRendering ? colors.primary : colors.primaryForeground }]}>
              {isRendering ? "Rendering…" : "Simulate Render Pass"}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  modeTabs: { flexDirection: "row", gap: 6 },
  modeTab: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 12 },
  viewport: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#060A14",
  },
  gridLine: { position: "absolute" },
  vertLine: { width: 1 },
  horzLine: { height: 1 },
  block: {
    position: "absolute",
    borderRadius: 2,
    opacity: 0.9,
  },
  scanLine: {
    position: "absolute",
    height: 2,
    left: 0,
    opacity: 0.8,
    shadowColor: "#00D4AA",
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  loadingOverlay: {
    backgroundColor: "rgba(6,10,20,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingVertical: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    marginTop: 4,
  },
  pipelineRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  pipelineLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  pipelineValue: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  renderBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  renderBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
