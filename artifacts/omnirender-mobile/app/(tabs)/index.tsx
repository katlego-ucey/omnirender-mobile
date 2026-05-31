import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CityMap } from "@/components/CityMap";
import { CITY_PRESETS, useCity } from "@/context/CityContext";
import { useColors } from "@/hooks/useColors";

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedCity, setSelectedCity, cityData, isLoading, weather } = useCity();
  const [showCityPicker, setShowCityPicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const togglePicker = () => {
    if (showCityPicker) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
        setShowCityPicker(false),
      );
    } else {
      setShowCityPicker(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const selectCity = (city: (typeof CITY_PRESETS)[0]) => {
    setSelectedCity(city);
    togglePicker();
  };

  const weatherIcon =
    weather?.condition === "Clear"
      ? "sunny"
      : weather?.condition?.includes("Cloud")
        ? "partly-sunny"
        : weather?.condition?.includes("Rain")
          ? "rainy"
          : "cloud";

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CityMap selectedCity={selectedCity} cityData={cityData} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity
          style={[styles.cityBtn, { backgroundColor: "rgba(10,14,26,0.85)" }]}
          onPress={togglePicker}
          activeOpacity={0.8}
        >
          <Text style={[styles.cityName, { color: colors.primary }]}>{selectedCity.name}</Text>
          <Ionicons
            name={showCityPicker ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.primary}
          />
        </TouchableOpacity>

        {weather && (
          <View style={[styles.weatherChip, { backgroundColor: "rgba(10,14,26,0.85)" }]}>
            <Ionicons name={weatherIcon as any} size={14} color={colors.accent} />
            <Text style={[styles.weatherText, { color: colors.foreground }]}>
              {Math.round(weather.temperature_c)}°C
            </Text>
          </View>
        )}
      </View>

      {/* City picker */}
      {showCityPicker && (
        <Animated.View
          style={[
            styles.picker,
            {
              backgroundColor: "rgba(10,14,26,0.96)",
              borderColor: colors.border,
              top: topPadding + 60,
              opacity: fadeAnim,
            },
          ]}
        >
          <FlatList
            data={CITY_PRESETS}
            keyExtractor={(c) => c.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  item.name === selectedCity.name && { backgroundColor: colors.secondary },
                ]}
                onPress={() => selectCity(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerItemText, { color: colors.foreground }]}>
                  {item.name}
                </Text>
                <Text style={[styles.pickerCountry, { color: colors.mutedForeground }]}>
                  {item.country}
                </Text>
                {item.name === selectedCity.name && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        </Animated.View>
      )}

      {/* Stats overlay */}
      <View
        style={[
          styles.statsOverlay,
          {
            backgroundColor: "rgba(10,14,26,0.85)",
            borderColor: colors.border,
            bottom: insets.bottom + (Platform.OS === "web" ? 84 : 90),
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : cityData ? (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.primary }]}>
                {cityData.buildings_count}
              </Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Buildings</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.accent }]}>
                {cityData.roads_count}
              </Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Roads</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: "#FFD700" }]}>{cityData.pois_count}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>POIs</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.primary }]}>
                {cityData.fetch_time_ms}ms
              </Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Fetch</Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
            Loading city data…
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 10,
  },
  cityBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flex: 1,
  },
  cityName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  weatherChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 24,
  },
  weatherText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  picker: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 20,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  pickerItemText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  pickerCountry: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statsOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  stat: { alignItems: "center", gap: 2, flex: 1 },
  statVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 0.3 },
  statDivider: { width: 1, height: 28 },
  errorText: { textAlign: "center", fontSize: 13, fontFamily: "Inter_400Regular" },
});
