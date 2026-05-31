import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Callout, Circle, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { Text } from "react-native";
import type { CityPreset } from "@/context/CityContext";
import type { CityData } from "@workspace/api-client-react";

interface CityMapProps {
  selectedCity: CityPreset;
  cityData: CityData | undefined;
}

export function CityMap({ selectedCity, cityData }: CityMapProps) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_DEFAULT}
      initialRegion={{
        latitude: selectedCity.lat,
        longitude: selectedCity.lon,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
      region={{
        latitude: selectedCity.lat,
        longitude: selectedCity.lon,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
      mapType="satellite"
      showsUserLocation
      showsCompass={false}
    >
      <Circle
        center={{ latitude: selectedCity.lat, longitude: selectedCity.lon }}
        radius={1000}
        fillColor="rgba(0,212,170,0.08)"
        strokeColor="rgba(0,212,170,0.4)"
        strokeWidth={1.5}
      />
      <Marker
        coordinate={{ latitude: selectedCity.lat, longitude: selectedCity.lon }}
        pinColor="#00D4AA"
      >
        <Callout>
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{selectedCity.name} CBD</Text>
            {cityData && (
              <Text style={styles.calloutSub}>
                {cityData.buildings_count} buildings · {cityData.roads_count} roads
              </Text>
            )}
          </View>
        </Callout>
      </Marker>
      {cityData?.buildings.slice(0, 30).map((b) => (
        <Marker
          key={b.id}
          coordinate={{ latitude: b.lat, longitude: b.lon }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View
            style={[
              styles.buildingDot,
              b.height != null && b.height > 50 ? styles.buildingDotTall : null,
            ]}
          />
          <Callout>
            <View style={styles.callout}>
              <Text style={styles.calloutTitle}>{b.name ?? "Building"}</Text>
              {b.height ? <Text style={styles.calloutSub}>{b.height}m tall</Text> : null}
            </View>
          </Callout>
        </Marker>
      ))}
      {cityData?.pois.slice(0, 20).map((p) => (
        <Marker
          key={p.id}
          coordinate={{ latitude: p.lat, longitude: p.lon }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.poiDot} />
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  buildingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,212,170,0.8)",
  },
  buildingDotTall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF6B35",
  },
  poiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFD700",
  },
  callout: { padding: 6, minWidth: 120 },
  calloutTitle: { fontSize: 13, fontWeight: "bold" },
  calloutSub: { fontSize: 11, color: "#666", marginTop: 2 },
});
