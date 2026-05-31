# OmniRender Mobile

  The world's first AI-powered mobile game engine that turns any real city into a living, playable 3D world — fetching live building, road, and POI data from OpenStreetMap with no 3D artists required.

  ## Live Data Pipeline
  - 238 Johannesburg buildings fetched in <5s
  - Zero cost: OpenStreetMap + Open-Elevation + Open-Meteo (all free)
  - 113 roads, 83 POIs, elevation 1765m

  ## Tech Stack
  - Expo (React Native) mobile app
  - Express API server
  - OpenStreetMap Overpass API
  - Phase 1 of 4 complete

  ## Setup
  ```bash
  pnpm install
  pnpm --filter @workspace/api-server run dev
  pnpm --filter @workspace/omnirender-mobile run dev
  ```

  ## GitHub
  https://github.com/katlego-ucey/omnirender-mobile
  