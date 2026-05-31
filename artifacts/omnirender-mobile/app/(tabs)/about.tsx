import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhaseCard } from "@/components/PhaseCard";
import { useColors } from "@/hooks/useColors";

const TECH_STACK = [
  { category: "Data", items: ["OpenStreetMap", "Open-Elevation (NASA)", "Mapillary", "OpenWeather"] },
  { category: "AI Stack", items: ["Mobile-3DGS", "TensorFlow Lite", "CoreML", "Phi-3 LLM"] },
  { category: "Game Engine", items: ["Unity HDRP Mobile", "Unity DOTS Physics", "Vulkan / Metal"] },
  { category: "Backend", items: ["Node.js + Express", "OpenStreetMap Overpass API", "Open-Meteo"] },
];

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: bottomPad + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={[styles.logoRing, { borderColor: colors.primary + "44" }]}>
          <View style={[styles.logoInner, { backgroundColor: colors.primary + "22" }]}>
            <Ionicons name="globe" size={40} color={colors.primary} />
          </View>
        </View>
        <Text style={[styles.appName, { color: colors.foreground }]}>OmniRender</Text>
        <Text style={[styles.tagline, { color: colors.accent }]}>Mobile</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          The world's first AI-powered mobile game engine that turns any real city into a living,
          playable 3D world — with no 3D artists required.
        </Text>
      </View>

      {/* Key metrics */}
      <View style={styles.metricsRow}>
        {[
          { value: "3.2B", label: "Mobile Gamers" },
          { value: "$100B+", label: "Market Size" },
          { value: "$0", label: "Map Data Cost" },
        ].map((m) => (
          <View key={m.label} style={[styles.metric, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metricVal, { color: colors.primary }]}>{m.value}</Text>
            <Text style={[styles.metricLbl, { color: colors.mutedForeground }]}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Status badge */}
      <View style={[styles.statusBanner, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
        <View style={[styles.liveIndicator, { backgroundColor: colors.primary }]} />
        <Text style={[styles.statusText, { color: colors.primary }]}>
          Phase 1 LIVE · Data pipeline deployed · 238 Joburg buildings in &lt;5s
        </Text>
      </View>

      {/* Roadmap */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ROADMAP</Text>
      <PhaseCard
        phase={1}
        title="The Skeleton"
        months="Months 1–2"
        items={["Live OSM data API ✓ Done", "238 Joburg buildings live", "Unity C# bridge script", "Walkable block city"]}
        status="done"
      />
      <PhaseCard
        phase={2}
        title="The AI Skin"
        months="Months 3–4"
        items={["Mobile-3DGS integration", "Mapillary texture sourcing", "AI super-resolution", "Photorealistic facades"]}
        status="upcoming"
      />
      <PhaseCard
        phase={3}
        title="The Life"
        months="Months 5–6"
        items={["On-device LLM NPCs", "Vehicle physics + hijacking", "Day/night + load shedding", "Quest system"]}
        status="upcoming"
      />
      <PhaseCard
        phase={4}
        title="Ship It"
        months="Month 7"
        items={["60 FPS optimisation", "Thermal throttling", "Beta testing Joburg", "App Store launch"]}
        status="upcoming"
      />

      {/* Tech stack */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>TECH STACK</Text>
      {TECH_STACK.map((group) => (
        <View key={group.category} style={[styles.techGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.techCategory, { color: colors.primary }]}>{group.category}</Text>
          <View style={styles.techItems}>
            {group.items.map((item) => (
              <View key={item} style={[styles.techChip, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.techChipText, { color: colors.foreground }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Architecture layers */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SYSTEM ARCHITECTURE</Text>
      {[
        { icon: "download-outline", label: "Data Ingestion", sub: "OSM · Mapillary · NASA SRTM", color: "#818CF8" },
        { icon: "hardware-chip-outline", label: "AI Reconstruction", sub: "3DGS · Diffusion · GAN/VAE", color: colors.primary },
        { icon: "game-controller-outline", label: "Simulation", sub: "Unity DOTS · RL Events · LLM NPCs", color: colors.accent },
        { icon: "phone-portrait-outline", label: "Mobile Render", sub: "Vulkan/Metal · 60 FPS · FSR", color: "#FFD700" },
      ].map((layer, i) => (
        <View key={layer.label} style={styles.archRow}>
          <View style={[styles.archIcon, { backgroundColor: layer.color + "22" }]}>
            <Ionicons name={layer.icon as any} size={20} color={layer.color} />
          </View>
          <View style={styles.archInfo}>
            <Text style={[styles.archLabel, { color: colors.foreground }]}>{layer.label}</Text>
            <Text style={[styles.archSub, { color: colors.mutedForeground }]}>{layer.sub}</Text>
          </View>
          {i < 3 && (
            <Ionicons name="arrow-down" size={16} color={colors.mutedForeground} />
          )}
        </View>
      ))}

      {/* Investor CTA */}
      <View style={[styles.ctaCard, { backgroundColor: colors.accent + "18", borderColor: colors.accent + "44" }]}>
        <Text style={[styles.ctaTitle, { color: colors.foreground }]}>Seed Round · R2.5M</Text>
        <Text style={[styles.ctaSub, { color: colors.mutedForeground }]}>
          18-month runway · Engineering + AI Infrastructure + Beta Launch
        </Text>
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: colors.accent }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Linking.openURL("mailto:invest@omnirender.io");
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="mail" size={16} color="#fff" />
          <Text style={styles.ctaBtnText}>Connect with Us</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.footer, { color: colors.mutedForeground }]}>
        OmniRender Mobile · v1.0.0-alpha · Phase 1
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },
  hero: { alignItems: "center", paddingVertical: 16, gap: 6 },
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: { fontSize: 36, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  tagline: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: -4 },
  description: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  metricsRow: { flexDirection: "row", gap: 10 },
  metric: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  metricVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  metricLbl: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  liveIndicator: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold", flex: 1 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    marginTop: 4,
  },
  techGroup: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  techCategory: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  techItems: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  techChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  techChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  archRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  archIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  archInfo: { flex: 1 },
  archLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  archSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  ctaCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 10,
    marginTop: 4,
  },
  ctaTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  ctaSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  ctaBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  footer: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
});
