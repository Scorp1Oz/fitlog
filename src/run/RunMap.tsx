import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MLMap,
  UserLocation,
} from "@maplibre/maplibre-react-native";

import { colors } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

// Власний темний ВЕКТОРНИЙ стиль під тему додатку. Тайли OpenFreeMap
// (схема OpenMapTiles) — безкоштовні, без API-ключа. Векторні тайли
// дозволяють фарбувати кожен тип об'єкта окремо: ліс/зелень — лаймовим,
// дороги — сірими, будівлі — темно-сірими.
export const MAP_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sprite: "https://tiles.openfreemap.org/sprites/ofm_f384/ofm",
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
      attribution: "© OpenFreeMap © OpenMapTiles © OpenStreetMap",
    },
  },
  layers: [
    // Фон кольору застосунку.
    { id: "bg", type: "background", paint: { "background-color": colors.bg } },

    // Вода — глибокий темний відтінок.
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: { "fill-color": "#0C1614" },
    },

    // Ліс / зелень / парки — лаймовим (приглушена прозорість, щоб не різало око).
    {
      id: "landcover-green",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      filter: [
        "in",
        ["get", "class"],
        ["literal", ["wood", "forest", "grass", "scrub"]],
      ],
      paint: { "fill-color": colors.lime, "fill-opacity": 0.22 },
    },
    {
      id: "park",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "park",
      paint: { "fill-color": colors.lime, "fill-opacity": 0.16 },
    },

    // Будівлі — темно-сірі.
    {
      id: "building",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 13,
      paint: { "fill-color": "#2A2A2A", "fill-opacity": 0.9 },
    },

    // Дороги — сірі. Дрібні темніші, магістралі світліші.
    {
      id: "road-minor",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: [
        "in",
        ["get", "class"],
        ["literal", ["minor", "service", "track", "path"]],
      ],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#3A3A3A",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.5, 17, 3],
      },
    },
    {
      id: "road-major",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: [
        "in",
        ["get", "class"],
        ["literal", ["motorway", "trunk", "primary", "secondary", "tertiary"]],
      ],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#555555",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.8, 17, 5],
      },
    },

    // Підписи вулиць/місць — приглушені, з темним ореолом для читабельності.
    {
      id: "place-labels",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: [
        "in",
        ["get", "class"],
        ["literal", ["city", "town", "village", "suburb", "neighbourhood"]],
      ],
      layout: {
        "text-field": ["coalesce", ["get", "name:uk"], ["get", "name"]],
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 10, 11, 16, 14],
      },
      paint: {
        "text-color": "#9A9A9A",
        "text-halo-color": colors.bg,
        "text-halo-width": 1.2,
      },
    },
  ],
};

type LatLng = { lat: number; lng: number };

// Межі [west, south, east, north] навколо всіх точок — щоб вписати маршрут.
function routeBounds(
  points: LatLng[]
): [number, number, number, number] | null {
  if (points.length === 0) return null;
  let west = points[0].lng;
  let east = points[0].lng;
  let south = points[0].lat;
  let north = points[0].lat;
  for (const p of points) {
    if (p.lng < west) west = p.lng;
    if (p.lng > east) east = p.lng;
    if (p.lat < south) south = p.lat;
    if (p.lat > north) north = p.lat;
  }
  return [west, south, east, north];
}

/**
 * Карта пробіжки в темному стилі додатку + (опційно) лінія маршруту.
 *
 * - `live` (за замовч.): камера слідкує за позицією користувача й тримає
 *   рівень вулиці — для активної/очікувальної пробіжки.
 * - `fitRoute`: камера статично вписує весь маршрут у межі — для деталей
 *   збереженої пробіжки (без puck-а позиції).
 */
export function RunMap({
  points,
  center,
  withRoute = false,
  fitRoute = false,
}: {
  points: LatLng[];
  // Центр для режиму очікування, коли точок маршруту ще нема (позиція з
  // LocationBootstrap). Точки маршруту мають пріоритет над цим значенням.
  center?: LatLng | null;
  withRoute?: boolean;
  fitRoute?: boolean;
}) {
  const { colors } = useTheme();
  const focus = points[points.length - 1] ?? center ?? null;
  const bounds = fitRoute ? routeBounds(points) : null;

  // Точки початку/кінця маршруту. Старт показуємо завжди (коли є трек);
  // фініш — лише для збереженого маршруту (в живому режимі його роль грає
  // рухомий puck позиції, тож дубль не потрібен).
  const showEndpoints = (withRoute || fitRoute) && points.length >= 1;
  const start = points[0];
  const end = points[points.length - 1];
  const endpointFeatures = showEndpoints
    ? [
        { kind: "start", lat: start.lat, lng: start.lng },
        ...(fitRoute && points.length >= 2
          ? [{ kind: "end", lat: end.lat, lng: end.lng }]
          : []),
      ]
    : [];

  return (
    <MLMap mapStyle={MAP_STYLE} style={{ flex: 1 }}>
      {bounds ? (
        <Camera
          initialViewState={{
            bounds,
            padding: { top: 48, bottom: 48, left: 48, right: 48 },
          }}
        />
      ) : (
        <Camera
          trackUserLocation="default"
          initialViewState={{
            zoom: 16,
            ...(focus
              ? { center: [focus.lng, focus.lat] as [number, number] }
              : {}),
          }}
        />
      )}

      {/* Puck позиції — лише в живому режимі. */}
      {!fitRoute ? <UserLocation /> : null}

      {withRoute && points.length >= 2 ? (
        <GeoJSONSource
          id="route-src"
          data={{
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: points.map((p) => [p.lng, p.lat]),
            },
          }}
        >
          {/* Темна підкладка-обведення під лаймовою лінією — щоб маршрут
              читався поверх будь-якого тла мапи. */}
          <Layer
            id="route-casing"
            type="line"
            source="route-src"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{
              "line-color": colors.bg,
              "line-width": 9,
              "line-opacity": 0.9,
            }}
          />
          <Layer
            id="route-line"
            type="line"
            source="route-src"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{
              "line-color": colors.lime,
              "line-width": 5,
            }}
          />
        </GeoJSONSource>
      ) : null}

      {endpointFeatures.length > 0 ? (
        <GeoJSONSource
          id="endpoints-src"
          data={{
            type: "FeatureCollection",
            features: endpointFeatures.map((f) => ({
              type: "Feature",
              properties: { kind: f.kind },
              geometry: { type: "Point", coordinates: [f.lng, f.lat] },
            })),
          }}
        >
          {/* Кружок з темним обведенням: старт — лаймовий, фініш — помаранчевий. */}
          <Layer
            id="endpoints-dot"
            type="circle"
            source="endpoints-src"
            paint={{
              "circle-radius": 7,
              "circle-color": [
                "match",
                ["get", "kind"],
                "start",
                colors.lime,
                colors.orange,
              ],
              "circle-stroke-width": 3,
              "circle-stroke-color": colors.bg,
            }}
          />
        </GeoJSONSource>
      ) : null}
    </MLMap>
  );
}
