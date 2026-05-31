import { Router } from "express";

const cityRouter = Router();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OverpassElement {
  id: number;
  type: string;
  tags?: {
    name?: string;
    "building:height"?: string;
    "building:levels"?: string;
    building?: string;
    highway?: string;
    amenity?: string;
    shop?: string;
    tourism?: string;
  };
  center?: { lat: number; lon: number };
  lat?: number;
  lon?: number;
}

interface CachedEntry<T> {
  data: T;
  expires: number;
  cachedAt: number;
}

// ---------------------------------------------------------------------------
// In-memory server-side cache (stale-while-revalidate pattern)
// ---------------------------------------------------------------------------

const cityCache = new Map<string, CachedEntry<object>>();
const elevCache = new Map<string, CachedEntry<object>>();
const weatherCache = new Map<string, CachedEntry<object>>();

// Separate stale store — kept indefinitely, used as fallback when live fetch fails
const staleFallback = new Map<string, object>();

const TTL = {
  city: 10 * 60 * 1000,      // 10 min — fast enough, saves Overpass quota
  elevation: 24 * 60 * 60 * 1000, // 24 h — terrain doesn't change
  weather: 5 * 60 * 1000,    // 5 min — weather changes often
};

function cityKey(lat: number, lon: number, radius: number) {
  // 3 dp ≈ 111m — nearby queries share same cache bucket
  return `${lat.toFixed(3)}_${lon.toFixed(3)}_${radius}`;
}

function coordKey(lat: number, lon: number) {
  return `${lat.toFixed(3)}_${lon.toFixed(3)}`;
}

// ---------------------------------------------------------------------------
// Exponential backoff fetch helper
// ---------------------------------------------------------------------------

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2,
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      // Retryable server errors
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status}`);
        if (attempt < maxRetries) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) await sleep(Math.pow(2, attempt) * 1000);
    }
  }
  throw lastErr;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// GET /api/city-data
// ---------------------------------------------------------------------------

cityRouter.get("/city-data", async (req, res) => {
  const { lat, lon, radius = "1000" } = req.query as Record<string, string>;

  if (!lat || !lon) {
    res.status(400).json({ error: "lat and lon are required" });
    return;
  }

  const startTime = Date.now();
  const latN = parseFloat(lat);
  const lonN = parseFloat(lon);
  const radiusN = Math.min(parseInt(radius, 10) || 1000, 5000);
  const key = cityKey(latN, lonN, radiusN);

  // --- Cache hit ---
  const cached = cityCache.get(key);
  if (cached && cached.expires > Date.now()) {
    res.json({ ...cached.data, cache_hit: true, data_source: "cache", fetch_time_ms: 0 });
    return;
  }

  try {
    // -------------------------------------------------------------------
    // Optimised Overpass QL query
    //   [maxsize:2000000] — hard 2 MB response cap → faster transfer
    //   [timeout:20]      — 20 s server-side abort
    //   qt                — QuickSort by QuadTile (spatially ordered, faster)
    //   350               — hard element count cap → LOD control
    //   highway~regex     — only meaningful road classes (no paths/steps)
    // -------------------------------------------------------------------
    const overpassQuery = `
      [out:json][timeout:20][maxsize:2000000];
      (
        way["building"](around:${radiusN},${latN},${lonN});
        way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified)$"](around:${radiusN},${latN},${lonN});
        node["amenity"](around:${radiusN},${latN},${lonN});
        node["shop"](around:${radiusN},${latN},${lonN});
      );
      out center qt 350;
    `;

    const response = await fetchWithRetry(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "OmniRender/1.0 (https://github.com/katlego-ucey/omnirender-mobile)",
        },
        signal: AbortSignal.timeout(25000),
      },
    );

    const data = (await response.json()) as { elements: OverpassElement[] };
    const elements = data.elements;

    // LOD caps — prevent mobile memory spikes
    const buildings = elements
      .filter((e) => e.type === "way" && e.tags?.building)
      .slice(0, 200)                                 // LOD: max 200 buildings
      .map((e) => ({
        id: String(e.id),
        name: e.tags?.name ?? null,
        lat: e.center?.lat ?? latN,
        lon: e.center?.lon ?? lonN,
        height: e.tags?.["building:height"] ? parseFloat(e.tags["building:height"]) : null,
        levels: e.tags?.["building:levels"] ? parseInt(e.tags["building:levels"], 10) : null,
        type: e.tags?.building ?? null,
      }));

    const roads = elements
      .filter((e) => e.type === "way" && e.tags?.highway)
      .slice(0, 100)                                 // LOD: max 100 roads
      .map((e) => ({
        id: String(e.id),
        name: e.tags?.name ?? null,
        type: e.tags?.highway ?? "road",
        length: null,
      }));

    const pois = elements
      .filter((e) => e.type === "node" && (e.tags?.amenity || e.tags?.shop))
      .slice(0, 80)                                  // LOD: max 80 POIs
      .map((e) => ({
        id: String(e.id),
        name: e.tags?.name ?? null,
        category: e.tags?.amenity ?? e.tags?.shop ?? "point",
        lat: e.lat ?? latN,
        lon: e.lon ?? lonN,
      }));

    // Lightweight reverse geocode (non-blocking, best-effort)
    let cityName = "Unknown City";
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latN}&lon=${lonN}&format=json`,
        {
          headers: { "User-Agent": "OmniRender/1.0" },
          signal: AbortSignal.timeout(4000),
        },
      );
      if (geoRes.ok) {
        const geo = (await geoRes.json()) as {
          address?: { city?: string; town?: string; village?: string };
        };
        cityName = geo.address?.city ?? geo.address?.town ?? geo.address?.village ?? "Unknown City";
      }
    } catch { /* non-fatal */ }

    const payload = {
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
      cache_hit: false,
      data_source: "live" as const,
    };

    // Write to both cache layers
    cityCache.set(key, { data: payload, expires: Date.now() + TTL.city, cachedAt: Date.now() });
    staleFallback.set(key, payload);

    res.json(payload);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch city data");

    // Stale fallback — return last known good data rather than failing
    const stale = staleFallback.get(key);
    if (stale) {
      req.log.warn({ key }, "Serving stale city data as fallback");
      res.json({
        ...stale,
        cache_hit: true,
        data_source: "stale",
        fetch_time_ms: Date.now() - startTime,
      });
      return;
    }

    res.status(500).json({ error: "Failed to fetch city data. Please try again." });
  }
});

