import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BuildingCard } from "@/components/BuildingCard";
import { StatCard } from "@/components/StatCard";
import { CITY_PRESETS, useCity } from "@/context/CityContext";
import { useColors } from "@/hooks/useColors";
import type { Building } from "@workspace/api-client-react";

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedCity, setSelectedCity, cityData, elevation, weather, isLoading, isError, favoriteBuilding, setFavoriteBuilding } = useCity();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"buildings" | "roads" | "pois">("buildings");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredBuildings = (cityData?.buildings ?? []).filter(
    (b) => !search || (b.name ?? "").toLowerCase().includes(search.toLowerCase()),
  );
  const filteredRoads = (cityData?.roads ?? []).filter(
    (r) => !search || (r.name ?? "").toLowerCase().includes(search.toLowerCase()),
  );
  const filteredPois = (cityData?.pois ?? []).filter(
    (p) => !search || (p.name ?? p.category).toLowerCase().includes(search.toLowerCase()),
  );

  const tallestBuilding = cityData?.buildings.reduce<Building | null>(
    (best, b) => (b.height ?? 0) > (best?.height ?? 0) ? b : best,
    null,
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Explorer</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityTabs}>
          {CITY_PRESETS.slice(0, 4).map((city) => (
            <TouchableOpacity
              key={city.name}
              style={[
                styles.cityChip,
                {
                  backgroundColor:
                    selectedCity.name === city.name ? colors.primary : colors.card,
                  borderColor: selectedCity.name === city.name ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setSelectedCity(city);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.cityChipText,
                  { color: selectedCity.name === city.name ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {city.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 90 }]}
        refreshControl={
          <RefreshControl refreshing={isLoading} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats grid */}
        {isLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Fetching {selectedCity.name} from OpenStreetMap…
            </Text>
          </View>
        ) : isError ? (
          <View style={styles.errorBlock}>
            <Ionicons name="wifi-outline" size={36} color={colors.mutedForeground} />
            <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
              Failed to fetch city data
            </Text>
          </View>
        ) : cityData ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>LIVE DATA</Text>
            <View style={styles.statsGrid}>
              <StatCard value={cityData.buildings_count} label="Buildings" color={colors.primary} />
              <StatCard value={cityData.roads_count} label="Roads" color={colors.accent} />
              <StatCard value={cityData.pois_count} label="POIs" color="#FFD700" />
            </View>
            <View style={styles.statsGrid}>
              {elevation && (
                <StatCard
                  value={`${elevation.elevation_m}m`}
                  label="Elevation"
                  color="#818CF8"
                  sublabel="above sea level"
                />
              )}
              {weather && (
                <StatCard
                  value={`${Math.round(weather.temperature_c)}°C`}
                  label={weather.condition}
                  color={colors.accent}
                  sublabel={`${weather.wind_speed_kmh}km/h wind`}
                />
              )}
              <StatCard
                value={`${cityData.fetch_time_ms}ms`}
                label="Fetch Time"
                color={colors.primary}
                sublabel="zero cost"
              />
            </View>

            {tallestBuilding && tallestBuilding.height ? (
              <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.primary + "44" }]}>
                <Ionicons name="business" size={20} color={colors.primary} />
                <View style={styles.featureInfo}>
                  <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                    {tallestBuilding.name ?? "Tallest Building"}
                  </Text>
                  <Text style={[styles.featureSub, { color: colors.mutedForeground }]}>
                    {tallestBuilding.height}m · {tallestBuilding.levels ?? "?"} floors
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>TALLEST</Text>
                </View>
              </View>
            ) : null}

            {/* Tabs */}
            <View style={[styles.tabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {(["buildings", "roads", "pois"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    activeTab === tab && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: activeTab === tab ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {" "}
                    ({tab === "buildings" ? cityData.buildings_count : tab === "roads" ? cityData.roads_count : cityData.pois_count})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search */}
            <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder={`Search ${activeTab}…`}
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              ) : null}
            </View>

            {activeTab === "buildings" && (
              <View style={styles.list}>
                {filteredBuildings.slice(0, 30).map((b, i) => (
                  <BuildingCard
                    key={b.id}
                    building={b}
                    rank={i + 1}
                    isFavorite={favoriteBuilding?.id === b.id}
                    onFavorite={() => setFavoriteBuilding(favoriteBuilding?.id === b.id ? null : b)}
                  />
                ))}
                {filteredBuildings.length === 0 && (
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    No buildings found
                  </Text>
                )}
              </View>
            )}

            {activeTab === "roads" && (
              <View style={styles.list}>
                {filteredRoads.slice(0, 30).map((r, i) => (
                  <View key={r.id} style={[styles.roadItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.roadIcon, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="git-branch" size={14} color={colors.accent} />
                    </View>
                    <Text style={[styles.roadName, { color: colors.foreground }]} numberOfLines={1}>
                      {r.name ?? `${r.type} road`}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>{r.type}</Text>
                    </View>
                  </View>
                ))}
                {filteredRoads.length === 0 && (
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No roads found</Text>
                )}
              </View>
            )}

            {activeTab === "pois" && (
              <View style={styles.list}>
                {filteredPois.slice(0, 30).map((p) => (
                  <View key={p.id} style={[styles.roadItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.roadIcon, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="location" size={14} color="#FFD700" />
                    </View>
                    <Text style={[styles.roadName, { color: colors.foreground }]} numberOfLines={1}>
                      {p.name ?? p.category}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>{p.category}</Text>
                    </View>
                  </View>
                ))}
                {filteredPois.length === 0 && (
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No POIs found</Text>
                )}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  cityTabs: { gap: 8 },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  cityChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 12 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    marginTop: 4,
  },
  statsGrid: { flexDirection: "row", gap: 10 },
  loadingBlock: { alignItems: "center", paddingVertical: 60, gap: 16 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  errorBlock: { alignItems: "center", paddingVertical: 60, gap: 12 },
  errorText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  featureSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  tabs: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  tabText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  list: { gap: 8 },
  roadItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  roadIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  roadName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  emptyText: { textAlign: "center", fontSize: 13, fontFamily: "Inter_400Regular", paddingVertical: 24 },
});
