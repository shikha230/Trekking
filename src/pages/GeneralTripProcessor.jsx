import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, Play, Download, FileSpreadsheet,
  MapPin, CheckCircle2, AlertCircle, Navigation, RotateCcw, Loader2, Filter
} from 'lucide-react';

const EARTH_RADIUS_M = 6371000.0;

// Default calibration point on LOADING side (client provided)
const DEFAULT_LOADING_POINT = {
  latitude: 22.32115,
  longitude: 82.65352,
};

// Default boundary coordinates from Boundary line1.kml [lon, lat]
const DEFAULT_BOUNDARY_COORDS = [
  [82.64966264564997, 22.33467800191211],
  [82.65059824486633, 22.32890906338424],
  [82.65176767503674, 22.32642024405503],
  [82.65382148420177, 22.32506115602197],
  [82.65898019117137, 22.32320836577648],
  [82.6623309419314, 22.32302331537531],
  [82.66456515359265, 22.32296996816192],
  [82.66699843699921, 22.32312008478754],
  [82.66895500296896, 22.32278188479397],
  [82.6723354107381, 22.32273379500245],
  [82.67386992698972, 22.32265539251172],
];

const STORAGE_KEY = 'boundary_trip_processor_config_v1';

const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const p = Math.PI / 180.0;
  const a =
    Math.sin(((lat2 - lat1) * p) / 2.0) ** 2 +
    Math.cos(lat1 * p) * Math.cos(lat2 * p) * Math.sin(((lon2 - lon1) * p) / 2.0) ** 2;
  const clamped = Math.min(1.0, Math.max(0.0, a));
  const c = 2.0 * Math.atan2(Math.sqrt(clamped), Math.sqrt(1.0 - clamped));
  return EARTH_RADIUS_M * c;
};

// Matches VBA SignedDistance: locally projected point-to-segment distance with signed side
const signedDistanceMeters = (lat, lon, boundaryLonLat) => {
  const deg2rad = Math.PI / 180.0;
  const cosLat = Math.cos(lat * deg2rad);
  const px = lon * cosLat * deg2rad * EARTH_RADIUS_M;
  const py = lat * deg2rad * EARTH_RADIUS_M;

  let best = 1e30;
  let signedRes = 0.0;

  for (let i = 0; i < boundaryLonLat.length - 1; i++) {
    const lon1 = Number(boundaryLonLat[i][0]);
    const lat1 = Number(boundaryLonLat[i][1]);
    const lon2 = Number(boundaryLonLat[i + 1][0]);
    const lat2 = Number(boundaryLonLat[i + 1][1]);

    const ax = lon1 * cosLat * deg2rad * EARTH_RADIUS_M;
    const ay = lat1 * deg2rad * EARTH_RADIUS_M;
    const bx = lon2 * cosLat * deg2rad * EARTH_RADIUS_M;
    const by = lat2 * deg2rad * EARTH_RADIUS_M;

    const abx = bx - ax;
    const aby = by - ay;
    const denom = abx * abx + aby * aby + 0.0000001;
    let t = ((px - ax) * abx + (py - ay) * aby) / denom;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;

    const projX = ax + t * abx;
    const projY = ay + t * aby;
    const d = Math.hypot(px - projX, py - projY);
    const cross = abx * (py - ay) - aby * (px - ax);
    const sd = cross < 0 ? -d : d;

    if (d < best) {
      best = d;
      signedRes = sd;
    }
  }

  return signedRes;
};

// Parse all <coordinates> blocks inside uploaded KML
const parseKmlCoordinatesText = (xmlText) => {
  const matches = [...String(xmlText).matchAll(/<coordinates[^>]*>([\s\S]*?)<\/coordinates>/gi)];
  if (!matches.length) return [];

  const pts = [];
  for (const m of matches) {
    const tokens = (m[1] || '').trim().split(/\s+/);
    for (const tok of tokens) {
      if (!tok) continue;
      const parts = tok.split(',');
      if (parts.length >= 2) {
        const lon = Number(parts[0]);
        const lat = Number(parts[1]);
        if (!Number.isNaN(lon) && !Number.isNaN(lat)) {
          pts.push([lon, lat]);
        }
      }
    }
  }
  return pts;
};

