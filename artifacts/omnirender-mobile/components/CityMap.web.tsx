import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CityPreset } from "@/context/CityContext";
import type { CityData } from "@workspace/api-client-react";

interface CityMapProps {
  selectedCity: CityPreset;
  cityData: CityData | undefined;
}

// Web fallback — displays a styled placeholder with city grid visualization
export function CityMap({ selectedCity, cityData }: CityMapProps) {
  const buildings = cityData?.buildings.slice(0, 80) ?? [];

  return (
    <View style={styles.container}>
      {/* Simulated city grid */}
      <View style={styles.grid}>
        {Array.from({ length: 100 }).map((_, i) => {
          const b = buildings[i];
          const isBuilding = !!b;
          const isTall = isBuilding && (b.height ?? 0) > 50;
          return (
            <View
              key={i}
              style={[
                styles.cell,
                isBuilding && styles.cellBuilding,
                isTall && styles.cellTall,
              ]}
            />
          );
        })}
      </View>
      <View style={styles.overlay}>
        <Ionicons name="location" size={28} color="#00D4AA" />
        <Text style={styles.cityLabel}>{selectedCity.name}</Text>
        {cityData && (
          <Text style={styles.cityCoords}>
            {selectedCity.lat.toFixed(4)}, {selectedCity.lon.toFixed(4)}
          </Text>
        )}
        <Text style={styles.webNote}>Open on mobile for live map</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#060A14",
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 260,
    height: 260,
    opacity: 0.35,
  },
  cell: {
    width: 22,
    height: 22,
    margin: 2,
    borderRadius: 3,
    backgroundColor: "#1A2236",
  },
  cellBuilding: {
    backgroundColor: "rgba(0,212,170,0.5)",
  },
  cellTall: {
    backgroundColor: "#FF6B35",
  },
  overlay: {
    position: "absolute",
    alignItems: "center",
    gap: 6,
  },
  cityLabel: {
    color: "#E2E8F4",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  cityCoords: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  webNote: {
    color: "#00D4AA",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
});
