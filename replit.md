# OmniRender Mobile

The world's first AI-powered mobile game engine that turns any real city into a living, playable 3D world — fetching live building, road, and POI data from OpenStreetMap with no 3D artists required.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/omnirender-mobile run dev` — run the Expo mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) with expo-router
- API: Express 5
- Maps: react-native-maps 1.18.0 (pinned — only version compatible with Expo Go)
- Data: OpenStreetMap Overpass API, Open-Elevation, Open-Meteo (all free, no keys)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI source of truth (city-data, elevation, weather endpoints)
- `artifacts/api-server/src/routes/city.ts` — OSM data fetch routes
- `artifacts/omnirender-mobile/context/CityContext.tsx` — city state + API queries
- `artifacts/omnirender-mobile/app/(tabs)/` — 4 screens: Map, Explore, Render, About
- `artifacts/omnirender-mobile/constants/colors.ts` — dark theme design tokens

## Architecture decisions

- All 3 data sources (OSM, elevation, weather) are 100% free with no API keys required
- react-native-maps pinned to exactly 1.18.0 — newer versions crash in Expo Go
- Dark theme (#0A0E1A background) inspired by a game engine console/IDE aesthetic
- City data is cached with React Query (5 min staleTime) to avoid hammering the Overpass API
- OSM queries are capped at 5km radius and 25s timeout to prevent long fetches

## Product

- **Map tab**: Satellite map of any city with building markers, stats overlay, city picker
- **Explore tab**: Live OSM data explorer — buildings, roads, POIs with search + filtering
- **Render tab**: Block-city game preview grid + data pipeline status dashboard
- **About tab**: Investor pitch, tech stack, 4-phase roadmap, architecture overview

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- react-native-maps must be pinned to 1.18.0 — do NOT upgrade it
- Do NOT add react-native-maps to the plugins array in app.json — it crashes the app
- Overpass API has rate limits — use staleTime in React Query to reduce requests
- After any OpenAPI spec change: run `pnpm --filter @workspace/api-spec run codegen` before using hooks

## GitHub

- Repo: https://github.com/katlego-ucey/omnirender-mobile
- Remote: https://github.com/katlego-ucey/omnirender-mobile.git

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
