# Synodal Room Intelligence

An interactive geospatial dashboard for Indonesia built with MapLibre GL. Overlays ecclesiastical, demographic, climate, and disaster risk data on a single map interface.

![screenshot](docs/screenshot.png)

## Layers

| Layer | Source | Default |
|---|---|---|
| **Keuskupan se-Indonesia** | GeoJSON (bundled) | On |
| **Functional Urban Areas** | Martin tile server | On |
| **Population Density** | Martin tile server (H3) | On |
| **Local Climate Zones** | LCZ Generator / WUDAPT | Off |
| **Disaster Risk — Flood** | BNPB via TiTiler COG | Off |
| **Disaster Risk — Extreme Weather** | BNPB via TiTiler COG | Off |
| **Disaster Risk — Drought** | BNPB via TiTiler COG | Off |
| **Disaster Risk — Landslide** | BNPB via TiTiler COG | Off |

The Keuskupan layer visualizes 38 dioceses across Indonesia, color-coded by type (Keuskupan Agung, Keuskupan, Ordinariat Militer) with hover highlight and click popup (bishop, cathedral, estimated Catholic population, number of parishes).

## Tech Stack

- [MapLibre GL JS](https://maplibre.org/) — WebGL map rendering
- [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- [Martin](https://martin.maplibre.org/) — self-hosted vector tile server
- [TiTiler](https://developmentseed.org/titiler/) — Cloud-Optimized GeoTIFF tile server (for BNPB raster data)
- Nginx — reverse proxy + static file serving

## Getting Started

### Development

```bash
npm install
npm run dev
```

Create a `.env` file at the project root:

```env
VITE_MARTIN_TILE_SERVER=http://localhost:3000
VITE_LCZ_TILE_SERVER=http://localhost:8080
VITE_BNPB_TILE_SERVER=http://localhost:8888
```

### Build

```bash
npm run build
# output: dist/
```

## Docker Deployment

The stack consists of three services: the web frontend (nginx), a Martin vector tile server, and a TiTiler COG raster server.

### Dockerfile (web)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### docker-compose.yaml

```yaml
services:
  synodal-web:
    build: .
    container_name: synodal-web
    ports:
      - "80:80"
    restart: unless-stopped

  martin-tileserver:
    image: ghcr.io/maplibre/martin:1.0.0
    container_name: martin-tileserver
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./tiles:/data
    command: ["--config", "/data/config.yaml"]

  titiler:
    image: ghcr.io/developmentseed/titiler:latest
    container_name: titiler
    ports:
      - "8888:8000"
    restart: unless-stopped
    command: ["uvicorn", "titiler.application.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
    environment:
      - PYTHONWARNINGS=ignore
    volumes:
      - ./bnpb:/data/bnpb

networks:
  default:
    driver: bridge
    name: synodal-network
```

### Data requirements

**Vector tiles** — served by Martin. Place tile files and a `config.yaml` in `./tiles/`. Required sources:

- `IDN_FUA` — Functional Urban Areas (Indonesia)
- `indopopulation-res5-10` — H3 population density grid

**BNPB raster files** — Cloud-Optimized GeoTIFFs mounted at `/data/bnpb` in the titiler container:

```
bnpb/
├── ID_BANJIR_COG.tif
├── ID_CUACAEKSTRIM_COG.tif
├── ID_KEKERINGAN_COG.tif
└── ID_TANAHLONGSOR_COG.tif
```

**Keuskupan GeoJSON** — already bundled in `public/data/`, no extra setup needed.

### Run

```bash
docker compose up -d
```

The dashboard will be available at `http://localhost`.

## License

MIT