// ---------------------------------------------------------------------------
// GET /api/elevation  — returns a 3×3 terrain grid (9 sample points)
// ---------------------------------------------------------------------------

cityRouter.get("/elevation", async (req, res) => {
  const { lat, lon } = req.query as Record<string, string>;

  if (!lat || !lon) {
    res.status(400).json({ error: "lat and lon are required" });
    return;
  }

  const latN = parseFloat(lat);
  const lonN = parseFloat(lon);
  const key = coordKey(latN, lonN);

  const cached = elevCache.get(key);
  if (cached && cached.expires > Date.now()) {
    res.json(cached.data);
    return;
  }

  // Build a 3×3 grid of sample points spaced 0.01° ≈ 1.1 km apart
  const offsets = [-0.01, 0, 0.01];
  const gridPoints: Array<{ lat: number; lon: number }> = [];
  for (const dy of offsets) {
    for (const dx of offsets) {
      gridPoints.push({ lat: +(latN + dy).toFixed(5), lon: +(lonN + dx).toFixed(5) });
    }
  }
  const locationStr = gridPoints.map((p) => `${p.lat},${p.lon}`).join("|");

  try {
    const response = await fetchWithRetry(
      `https://api.open-elevation.com/api/v1/lookup?locations=${locationStr}`,
      { signal: AbortSignal.timeout(12000) },
    );

    const data = (await response.json()) as { results?: Array<{ elevation: number }> };
    const results = data.results ?? [];

    const enriched = gridPoints.map((p, i) => ({
      lat: p.lat,
      lon: p.lon,
      elevation_m: results[i]?.elevation ?? 0,
    }));

    const centerElevation = enriched[4]?.elevation_m ?? 0; // center of 3×3

    const payload = {
      lat: latN,
      lon: lonN,
      elevation_m: centerElevation,
      grid_points: enriched,
    };

    elevCache.set(key, { data: payload, expires: Date.now() + TTL.elevation, cachedAt: Date.now() });
    staleFallback.set(`elev_${key}`, payload);

    res.json(payload);
  } catch {
    // Fallback: reasonable defaults per approximate latitude band
    const fallbackElevation = Math.abs(latN) < 23.5 ? 200 : Math.abs(latN) < 45 ? 100 : 50;
    const stale = staleFallback.get(`elev_${key}`);
    res.json(
      stale ?? {
        lat: latN,
        lon: lonN,
        elevation_m: fallbackElevation,
        grid_points: gridPoints.map((p) => ({ ...p, elevation_m: fallbackElevation })),
      },
    );
  }
});

// ---------------------------------------------------------------------------
// GET /api/weather
// ---------------------------------------------------------------------------

cityRouter.get("/weather", async (req, res) => {
  const { lat, lon } = req.query as Record<string, string>;

  if (!lat || !lon) {
    res.status(400).json({ error: "lat and lon are required" });
    return;
  }

  const latN = parseFloat(lat);
  const lonN = parseFloat(lon);
  const key = coordKey(latN, lonN);

  const cached = weatherCache.get(key);
  if (cached && cached.expires > Date.now()) {
    res.json(cached.data);
    return;
  }

  try {
    const response = await fetchWithRetry(
      `https://api.open-meteo.com/v1/forecast?latitude=${latN}&longitude=${lonN}&current=temperature_2m,wind_speed_10m,weather_code,is_day&timezone=auto`,
      { signal: AbortSignal.timeout(8000) },
    );

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

    const payload = {
      lat: latN,
      lon: lonN,
      temperature_c: current.temperature_2m ?? 20,
      condition: getCondition(weatherCode),
      wind_speed_kmh: current.wind_speed_10m ?? 0,
      is_day: (current.is_day ?? 1) === 1,
      weather_code: weatherCode,
    };

    weatherCache.set(key, { data: payload, expires: Date.now() + TTL.weather, cachedAt: Date.now() });
    staleFallback.set(`weather_${key}`, payload);
    res.json(payload);
  } catch {
    const stale = staleFallback.get(`weather_${key}`);
    res.json(
      stale ?? {
        lat: latN,
        lon: lonN,
        temperature_c: 22,
        condition: "Clear",
        wind_speed_kmh: 15,
        is_day: true,
        weather_code: 0,
      },
    );
  }
});

export default cityRouter;
