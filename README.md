# Synodal Room Intelligence

An interactive geospatial dashboard for Indonesia built with MapLibre GL. Visualizes urban, demographic, climate, and disaster risk data on a single map interface.

## Features

- **Functional Urban Areas (FUA)** — Urban boundary polygons across Indonesia
- **Population Density** — H3 hexagonal grid with viridis color scale (people/km²)
- **Local Climate Zones (LCZ)** — WUDAPT classification raster layer
- **Disaster Risk (BNPB)** — Flood, extreme weather, drought, and landslide risk layers

## Tech Stack

- [MapLibre GL JS](https://maplibre.org/) — WebGL map rendering
- [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- Self-hosted vector tiles via [Martin](https://martin.maplibre.org/)
- Raster tiles served via TiTiler (COG)

## Getting Started

```bash
npm install
npm run dev
```

### Environment Variables

Create a `.env` file at the project root:

```env
VITE_MARTIN_TILE_SERVER=http://localhost:3000
VITE_LCZ_TILE_SERVER=http://localhost:8080
VITE_BNPB_TILE_SERVER=http://localhost:8888
```

## License

MIT