// Robust timestamp parser (handles Excel serial numbers, ISO strings, and DD/MM/YYYY HH:mm:ss)
const parseTimestampMs = (val) => {
  if (val === null || val === undefined || val === '') return NaN;

  if (typeof val === 'number' && val > 20000 && val < 100000) {
    const utcDays = Math.floor(val - 25569);
    const utcValue = utcDays * 86400;
    const fractionalDay = val - Math.floor(val) + 0.0000001;
    let totalSeconds = Math.floor(86400 * fractionalDay);
    const seconds = totalSeconds % 60;
    totalSeconds -= seconds;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds / 60) % 60;
    return (utcValue + hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  const str = String(val).trim();
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]) - 1;
    const year = Number(dmyMatch[3]);
    const hour = Number(dmyMatch[4] || 0);
    const min = Number(dmyMatch[5] || 0);
    const sec = Number(dmyMatch[6] || 0);
    return new Date(year, month, day, hour, min, sec).getTime();
  }

  const d = new Date(str).getTime();
  return Number.isNaN(d) ? NaN : d;
};

const formatDateTime = (ms) => {
  if (Number.isNaN(ms)) return '';
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// Matches VBA IsExcludedVehicle: excludes names starting with E, H, or P, or containing "camp"
const isExcludedVehicle = (vehicleName) => {
  const s = String(vehicleName || '').trim().toLowerCase();
  if (!s) return true;
  return (
    s.startsWith('e') ||
    s.startsWith('h') ||
    s.startsWith('p') ||
    s.includes('camp')
  );
};

const safeFileName = (s) => String(s).replace(/[\\/:*?"<>|]/g, '_');

const xmlEscape = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildAutoFitSheet = (rows, minW = 12, maxW = 38) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  if (!rows || !rows.length) return ws;
  const headers = Object.keys(rows[0]);
  ws['!cols'] = headers.map((header) => {
    const maxLen = Math.max(
      header.length,
      ...rows.slice(0, 300).map((r) => String(r[header] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 4, minW), maxW) };
  });
  return ws;
};

const GeneralTripProcessor = () => {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          loadingLat: parsed.loadingLat ?? DEFAULT_LOADING_POINT.latitude,
          loadingLon: parsed.loadingLon ?? DEFAULT_LOADING_POINT.longitude,
          boundaryName: parsed.boundaryName || 'Boundary line1.kml',
          boundaryCoords:
            Array.isArray(parsed.boundaryCoords) && parsed.boundaryCoords.length >= 2
              ? parsed.boundaryCoords
              : DEFAULT_BOUNDARY_COORDS,
        };
      }
    } catch {
      // ignore storage errors
    }
    return {
      loadingLat: DEFAULT_LOADING_POINT.latitude,
      loadingLon: DEFAULT_LOADING_POINT.longitude,
      boundaryName: 'Boundary line1.kml',
      boundaryCoords: DEFAULT_BOUNDARY_COORDS,
    };
  });

  const [rawRows, setRawRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [trips, setTrips] = useState([]);
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [activeTab, setActiveTab] = useState('config');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error(e);
    }
  }, [config]);

  const handleKmlBoundaryUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      const pts = parseKmlCoordinatesText(evt.target.result);
      if (pts.length < 2) {
        setError('Could not read at least two boundary coordinates from KML.');
        return;
      }
      setConfig((prev) => ({
        ...prev,
        boundaryName: file.name,
        boundaryCoords: pts,
      }));
      setStatusMsg(`Loaded ${pts.length} boundary points from "${file.name}" and saved to Loading_config.`);
    };
    reader.readAsText(file);
  };

  const resetConfig = () => {
    setConfig({
      loadingLat: DEFAULT_LOADING_POINT.latitude,
      loadingLon: DEFAULT_LOADING_POINT.longitude,
      boundaryName: 'Boundary line1.kml',
      boundaryCoords: DEFAULT_BOUNDARY_COORDS,
    });
    setStatusMsg('Reset Loading_config to default client calibration point (22.32115, 82.65352) and Boundary line1.kml.');
  };

  const handleRawFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setStatusMsg('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const targetSheetName =
          workbook.SheetNames.find((n) => n.toLowerCase().replace(/\s+/g, '') === 'rawdata') ||
          workbook.SheetNames[0];

        const sheet = workbook.Sheets[targetSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!jsonRows.length) {
          setError('Uploaded file has no GPS records.');
          setRawRows([]);
          return;
        }

        const sampleKeys = Object.keys(jsonRows[0]).map((k) => k.trim().toLowerCase());
        const hasLat = sampleKeys.includes('latitude');
        const hasLon = sampleKeys.includes('longitude');
        const hasTime =
          sampleKeys.includes('fixtime') ||
          sampleKeys.includes('devicetime') ||
          sampleKeys.includes('servertime') ||
          sampleKeys.includes('timestamp');
        const hasVeh =
          sampleKeys.includes('device_name') ||
          sampleKeys.includes('vehicle') ||
          sampleKeys.includes('vehiclename') ||
          sampleKeys.includes('name') ||
          sampleKeys.includes('truck name');

        if (!hasLat || !hasLon || !hasTime || !hasVeh) {
          setError('Required headers: latitude, longitude, time (fixtime/devicetime), and vehicle/device_name.');
          setRawRows([]);
          return;
        }

        const normalized = jsonRows.map((row, idx) => {
          const lowerMap = {};
          Object.keys(row).forEach((k) => {
            lowerMap[k.trim().toLowerCase()] = row[k];
          });

          const rawTime =
            lowerMap.fixtime ??
            lowerMap.devicetime ??
            lowerMap.servertime ??
            lowerMap.timestamp;

          const vehName = String(
            lowerMap.device_name ||
            lowerMap.vehicle ||
            lowerMap.vehiclename ||
            lowerMap['truck name'] ||
            lowerMap.name ||
            ''
          ).trim();

          return {
            _excelRow: idx + 2,
            vehicle: vehName,
            timeRaw: rawTime,
            timeMs: parseTimestampMs(rawTime),
            latitude: Number(lowerMap.latitude),
            longitude: Number(lowerMap.longitude),
            io6: lowerMap.io6 !== undefined && lowerMap.io6 !== '' ? lowerMap.io6 : '',
            io9: lowerMap.io9 !== undefined && lowerMap.io9 !== '' ? lowerMap.io9 : '',
          };
        });

        setRawRows(normalized);
        setStatusMsg(`Loaded ${normalized.length} GPS records from "${targetSheetName}". Click "Run Boundary Trips" to process.`);
      } catch (err) {
        console.error(err);
        setError('Failed to parse file. Please upload a valid CSV, XLSX, or XLS file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const runBoundaryCrossingTrips = () => {
    setError('');
    setStatusMsg('');
    setProcessing(true);

    setTimeout(() => {
      try {
        const refLat = Number(config.loadingLat);
        const refLon = Number(config.loadingLon);

        if (Number.isNaN(refLat) || Number.isNaN(refLon) || refLat === 0 || refLon === 0) {
          setError('Please enter valid Latitude and Longitude for the LOADING-side calibration point.');
          return;
        }

        if (!Array.isArray(config.boundaryCoords) || config.boundaryCoords.length < 2) {
          setError('Boundary KML must contain at least two coordinates.');
          return;
        }

        if (!rawRows.length) {
          setError('Please upload an all-vehicles GPS Excel/CSV file first.');
          return;
        }

        const refSign = signedDistanceMeters(refLat, refLon, config.boundaryCoords);
        if (Math.abs(refSign) < 0.01) {
          setError('Calibration point appears to be on the boundary. Choose a point clearly on the loading side.');
          return;
        }

        const vehicleMap = new Map();
        for (const row of rawRows) {
          if (!row.vehicle || isExcludedVehicle(row.vehicle)) continue;
          if (Number.isNaN(row.latitude) || Number.isNaN(row.longitude) || Number.isNaN(row.timeMs)) continue;
          if (!vehicleMap.has(row.vehicle)) {
            vehicleMap.set(row.vehicle, []);
          }
          vehicleMap.get(row.vehicle).push(row);
        }

        if (vehicleMap.size === 0) {
          setError('No eligible vehicles found after filtering (E/H/P prefixes and Camp excluded).');
          return;
        }

        const generatedTrips = [];
        let tripNo = 0;

        for (const [veh, rawPts] of vehicleMap.entries()) {
          const pts = [...rawPts].sort((a, b) => a.timeMs - b.timeMs || a._excelRow - b._excelRow);
          const n = pts.length;
          if (n < 2) continue;

          const side = new Array(n);
          const dist = new Array(n);

          for (let i = 0; i < n; i++) {
            const sd = signedDistanceMeters(pts[i].latitude, pts[i].longitude, config.boundaryCoords);
            dist[i] = sd;
            side[i] = sd * refSign > 0 ? -1 : 1;
          }

          const runs = [];
          let runStart = 0;
          let curSide = side[0];
          for (let i = 1; i < n; i++) {
            if (side[i] !== curSide) {
              runs.push({ side: curSide, start: runStart, end: i - 1 });
              runStart = i;
              curSide = side[i];
            }
          }
          runs.push({ side: curSide, start: runStart, end: n - 1 });

          let j = 0;
          while (j < runs.length) {
            if (runs[j].side === -1) {
              let unloadingRunIdx = -1;
              for (let k = j + 1; k < runs.length; k++) {
                if (runs[k].side === 1) {
                  unloadingRunIdx = k;
                  break;
                }
              }

              if (unloadingRunIdx !== -1) {
                let startIdx = runs[j].start;
                let maxLoadDist = -1;
                for (let i = runs[j].start; i <= runs[j].end; i++) {
                  const ad = Math.abs(dist[i]);
                  if (ad > maxLoadDist) {
                    maxLoadDist = ad;
                    startIdx = i;
                  }
                }

                let endIdx = runs[unloadingRunIdx].start;
                let maxUnloadDist = -1;
                for (let i = runs[unloadingRunIdx].start; i <= runs[unloadingRunIdx].end; i++) {
                  const ad = Math.abs(dist[i]);
                  if (ad > maxUnloadDist) {
                    maxUnloadDist = ad;
                    endIdx = i;
                  }
                }

                if (endIdx > startIdx) {
                  let pathDist = 0;
                  for (let i = startIdx + 1; i <= endIdx; i++) {
                    pathDist += haversineMeters(
                      pts[i - 1].latitude,
                      pts[i - 1].longitude,
                      pts[i].latitude,
                      pts[i].longitude
                    );
                  }

                  let durationMin = (pts[endIdx].timeMs - pts[startIdx].timeMs) / 60000.0;
                  if (durationMin < 0) durationMin += 1440.0;

                  tripNo += 1;
                  const kmlFile = `${safeFileName(veh)}_BCTrip_${String(tripNo).padStart(3, '0')}.kml`;

                  const coordList = [];
                  for (let i = startIdx; i <= endIdx; i++) {
                    coordList.push(`${pts[i].longitude},${pts[i].latitude},0`);
                  }

                  const placemarkXml = [
                    `<Placemark><name>${xmlEscape(`${veh} Boundary Trip ${tripNo}`)}</name><styleUrl>#track</styleUrl><LineString><tessellate>1</tessellate><coordinates>${coordList.join(' ')}</coordinates></LineString></Placemark>`,
                    `<Placemark><name>${xmlEscape(`${veh} Start (Row ${pts[startIdx]._excelRow})`)}</name><Point><coordinates>${pts[startIdx].longitude},${pts[startIdx].latitude},0</coordinates></Point></Placemark>`,
                    `<Placemark><name>${xmlEscape(`${veh} End (Row ${pts[endIdx]._excelRow})`)}</name><Point><coordinates>${pts[endIdx].longitude},${pts[endIdx].latitude},0</coordinates></Point></Placemark>`,
                  ].join('\n');

                  generatedTrips.push({
                    tripNo,
                    vehicle: veh,
                    startRow: pts[startIdx]._excelRow,
                    startTime: formatDateTime(pts[startIdx].timeMs),
                    startLat: pts[startIdx].latitude,
                    startLon: pts[startIdx].longitude,
                    startBoundaryDistM: Number(Math.abs(dist[startIdx]).toFixed(1)),
                    startIo6: pts[startIdx].io6,
                    startIo9: pts[startIdx].io9,
                    endRow: pts[endIdx]._excelRow,
                    endTime: formatDateTime(pts[endIdx].timeMs),
                    endLat: pts[endIdx].latitude,
                    endLon: pts[endIdx].longitude,
                    endBoundaryDistM: Number(Math.abs(dist[endIdx]).toFixed(1)),
                    endIo6: pts[endIdx].io6,
                    endIo9: pts[endIdx].io9,
                    pathDistM: Number(pathDist.toFixed(1)),
                    leadKm: Number((pathDist / 1000.0).toFixed(2)),
                    durationMin: Number(durationMin.toFixed(1)),
                    kmlFile,
                    placemarkXml,
                  });
                }

                j = unloadingRunIdx + 1;
              } else {
                j += 1;
              }
            } else {
              j += 1;
            }
          }
        }

        setTrips(generatedTrips);
        setSelectedVehicleFilter('ALL');
        setActiveTab('summary');
        setStatusMsg(
          `Boundary crossing processing complete. ${generatedTrips.length} loaded trip(s) recorded across ${new Set(generatedTrips.map((t) => t.vehicle)).size} vehicle(s).`
        );
      } catch (err) {
        console.error(err);
        setError('Error while processing boundary trips.');
      } finally {
        setProcessing(false);
      }
    }, 30);
  };

  const vehicleSummary = useMemo(() => {
    const map = new Map();
    for (const t of trips) {
      if (!map.has(t.vehicle)) {
        map.set(t.vehicle, { vehicle: t.vehicle, totalTrips: 0, totalDistM: 0 });
      }
      const entry = map.get(t.vehicle);
      entry.totalTrips += 1;
      entry.totalDistM += Number(t.pathDistM) || 0;
    }
    return Array.from(map.values()).map((v) => ({
      vehicle: v.vehicle,
      totalTrips: v.totalTrips,
      avgLeadKm: v.totalTrips > 0 ? Number((v.totalDistM / v.totalTrips / 1000.0).toFixed(2)) : 0,
    }));
  }, [trips]);

  const filteredTrips = useMemo(() => {
    if (selectedVehicleFilter === 'ALL') return trips;
    return trips.filter((t) => t.vehicle === selectedVehicleFilter);
  }, [trips, selectedVehicleFilter]);

  const downloadCombinedKml = () => {
    if (!trips.length) return;
    const boundaryLineCoords = config.boundaryCoords
      .map(([lon, lat]) => `${lon},${lat},0`)
      .join(' ');

    const boundaryPlacemark = `<Placemark><name>${xmlEscape(config.boundaryName)}</name><styleUrl>#boundary</styleUrl><LineString><tessellate>1</tessellate><coordinates>${boundaryLineCoords}</coordinates></LineString></Placemark>`;
    const body = trips.map((t) => t.placemarkXml).join('\n');

    const kml = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<kml xmlns="http://www.opengis.net/kml/2.2"><Document>`,
      `<name>All_Boundary_Trips</name>`,
      `<Style id="track"><LineStyle><color>ff00ffff</color><width>4</width></LineStyle></Style>`,
      `<Style id="boundary"><LineStyle><color>ffff0000</color><width>4</width></LineStyle></Style>`,
      boundaryPlacemark,
      body,
      `</Document></kml>`,
    ].join('\n');

    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `All_Boundary_Trips_${new Date().toISOString().slice(0, 10)}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportCompiledExcel = () => {
    if (!trips.length) return;

    const detailRows = trips.map((t) => ({
      'Vehicle': t.vehicle,
      'Trip No.': t.tripNo,
      'Start Excel Row': t.startRow,
      'Start Time': t.startTime,
      'Start Latitude': t.startLat,
      'Start Longitude': t.startLon,
      'Start Boundary Distance (m)': t.startBoundaryDistM,
      'Start IO6': t.startIo6,
      'Start IO9': t.startIo9,
      'End Excel Row': t.endRow,
      'End Time': t.endTime,
      'End Latitude': t.endLat,
      'End Longitude': t.endLon,
      'End Boundary Distance (m)': t.endBoundaryDistM,
      'End IO6': t.endIo6,
      'End IO9': t.endIo9,
      'Path Distance (m)': t.pathDistM,
      'Duration (min)': t.durationMin,
      'KML File': t.kmlFile,
    }));

    const summaryRows = vehicleSummary.map((v) => ({
      'Vehicle': v.vehicle,
      'Total Trips': v.totalTrips,
      'Average Lead (km)': v.avgLeadKm,
    }));

    const configRows = [
      {
        Parameter: 'Loading Calibration Latitude',
        Value: Number(config.loadingLat),
      },
      {
        Parameter: 'Loading Calibration Longitude',
        Value: Number(config.loadingLon),
      },
      {
        Parameter: 'Boundary KML File',
        Value: config.boundaryName,
      },
      {
        Parameter: 'Boundary Coordinate Count',
        Value: config.boundaryCoords.length,
      },
    ];

    const wb = XLSX.utils.book_new();
    const wsTrips = buildAutoFitSheet(detailRows, 12, 34);
    const wsSummary = buildAutoFitSheet(summaryRows, 16, 30);
    const wsConfig = buildAutoFitSheet(configRows, 20, 42);

    XLSX.utils.book_append_sheet(wb, wsTrips, 'BoundaryTrips');
    XLSX.utils.book_append_sheet(wb, wsSummary, 'VehicleSummary');
    XLSX.utils.book_append_sheet(wb, wsConfig, 'Loading_config');
    XLSX.writeFile(wb, `All_Truck_Boundary_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const overallAvgLeadKm = useMemo(() => {
    if (!trips.length) return '0.00';
    const sum = trips.reduce((acc, t) => acc + t.pathDistM, 0);
    return (sum / trips.length / 1000.0).toFixed(2);
  }, [trips]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-100/80 min-h-screen text-slate-800 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold tracking-wider uppercase mb-1">
            <Navigation className="w-3.5 h-3.5" />
            <span>Boundary Crossing Trip Identification Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Trip Processor (All Truck Summary)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Loading side → Unloading side boundary crossing with saved Loading_config, combined KML & compiled Excel export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all">
            <Upload size={15} className="text-blue-600" />
            <span>{fileName ? `File: ${fileName}` : 'Upload All Vehicles Excel/CSV'}</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleRawFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            disabled={processing}
            onClick={runBoundaryCrossingTrips}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            {processing ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            <span>{processing ? 'Processing...' : 'Run Boundary Trips'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {statusMsg && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">GPS Records</p>
          <p className="text-xl font-black text-slate-900 mt-1">{rawRows.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Loaded Trips</p>
          <p className="text-xl font-black text-blue-600 mt-1">{trips.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Active Vehicles</p>
          <p className="text-xl font-black text-emerald-600 mt-1">{vehicleSummary.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Lead (km)</p>
          <p className="text-xl font-black text-slate-900 mt-1">{overallAvgLeadKm} km</p>
        </div>
      </div>

      {/* Tabs & Combined Downloads */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            1. Loading_config ({config.boundaryCoords.length} pts)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            2. Vehicle & Trip Summary ({trips.length})
          </button>
        </div>

        {trips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadCombinedKml}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download size={14} />
              <span>Download Combined KML ({trips.length})</span>
            </button>
            <button
              type="button"
              onClick={exportCompiledExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              <span>Download Compiled Excel (.xlsx)</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: Saved Loading_config */}
      {activeTab === 'config' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" /> Saved Loading_config
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Stored automatically; edit Loading Point coordinates or upload a new Boundary KML anytime.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5">
                <Upload size={13} /> Change Boundary KML
                <input type="file" accept=".kml" onChange={handleKmlBoundaryUpload} className="hidden" />
              </label>
              <button
                type="button"
                onClick={resetConfig}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} /> Reset to Client Default
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Loading Point Latitude
              </label>
              <input
                type="number"
                step="any"
                value={config.loadingLat}
                onChange={(e) => setConfig((prev) => ({ ...prev, loadingLat: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Loading Point Longitude
              </label>
              <input
                type="number"
                step="any"
                value={config.loadingLon}
                onChange={(e) => setConfig((prev) => ({ ...prev, loadingLon: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Active Boundary KML
              </label>
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 truncate">
                {config.boundaryName} ({config.boundaryCoords.length} coords)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VehicleSummary + BoundaryTrips */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Vehicle Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              VehicleSummary
            </h3>
            {vehicleSummary.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No trips generated yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Vehicle</th>
                      <th className="p-2.5">Total Trips</th>
                      <th className="p-2.5">Average Lead (km)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {vehicleSummary.map((v) => (
                      <tr
                        key={v.vehicle}
                        onClick={() =>
                          setSelectedVehicleFilter((prev) => (prev === v.vehicle ? 'ALL' : v.vehicle))
                        }
                        className={`cursor-pointer transition-colors ${
                          selectedVehicleFilter === v.vehicle ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-2.5 font-sans font-bold text-slate-900">{v.vehicle}</td>
                        <td className="p-2.5 font-bold text-blue-600">{v.totalTrips}</td>
                        <td className="p-2.5">{v.avgLeadKm.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* BoundaryTrips Detail Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                BoundaryTrips ({filteredTrips.length})
              </h3>
              {vehicleSummary.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter size={13} className="text-slate-400" />
                  <select
                    value={selectedVehicleFilter}
                    onChange={(e) => setSelectedVehicleFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="ALL">All Vehicles ({trips.length} trips)</option>
                    {vehicleSummary.map((v) => (
                      <option key={v.vehicle} value={v.vehicle}>
                        {v.vehicle} ({v.totalTrips} trips)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {filteredTrips.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">Upload RawData and click "Run Boundary Trips".</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Vehicle</th>
                      <th className="p-2.5">Trip No.</th>
                      <th className="p-2.5">Start Time</th>
                      <th className="p-2.5">Start Dist (m)</th>
                      <th className="p-2.5">End Time</th>
                      <th className="p-2.5">End Dist (m)</th>
                      <th className="p-2.5">Path Dist (m)</th>
                      <th className="p-2.5">Duration (min)</th>
                      <th className="p-2.5">KML File</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredTrips.map((t) => (
                      <tr key={t.tripNo} className="hover:bg-slate-50">
                        <td className="p-2.5 font-sans font-bold text-slate-900">{t.vehicle}</td>
                        <td className="p-2.5">{t.tripNo}</td>
                        <td className="p-2.5 text-[11px]">{t.startTime}</td>
                        <td className="p-2.5">{t.startBoundaryDistM}</td>
                        <td className="p-2.5 text-[11px]">{t.endTime}</td>
                        <td className="p-2.5">{t.endBoundaryDistM}</td>
                        <td className="p-2.5 font-bold text-blue-700">{t.pathDistM}</td>
                        <td className="p-2.5">{t.durationMin}</td>
                        <td className="p-2.5 font-sans text-[11px] text-slate-600">{t.kmlFile}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralTripProcessor;