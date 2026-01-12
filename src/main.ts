import maplibregl, {
  type IControl,
  type LayerSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { layers } from "./assets/admf_branch_style.json";
import {
  InitialViewState,
  MapBasemapsRaster,
  MapBasemapsVector,
  MapConstants,
} from "./constants/map";
import "./style.css";

const map = new maplibregl.Map({
  container: "map",
  center: new maplibregl.LngLat(
    InitialViewState.longitude,
    InitialViewState.latitude
  ),
  zoom: InitialViewState.zoom,
  maxBounds: MapConstants.INDONESIA_BOUNDS as maplibregl.LngLatBoundsLike,
});

const navControl = new maplibregl.NavigationControl({
  visualizePitch: true,
  showZoom: true,
  showCompass: true,
});
map.addControl(navControl, "top-right");

function addLayers() {
  // FUA Layer
  !map.getSource("idn-fua") &&
    map.addSource("idn-fua", {
      type: "vector",
      url: "http://192.168.99.87:8120/IDN_FUA",
    }) &&
    map.addLayer(
      {
        id: "idn-fua-fill-layer",
        source: "idn-fua",
        "source-layer": "IDN_FUA",
        type: "fill",
        paint: {
          "fill-outline-color": "#808080",
          "fill-color": "#FFA500",
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.2, 15, 0],
        },
        minzoom: 8,
      },
      map.getLayer("park")?.id
    ) &&
    map.addLayer({
      id: "idn-fua-line-layer",
      source: "idn-fua",
      "source-layer": "IDN_FUA",
      type: "line",
      paint: {
        "line-color": "#808080",
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 2, 15, 0],
      },
      minzoom: 8,
    });

  // H3 Indopopulation Density Layer
  !map.getLayer("idn-h3-pop-density-layer") &&
    map.addLayer(
      {
        source: {
          type: "vector",
          url: "http://192.168.99.87:8120/indopopulation-res5-10",
        },
        "source-layer": "h3_data",
        id: "idn-h3-pop-density-layer",
        type: "fill",
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "value"],
            10,
            "#440154", // viridis min (purple)
            20,
            "#31688e", // dark blue
            50,
            "#35b779", // green
            100,
            "#fde724", // yellow
            200,
            "#fde724", // viridis max (yellow)
          ],
          "fill-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.8,
            15,
            0.2,
          ],
        },
        filter: [">", ["get", "value"], 5],
        minzoom: 5,
      },
      // "water"
      map.getLayer("idn-fua-fill-layer")?.id
    );

  // Competitor Presence Layer
  const firstLabelLayerId = map
    .getStyle()
    .layers.find((layer) => layer.id.includes("label"))?.id;
  !map.getLayer("competitor-branches-layer") &&
    map.addLayer(
      {
        source: {
          type: "vector",
          url: "http://192.168.99.87:8120/competitor_branch",
        },
        id: "competitor-branches-layer",
        "source-layer": "competitor_branches",
        type: "circle",
        paint: {
          "circle-radius": 4,
          "circle-color": [
            "match",
            ["get", "companyCode"],
            "ACC",
            "rgba(0, 238, 255, 0.78)",
            "TAF",
            "rgba(0, 238, 255, 0.78)",
            "FIF",
            "rgba(0, 238, 255, 0.78)",
            "BFIN",
            "rgba(255, 140, 0, 0.78)",
            "MTF",
            "rgba(3,78,161, 0.78)",
            "MUF",
            "rgba(3,78,161, 0.78)",
            "IMFI",
            "rgba(7,25,138, 0.78)",
            "OTO",
            "rgba(0,171,80, 0.78)",
            "rgba(0, 238, 255, 0.78)",
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#000000ff",
        },
        filter: [
          "in",
          "companyCode",
          "ACC",
          "BFIN",
          "FIF",
          "MTF",
          "MUF",
          "IMFI",
          "ACC",
          "TAF",
          "OTO",
        ],
        minzoom: 9,
      },
      firstLabelLayerId
    );

  // Mandala Customers Heatmap Layer
  !map.getLayer("mandala-customers-heatmap") &&
    map.addLayer(
      {
        id: "mandala-customers-heatmap",
        source: {
          type: "vector",
          url: "http://192.168.99.87:8120/mandala_customers_no_filter",
        },
        "source-layer": "mandala_customers",
        type: "heatmap",
        paint: {
          "heatmap-radius": 12,
          "heatmap-opacity": 0.4,
        },
        filter: [">", ["get", "total_score"], 0.6],
        minzoom: 9,
      },
      firstLabelLayerId
    );

  // ADMF HI Branch Layer
  !map.getSource("admf-hi-branch-source") &&
    map.addSource("admf-hi-branch-source", {
      type: "vector",
      url: "http://192.168.99.87:8120/admf-hi-branch",
    }) &&
    layers.forEach((layer) => {
      map.addLayer(layer as LayerSpecification);
    }, firstLabelLayerId);
}

