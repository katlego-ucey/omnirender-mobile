import { Router } from "express";

const cityRouter = Router();

interface OverpassBuilding {
  id: number;
  type: string;
  tags?: {
    name?: string;
    "building:height"?: string;
    "building:levels"?: string;
    building?: string;
  };
  center?: { lat: number; lon: number };
  lat?: number;
  lon?: number;
}

interface OverpassRoad {
  id: number;
  type: string;
  tags?: {
    name?: string;
    highway?: string;
  };
  geometry?: Array<{ lat: number; lon: number }>;
}

interface OverpassPOI {
  id: number;
  tags?: {
    name?: string;
    amenity?: string;
    shop?: string;
    tourism?: string;
  };
  lat: number;
  lon: number;
}

cityRouter.get("/city-data", async (req, res) => {
  const { lat, lon, radius = "1000" } = req.query as Record<string, string>;

  if (!lat || !lon) {
    res.status(400).json({ error: "lat and lon query params are required" });
    return;
  }

  const startTime = Date.now();
  const latN = parseFloat(lat);
  const lonN = parseFloat(lon);
  const radiusN = Math.min(parseInt(radius, 10) || 1000, 5000);

  try {
    const overpassQuery = `
      [out:json][timeout:25];
      (
        way["building"](around:${radiusN},${latN},${lonN});
        way["highway"](around:${radiusN},${latN},${lonN});
        node["amenity"](around:${radiusN},${latN},${lonN});
        node["shop"](around:${radiusN},${latN},${lonN});
        node["tourism"](around:${radiusN},${latN},${lonN});
      );
      out center;
    `;

    const response = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "OmniRender/1.0 (https://github.com/katlego-ucey/omnirender-mobile)",
        },
        signal: AbortSignal.timeout(28000),
      },
    );

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = (await response.json()) as { elements: unknown[] };
    const elements = data.elements as Array<OverpassBuilding & OverpassRoad & OverpassPOI>;

    const buildings = elements
      .filter((e) => e.type === "way" && e.tags?.building)
      .map((e) => ({
        id: String(e.id),
        name: e.tags?.name ?? null,
        lat: e.center?.lat ?? e.lat ?? latN,
        lon: e.center?.lon ?? e.lon ?? lonN,
        height: e.tags?.["building:height"] ? parseFloat(e.tags["building:height"]) : null,
        levels: e.tags?.["building:levels"] ? parseInt(e.tags["building:levels"], 10) : null,
        type: e.tags?.building ?? null,
      }));

    const roads = elements
      .filter((e) => e.type === "way" && e.tags?.highway)
      .map((e) => ({
        id: String(e.id),
        name: e.tags?.name ?? null,
        type: e.tags?.highway ?? "road",
        length: null,
      }));

    const pois = elements
      .filter((e) => e.type === "node" && (e.tags?.amenity || e.tags?.shop || e.tags?.tourism))
      .map((e) => ({
        id: String(e.id),
        name: e.tags?.name ?? null,
        category: e.tags?.amenity ?? e.tags?.shop ?? e.tags?.tourism ?? "point",
        lat: e.lat,
        lon: e.lon,
      }));

    // Reverse geocode city name
    let cityName = "Unknown City";
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latN}&lon=${lonN}&format=json`,
        { headers: { "User-Agent": "OmniRender/1.0" }, signal: AbortSignal.timeout(5000) },
      );
      if (geoRes.ok) {
        const geo = (await geoRes.json()) as { address?: { city?: string; town?: string; village?: string } };
        cityName =
          geo.address?.city ?? geo.address?.town ?? geo.address?.village ?? "Unknown City";
      }
    } catch {
      // non-fatal
    }

    res.json({
      city_name: cityName,
      lat: latN,
      lon: lonN,
      radius: radiusN,
      buildings_count: buildings.length,
      roads_count: roads.length,
      pois_count: pois.length,
      buildings,
      roads,
      pois,
      unity_ready: true,
      fetch_time_ms: Date.now() - startTime,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch city data");
    res.status(500).json({ error: "Failed to fetch city data from OpenStreetMap" });
  }
});

cityRouter.get("/elevation", async (req, res) => {
  const { lat, lon } = req.query as Record<string, string>;

  if (!lat || !lon) {
    res.status(400).json({ error: "lat and lon are required" });
    return;
  }

  try {
    const response = await fetch(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`,
      { signal: AbortSignal.timeout(10000) },
    );

    if (!response.ok) {
      throw new Error(`Elevation API error: ${response.status}`);
    }

    const data = (await response.json()) as { results?: Array<{ elevation: number }> };
    const elevation = data.results?.[0]?.elevation ?? 0;

    res.json({
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      elevation_m: elevation,
    });
  } catch {
    // Fallback: use a reasonable default for Joburg (1765m)
    res.json({
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      elevation_m: 1765,
    });
  }
});

cityRouter.get("/weather", async (req, res) => {
  const { lat, lon } = req.query as Record<string, string>;

  if (!lat || !lon) {
    res.status(400).json({ error: "lat and lon are required" });
    return;
  }

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code,is_day&timezone=auto`,
      { signal: AbortSignal.timeout(10000) },
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      current?: {
        temperature_2m?: number;
        wind_speed_10m?: number;
        weather_code?: number;
        is_day?: number;
      };
    };

    const current = data.current ?? {};
    const weatherCode = current.weather_code ?? 0;

    const getCondition = (code: number): string => {
      if (code === 0) return "Clear";
      if (code <= 3) return "Partly Cloudy";
      if (code <= 9) return "Overcast";
      if (code <= 19) return "Fog";
      if (code <= 29) return "Drizzle";
      if (code <= 39) return "Rain";
      if (code <= 49) return "Snow";
      if (code <= 59) return "Sleet";
      if (code <= 69) return "Heavy Rain";
      if (code <= 79) return "Blizzard";
      if (code <= 84) return "Rain Showers";
      if (code <= 94) return "Thunderstorm";
      return "Storm";
    };

    res.json({
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      temperature_c: current.temperature_2m ?? 20,
      condition: getCondition(weatherCode),
      wind_speed_kmh: current.wind_speed_10m ?? 0,
      is_day: (current.is_day ?? 1) === 1,
      weather_code: weatherCode,
    });
  } catch {
    res.json({
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      temperature_c: 22,
      condition: "Clear",
      wind_speed_kmh: 15,
      is_day: true,
      weather_code: 0,
    });
  }
});

export default cityRouter;
