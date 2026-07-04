/**
 * Calapan City barangay centroids + map-framing constants.
 *
 * AUTO-GENERATED — do not hand-edit. Source: faeldon/philippines-json-maps
 * (2019 PSGC dataset, City of Calapan municity code ph175205000, medres 0.01).
 * Centroids are ring-area-weighted (signed-area formula) from each barangay polygon.
 * Keys are the canonical CALAPAN_BARANGAYS names (packages/shared).
 * Companion boundary polygons: ./calapan-barangays.geojson
 *
 * Note: source barangay "Wawa" is mapped to canonical "Sabang" (Calapan's port
 * barangay; "Wawa"/rivermouth is its dataset label). Verify before production.
 */

export const CALAPAN_BARANGAY_CENTROIDS: Record<string, { lat: number; lon: number }> = {
  "Balingayan": { lat: 13.32623, lon: 121.14198 },
  "Balite": { lat: 13.406082, lon: 121.158675 },
  "Baruyan": { lat: 13.386275, lon: 121.132033 },
  "Batino": { lat: 13.358027, lon: 121.219764 },
  "Bayanan I": { lat: 13.366921, lon: 121.169945 },
  "Bayanan II": { lat: 13.353771, lon: 121.170074 },
  "Biga": { lat: 13.32194, lon: 121.173081 },
  "Bondoc": { lat: 13.384935, lon: 121.196153 },
  "Bucayao": { lat: 13.307986, lon: 121.186931 },
  "Buhuan": { lat: 13.310275, lon: 121.218788 },
  "Bulusan": { lat: 13.401889, lon: 121.194383 },
  "Calero": { lat: 13.416112, lon: 121.182695 },
  "Camansihan": { lat: 13.334989, lon: 121.226825 },
  "Camilmil": { lat: 13.40543, lon: 121.174953 },
  "Canubing I": { lat: 13.359857, lon: 121.13479 },
  "Canubing II": { lat: 13.314248, lon: 121.118639 },
  "Comunal": { lat: 13.310108, lon: 121.159821 },
  "Guinobatan": { lat: 13.385284, lon: 121.181257 },
  "Gulod": { lat: 13.346518, lon: 121.208213 },
  "Gutad": { lat: 13.362202, lon: 121.239498 },
  "Ibaba East": { lat: 13.414758, lon: 121.178966 },
  "Ibaba West": { lat: 13.413934, lon: 121.175615 },
  "Ilaya": { lat: 13.412895, lon: 121.187493 },
  "Lalud": { lat: 13.399786, lon: 121.170692 },
  "Lazareto": { lat: 13.433342, lon: 121.2018 },
  "Libis": { lat: 13.414536, lon: 121.184 },
  "Lumang Bayan": { lat: 13.398942, lon: 121.180012 },
  "Mahal na Pangalan": { lat: 13.403938, lon: 121.150794 },
  "Maidlang": { lat: 13.386445, lon: 121.231566 },
  "Malad": { lat: 13.339413, lon: 121.158928 },
  "Malamig": { lat: 13.344462, lon: 121.145231 },
  "Managpi": { lat: 13.327035, lon: 121.200333 },
  "Masipit": { lat: 13.388089, lon: 121.157125 },
  "Nag-iba I": { lat: 13.34364, lon: 121.273405 },
  "Nag-iba II": { lat: 13.348335, lon: 121.259552 },
  "Navotas": { lat: 13.371202, lon: 121.250246 },
  "Pachoca": { lat: 13.409377, lon: 121.166387 },
  "Palhi": { lat: 13.378838, lon: 121.209361 },
  "Panggalaan": { lat: 13.307593, lon: 121.201652 },
  "Parang": { lat: 13.40184, lon: 121.215248 },
  "Patas": { lat: 13.341072, lon: 121.11983 },
  "Personas": { lat: 13.306516, lon: 121.141353 },
  "Putingtubig": { lat: 13.344912, lon: 121.186345 },
  "Sabang": { lat: 13.403268, lon: 121.145436 },
  "Salong": { lat: 13.418578, lon: 121.190582 },
  "San Antonio": { lat: 13.425947, lon: 121.195516 },
  "San Vicente Central": { lat: 13.412031, lon: 121.178456 },
  "San Vicente East": { lat: 13.409421, lon: 121.18019 },
  "San Vicente North": { lat: 13.413169, lon: 121.179146 },
  "San Vicente South": { lat: 13.410093, lon: 121.177762 },
  "San Vicente West": { lat: 13.412217, lon: 121.176625 },
  "Santa Cruz": { lat: 13.324509, lon: 121.241161 },
  "Santa Isabel": { lat: 13.36794, lon: 121.160238 },
  "Santa Maria Village": { lat: 13.408866, lon: 121.173381 },
  "Santa Rita": { lat: 13.345653, lon: 121.129339 },
  "Santo Niño": { lat: 13.406837, lon: 121.184971 },
  "Sapul": { lat: 13.365176, lon: 121.186917 },
  "Silonay": { lat: 13.399594, lon: 121.225245 },
  "Suqui": { lat: 13.417088, lon: 121.202312 },
  "Tawagan": { lat: 13.374416, lon: 121.147148 },
  "Tawiran": { lat: 13.392798, lon: 121.167669 },
  "Tibag": { lat: 13.412169, lon: 121.173408 },
};

/** City center — mean of all barangay centroids ({ lat, lon }). */
export const CALAPAN_CENTER: { lat: number; lon: number } = { lat: 13.375964, lon: 121.183063 };

/** Bounding box as [SW, NE], each point [lon, lat] (GeoJSON axis order). */
export const CALAPAN_BOUNDS: [[number, number], [number, number]] = [
  [121.10037, 13.29627],
  [121.28921, 13.46737],
];