function toogleBasemap(isRaster: boolean) {
  const style: string | maplibregl.StyleSpecification = isRaster
    ? {
        version: 8,
        sources: {
          "raster-tiles": {
            type: "raster",
            tiles: [MapBasemapsRaster["satellite"].url],
            tileSize: 128,
          },
        },
        layers: [
          {
            id: "raster-layer",
            type: "raster",
            source: "raster-tiles",
          },
        ],
      }
    : MapBasemapsVector["street"].url;

  map.setStyle(style);
  isRaster ? map.setMaxZoom(16) : map.setMaxZoom(null);

  const waitForStyle = () => {
    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      requestAnimationFrame(waitForStyle);
    }
  };

  map.on("styledata", waitForStyle);
}

// map.on("click", "idn-fua-fill-layer", (e) => {
//   console.log(e.features);
// });

// Layer configuration for the toggle control
interface LayerConfig {
  id: string;
  label: string;
  layers: string[];
  color: string;
}

const LAYER_CONFIGS: LayerConfig[] = [
  {
    id: "fua",
    label: "Urban Areas",
    layers: ["idn-fua-fill-layer", "idn-fua-line-layer"],
    color: "#FFA500",
  },
  {
    id: "population",
    label: "Population Density",
    layers: ["idn-h3-pop-density-layer"],
    color: "#35b779",
  },
  {
    id: "competitors",
    label: "Competitors",
    layers: ["competitor-branches-layer"],
    color: "#00EEFF",
  },
  {
    id: "heatmap",
    label: "Customer Heatmap",
    layers: ["mandala-customers-heatmap"],
    color: "#FF4500",
  },
  {
    id: "branches",
    label: "ADMF Branches",
    layers: [
      "admf_branch_points",
      "admf_branch_syariah",
      "admf_branch_car",
      "admf_branch_icon",
    ],
    color: "#FCDE02",
  },
];

const LAYER_STORAGE_KEY = "titan-layer-visibility";

class LayerToggleControl implements IControl {
  private _container!: HTMLDivElement;
  private _toggleButton!: HTMLButtonElement;
  private _layerList!: HTMLDivElement;
  private _map!: maplibregl.Map;
  private _expanded: boolean = false;
  private _layerStates: Map<string, boolean>;
  private _checkboxes: Map<string, HTMLInputElement> = new Map();

  constructor() {
    this._layerStates = this._loadLayerStates();
  }

  private _loadLayerStates(): Map<string, boolean> {
    const saved = localStorage.getItem(LAYER_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return new Map(Object.entries(parsed));
      } catch {
        // Invalid JSON, use defaults
      }
    }
    // Default: all layers visible
    return new Map(LAYER_CONFIGS.map((config) => [config.id, true]));
  }

  private _saveLayerStates(): void {
    const obj = Object.fromEntries(this._layerStates);
    localStorage.setItem(LAYER_STORAGE_KEY, JSON.stringify(obj));
  }

  onAdd(map: maplibregl.Map): HTMLElement {
    this._map = map;
    this._container = document.createElement("div");
    this._container.className = "maplibregl-ctrl maplibregl-ctrl-layers";

    // Create toggle button
    this._toggleButton = this._createToggleButton();
    this._container.appendChild(this._toggleButton);

    // Create layer list
    this._layerList = this._createLayerList();
    this._container.appendChild(this._layerList);

    // Apply initial layer states when style is loaded
    this._map.on("styledata", () => this._applyLayerStates());

    return this._container;
  }

  private _createToggleButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "maplibregl-ctrl-layers-toggle";
    button.setAttribute("aria-label", "Toggle layer panel");
    button.innerHTML = `
      <span>Layers</span>
      <span class="maplibregl-ctrl-layers-toggle-icon">▼</span>
    `;

    button.addEventListener("click", () => {
      this._expanded = !this._expanded;
      button.classList.toggle("expanded", this._expanded);
      this._layerList.classList.toggle("expanded", this._expanded);
    });

    return button;
  }

  private _createLayerList(): HTMLDivElement {
    const list = document.createElement("div");
    list.className = "maplibregl-ctrl-layers-list";

    LAYER_CONFIGS.forEach((config) => {
      const item = this._createLayerItem(config);
      list.appendChild(item);
    });

    return list;
  }

  private _createLayerItem(config: LayerConfig): HTMLDivElement {
    const item = document.createElement("div");
    item.className = "maplibregl-ctrl-layers-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "maplibregl-ctrl-layers-checkbox";
    checkbox.id = `layer-${config.id}`;
    checkbox.checked = this._layerStates.get(config.id) ?? true;
    this._checkboxes.set(config.id, checkbox);

    const label = document.createElement("label");
    label.className = "maplibregl-ctrl-layers-label";
    label.htmlFor = `layer-${config.id}`;
    label.textContent = config.label;

    const colorIndicator = document.createElement("span");
    colorIndicator.className = "maplibregl-ctrl-layers-color";
    colorIndicator.style.backgroundColor = config.color;

    // Toggle on checkbox change
    checkbox.addEventListener("change", () => {
      this._toggleLayer(config.id, checkbox.checked);
    });

    // Toggle on item click (excluding checkbox)
    item.addEventListener("click", (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        this._toggleLayer(config.id, checkbox.checked);
      }
    });

    item.appendChild(checkbox);
    item.appendChild(label);
    item.appendChild(colorIndicator);

    return item;
  }

  private _toggleLayer(layerId: string, isVisible: boolean): void {
    this._layerStates.set(layerId, isVisible);
    this._saveLayerStates();

    const config = LAYER_CONFIGS.find((c) => c.id === layerId);
    if (!config) return;

    config.layers.forEach((layer) => {
      if (this._map.getLayer(layer)) {
        this._map.setLayoutProperty(
          layer,
          "visibility",
          isVisible ? "visible" : "none"
        );
      }
    });
  }

  private _applyLayerStates(): void {
    LAYER_CONFIGS.forEach((config) => {
      const isVisible = this._layerStates.get(config.id) ?? true;
      config.layers.forEach((layer) => {
        if (this._map.getLayer(layer)) {
          this._map.setLayoutProperty(
            layer,
            "visibility",
            isVisible ? "visible" : "none"
          );
        }
      });
    });
  }

  onRemove(): void {
    this._container.parentNode?.removeChild(this._container);
  }
}

class BasemapControl implements IControl {
  private _container!: HTMLDivElement;
  private _button!: HTMLButtonElement;
  private _isRaster: boolean = false;

  onAdd(): HTMLElement {
    this._container = document.createElement("div");
    this._container.className = "maplibregl-ctrl maplibregl-ctrl-group";

    this._button = document.createElement("button");
    this._button.type = "button";
    this._button.title = "Toggle Satellite/Street";
    this._button.textContent = this._isRaster ? "🛰️" : "🗺️";
    this._button.style.fontSize = "16px";
    this._button.style.width = "29px";
    this._button.style.height = "29px";

    this._button.addEventListener("click", () => {
      this._isRaster = !this._isRaster;
      this._button.textContent = this._isRaster ? "🛰️" : "🗺️";
      toogleBasemap(this._isRaster);
    });

    this._container.appendChild(this._button);
    return this._container;
  }

  onRemove() {
    this._container.parentNode?.removeChild(this._container);
  }
}

map.addControl(new LayerToggleControl(), "top-left");
map.addControl(new BasemapControl(), "bottom-left");
toogleBasemap(false);
