import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, Play, Plus, Trash2, Download, FileSpreadsheet,
  MapPin, CheckCircle2, AlertCircle, Navigation, RotateCcw
} from 'lucide-react';

// Exact constants from General_GPS_Trip_Macro.bas
const EARTH_R = 6371000.0;
const MAX_GAP_MIN = 5.0;
const C_MINUTES = 20.0;
const C_MAX_SPREAD_M = 35.0;
const C_MAX_MEDIAN_SPEED = 1.5;

// Client's exact locations from Location data (1).csv
const DEFAULT_LOCATIONS = [
  { id: 1, locationName: 'Loading', type: 'A', latitude: 22.319180, longitude: 82.654530, radius_m: 200, minVisitMinutes: 2, minPoints: 10 },
  { id: 2, locationName: 'Parking', type: 'C', latitude: 22.326510, longitude: 82.653820, radius_m: 150, minVisitMinutes: 20, minPoints: 10 },
  { id: 3, locationName: 'Destination_1', type: 'DEST', latitude: 22.324770, longitude: 82.667730, radius_m: 200, minVisitMinutes: 2, minPoints: 10 },
  { id: 4, locationName: 'Destination_2', type: 'DEST', latitude: 22.333770, longitude: 82.655110, radius_m: 500, minVisitMinutes: 2, minPoints: 10 },
  { id: 5, locationName: 'Destination_3', type: 'DEST', latitude: 22.347350, longitude: 82.647828, radius_m: 500, minVisitMinutes: 2, minPoints: 10 },
  { id: 6, locationName: 'Destination_4', type: 'DEST', latitude: 22.341078, longitude: 82.664978, radius_m: 200, minVisitMinutes: 2, minPoints: 10 },
  { id: 7, locationName: 'Destination_5', type: 'DEST', latitude: 22.340861, longitude: 82.672622, radius_m: 150, minVisitMinutes: 2, minPoints: 10 },
];

const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(a)));
};

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
  const d = new Date(val).getTime();
  return Number.isNaN(d) ? NaN : d;
};

const formatDateTime = (ms) => {
  if (Number.isNaN(ms)) return '';
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const formatKmlDateStamp = (ms) => {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

const minutesBetween = (msA, msB) => {
  if (Number.isNaN(msA) || Number.isNaN(msB)) return 999999;
  return Math.abs(msB - msA) / 60000.0;
};

const medianSpeed = (arr) => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const safeFileName = (s) => String(s).replace(/[\\/:*?"<>|]/g, '_');

const xmlEsc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const GeneralTripProcessor = () => {
  const [locations, setLocations] = useState(() => {
    try {
      const saved = localStorage.getItem('general_trip_location_config_v2');
      return saved ? JSON.parse(saved) : DEFAULT_LOCATIONS;
    } catch {
      return DEFAULT_LOCATIONS;
    }
  });

  const [rawRows, setRawRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [activeTab, setActiveTab] = useState('config');

  useEffect(() => {
    try {
      localStorage.setItem('general_trip_location_config_v2', JSON.stringify(locations));
    } catch (e) {
      console.error(e);
    }
  }, [locations]);

  // Upload Location_Config CSV/Excel
  const handleConfigUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const parsed = rows
          .map((r, idx) => ({
            id: Date.now() + idx,
            locationName: String(r.LocationName || r.locationName || '').trim(),
            type: String(r.Type || r.type || '').trim().toUpperCase(),
            latitude: Number(r.Latitude ?? r.latitude),
            longitude: Number(r.Longitude ?? r.longitude),
            radius_m: Number(r.Radius_m ?? r.radius_m ?? 100),
            minVisitMinutes: Number(r.MinVisitMinutes ?? r.minVisitMinutes ?? 2),
            minPoints: Number(r.MinPoints ?? r.minPoints ?? 10),
          }))
          .filter((r) => r.locationName && (r.type === 'A' || r.type === 'C' || r.type === 'DEST'));

        if (!parsed.length) {
          setError('Invalid Location Config file. Required columns: LocationName, Type, Latitude, Longitude, Radius_m, MinVisitMinutes, MinPoints');
          return;
        }

        setLocations(parsed);
        setStatusMsg(`Loaded ${parsed.length} locations into Location_Config.`);
      } catch (err) {
        setError('Failed to read Location Config file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle RawData CSV / Excel file upload
  const handleFileUpload = (e) => {
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

        const normalized = jsonRows.map((row, idx) => {
          const lowerMap = {};
          Object.keys(row).forEach((k) => {
            lowerMap[k.trim().toLowerCase()] = row[k];
          });

          const rawTime =
            lowerMap.fixtime !== undefined && lowerMap.fixtime !== ''
              ? lowerMap.fixtime
              : lowerMap.devicetime;

          return {
            _origRow: idx + 2,
            timeRaw: rawTime,
            timeMs: parseTimestampMs(rawTime),
            latitude: Number(lowerMap.latitude),
            longitude: Number(lowerMap.longitude),
            speed: Number(lowerMap.speed || 0),
            device_name: String(lowerMap.device_name || lowerMap.name || '').trim(),
            device_imei: String(lowerMap.device_imei || lowerMap.imei || '').trim(),
          };
        });

        const sampleKeys = Object.keys(jsonRows[0]).map((k) => k.trim().toLowerCase());
        const hasTime = sampleKeys.includes('fixtime') || sampleKeys.includes('devicetime');
        const hasLat = sampleKeys.includes('latitude');
        const hasLon = sampleKeys.includes('longitude');
        const hasSpeed = sampleKeys.includes('speed');

        if (!hasTime || !hasLat || !hasLon || !hasSpeed) {
          setError('Required headers not found. Required: fixtime (or devicetime), latitude, longitude, speed.');
          setRawRows([]);
          return;
        }

        setRawRows(normalized);
        setStatusMsg(`Loaded ${normalized.length} GPS records from "${targetSheetName}".`);
      } catch (err) {
        console.error(err);
        setError('Failed to parse file. Please upload a valid CSV, XLSX, or XLS file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const addLocationRow = () => {
    setLocations((prev) => [
      ...prev,
      {
        id: Date.now(),
        locationName: `Destination_${prev.length + 1}`,
        type: 'DEST',
        latitude: '',
        longitude: '',
        radius_m: 150,
        minVisitMinutes: 2,
        minPoints: 10,
      },
    ]);
  };

  const updateLocation = (id, field, value) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, [field]: value } : loc))
    );
  };

  const removeLocation = (id) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
  };

  const resetLocations = () => {
    setLocations(DEFAULT_LOCATIONS);
    setStatusMsg('Location_Config reset to client default locations (Loading, Parking, Destination_1 to Destination_5).');
  };

  // Exact port of ProcessGeneralGPSTrips
  const runProcessGeneralGPSTrips = () => {
    setError('');
    setStatusMsg('');

    if (rawRows.length < 2) {
      setError('Please upload a RawData GPS file first (minimum 2 records required).');
      return;
    }

    const validLocs = locations
      .filter((l) => l.latitude !== '' && l.longitude !== '' && !Number.isNaN(Number(l.latitude)) && !Number.isNaN(Number(l.longitude)))
      .map((l) => {
        const t = String(l.type || '').trim().toUpperCase();
        return {
          name: String(l.locationName || '').trim() || t,
          type: t,
          lat: Number(l.latitude),
          lon: Number(l.longitude),
          radius: Number(l.radius_m) > 0 ? Number(l.radius_m) : 100,
          minMin: Number(l.minVisitMinutes) > 0 ? Number(l.minVisitMinutes) : (t === 'C' ? C_MINUTES : 2),
          minPts: Number(l.minPoints) > 0 ? Number(l.minPoints) : 10,
        };
      })
      .filter((l) => l.type === 'A' || l.type === 'C' || l.type === 'DEST');

    const hasA = validLocs.some((l) => l.type === 'A');
    const hasC = validLocs.some((l) => l.type === 'C');
    const hasDest = validLocs.some((l) => l.type === 'DEST');

    if (validLocs.length < 3 || !hasA || !hasC || !hasDest) {
      setError('Location_Config must contain at least one A, one C and one DEST location.');
      return;
    }

    const sortedData = [...rawRows]
      .filter((r) => !Number.isNaN(r.timeMs))
      .sort((a, b) => a.timeMs - b.timeMs);

    if (sortedData.length < 2) {
      setError('No valid timestamps found in fixtime / devicetime column.');
      return;
    }

    let device = 'Vehicle';
    if (sortedData[0].device_name) device = sortedData[0].device_name;
    else if (sortedData[0].device_imei) device = sortedData[0].device_imei;
    else if (fileName) device = fileName.replace(/\.[^/.]+$/, '');

    const findZone = (lat, lon) => {
      if (lat === 0 || lon === 0 || Number.isNaN(lat) || Number.isNaN(lon)) return '';
      let best = 1e30;
      let bestType = '';
      for (const d of validLocs) {
        const x = haversineMeters(lat, lon, d.lat, d.lon);
        if (x <= d.radius && x < best) {
          best = x;
          bestType = `${d.type}|${d.name}`;
        }
      }
      return bestType;
    };

    const episodes = [];
    const addEpisode = (zoneKey, s, e) => {
      const parts = zoneKey.split('|');
      if (parts.length < 2) return;
      const loc = validLocs.find((d) => d.name === parts[1]);
      if (!loc) return;

      const pts = e - s + 1;
      const mins = minutesBetween(sortedData[s].timeMs, sortedData[e].timeMs);
      if (pts < loc.minPts || mins < loc.minMin) return;

      if (parts[0] === 'C') {
        let sx = 0;
        let sy = 0;
        const speeds = [];
        for (let r = s; r <= e; r++) {
          sx += sortedData[r].latitude;
          sy += sortedData[r].longitude;
          speeds.push(sortedData[r].speed);
        }
        const cx = sx / pts;
        const cy = sy / pts;
        let spread = 0;
        for (let r = s; r <= e; r++) {
          spread = Math.max(spread, haversineMeters(cx, cy, sortedData[r].latitude, sortedData[r].longitude));
        }
        if (spread > C_MAX_SPREAD_M) return;
        if (medianSpeed(speeds) > C_MAX_MEDIAN_SPEED) return;
        if (mins < C_MINUTES) return;
      }

      episodes.push({
        type: parts[0],
        name: parts[1],
        start: s,
        end: e,
      });
    };

    let prevZone = '';
    let epStart = -1;
    for (let r = 0; r < sortedData.length; r++) {
      const zone = findZone(sortedData[r].latitude, sortedData[r].longitude);
      if (r > 0) {
        if (minutesBetween(sortedData[r - 1].timeMs, sortedData[r].timeMs) > MAX_GAP_MIN) {
          if (epStart >= 0) addEpisode(prevZone, epStart, r - 1);
          epStart = -1;
          prevZone = '';
        }
      }
      if (zone !== prevZone) {
        if (epStart >= 0) addEpisode(prevZone, epStart, r - 1);
        epStart = zone !== '' ? r : -1;
        prevZone = zone;
      }
    }
    if (epStart >= 0) addEpisode(prevZone, epStart, sortedData.length - 1);

    const pathDistance = (s, e) => {
      let total = 0;
      for (let r = s + 1; r <= e; r++) {
        if (minutesBetween(sortedData[r - 1].timeMs, sortedData[r].timeMs) <= MAX_GAP_MIN) {
          const a = sortedData[r - 1].latitude;
          const b = sortedData[r - 1].longitude;
          const c = sortedData[r].latitude;
          const d = sortedData[r].longitude;
          if (a !== 0 && b !== 0 && c !== 0 && d !== 0) {
            total += haversineMeters(a, b, c, d);
          }
        }
      }
      return total;
    };

    const buildKmlContent = (veh, tType, si, ei) => {
      const coords = [];
      for (let r = si; r <= ei; r++) {
        const lat = sortedData[r].latitude;
        const lon = sortedData[r].longitude;
        if (lat !== 0 && lon !== 0 && !Number.isNaN(lat) && !Number.isNaN(lon)) {
          coords.push(`${lon.toFixed(7)},${lat.toFixed(7)},0`);
        }
      }
      return [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xmlEsc(`${veh} ${tType}`)}</name><Placemark><name>${xmlEsc(tType)}</name><LineString><tessellate>1</tessellate><coordinates>`,
        coords.join(' '),
        `</coordinates></LineString></Placemark></Document></kml>`,
      ].join('\n');
    };

    const generatedTrips = [];
    let tripNo = 0;
    let i = 0;

    while (i < episodes.length) {
      const org = episodes[i];
      const typ = org.type;
      let startIdx = -1;
      let endIdx = -1;
      let tripType = '';
      let reason = '';
      let dst = null;

      if (typ === 'A') {
        if (i + 2 < episodes.length && episodes[i + 1].type === 'C' && episodes[i + 2].type === 'DEST') {
          dst = episodes[i + 2];
          tripType = 'LTrip';
          startIdx = org.start;
          endIdx = dst.end;
          reason = 'A-C-DEST merged';
          i += 3;
        } else if (i + 1 < episodes.length && episodes[i + 1].type === 'DEST') {
          dst = episodes[i + 1];
          tripType = 'LTrip';
          startIdx = org.start;
          endIdx = dst.end;
          reason = 'A-DEST';
          i += 2;
        }
      } else if (typ === 'DEST') {
        if (i + 2 < episodes.length && episodes[i + 1].type === 'C' && episodes[i + 2].type === 'A') {
          dst = episodes[i + 2];
          tripType = 'ETrip';
          startIdx = org.start;
          endIdx = dst.end;
          reason = 'DEST-C-A merged';
          i += 3;
        } else if (i + 1 < episodes.length && episodes[i + 1].type === 'A') {
          dst = episodes[i + 1];
          tripType = 'ETrip';
          startIdx = org.start;
          endIdx = dst.end;
          reason = 'DEST-A';
          i += 2;
        }
      } else if (typ === 'C') {
        if (i + 1 < episodes.length && episodes[i + 1].type === 'DEST') {
          dst = episodes[i + 1];
          tripType = 'PTrip';
          startIdx = org.start;
          endIdx = dst.end;
          reason = 'Independent C-DEST';
          i += 2;
        } else if (i + 1 < episodes.length && episodes[i + 1].type === 'A') {
          dst = episodes[i + 1];
          tripType = 'JTrip';
          startIdx = org.start;
          endIdx = dst.end;
          reason = 'Independent C-A';
          i += 2;
        }
      }

      if (tripType !== '' && dst) {
        tripNo += 1;
        const startMs = sortedData[startIdx].timeMs;
        const endMs = sortedData[endIdx].timeMs;
        const elapsedMin = (endMs - startMs) / 60000.0;
        const distM = pathDistance(startIdx, endIdx);
        const leadKm = distM / 1000.0;
        const kmlName = safeFileName(`${device}_${tripType}_${formatKmlDateStamp(startMs)}.kml`);
        const kmlContent = buildKmlContent(device, tripType, startIdx, endIdx);

        generatedTrips.push({
          tripNo,
          vehicle: device,
          tripType,
          origin: org.name,
          destination: dst.name,
          startTime: formatDateTime(startMs),
          endTime: formatDateTime(endMs),
          durationMin: Number(elapsedMin.toFixed(1)),
          distanceM: Number(distM.toFixed(1)),
          leadKm: Number(leadKm.toFixed(2)),
          startRow: startIdx + 2,
          endRow: endIdx + 2,
          kmlFile: kmlName,
          kmlContent,
          review: reason,
        });
      } else {
        i += 1;
      }
    }

    setTrips(generatedTrips);
    setActiveTab('summary');
    setStatusMsg(
      `Completed. ${generatedTrips.length} trip(s) identified (${generatedTrips.filter((t) => t.tripType === 'LTrip').length} LTrip, ${generatedTrips.filter((t) => t.tripType === 'ETrip').length} ETrip).`
    );
  };

  const downloadKml = (trip) => {
    const blob = new Blob([trip.kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = trip.kmlFile;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download merged KML of all LTrip or all trips to open in Google Earth at once
  const downloadCombinedKml = (filterType = 'LTrip') => {
    const filtered = filterType === 'ALL' ? trips : trips.filter((t) => t.tripType === filterType);
    if (!filtered.length) return;

    const placemarks = filtered
      .map((t) => {
        const match = t.kmlContent.match(/<Placemark>[\s\S]*?<\/Placemark>/);
        return match
          ? match[0].replace(`<name>${xmlEsc(t.tripType)}</name>`, `<name>${xmlEsc(`${t.vehicle} ${t.tripType} #${t.tripNo}`)}</name>`)
          : '';
      })
      .join('\n');

    const combined = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xmlEsc(filterType)}_Routes</name>\n${placemarks}\n</Document></kml>`;
    const blob = new Blob([combined], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filterType}_Combined_GoogleEarth.kml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTripSummaryExcel = () => {
    if (!trips.length) return;
    const rows = trips.map((t) => ({
      'Trip No': t.tripNo,
      'Vehicle': t.vehicle,
      'Trip Type': t.tripType,
      'Origin': t.origin,
      'Destination': t.destination,
      'Start Time': t.startTime,
      'End Time': t.endTime,
      'Duration_min': t.durationMin,
      'Distance_m': t.distanceM,
      'Lead_km': t.leadKm,
      'Start Row': t.startRow,
      'End Row': t.endRow,
      'KML File': t.kmlFile,
      'Review': t.review,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trip_Summary');
    XLSX.writeFile(wb, `Trip_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const tripStats = useMemo(() => {
    return {
      total: trips.length,
      lTrips: trips.filter((t) => t.tripType === 'LTrip').length,
      eTrips: trips.filter((t) => t.tripType === 'ETrip').length,
      otherTrips: trips.filter((t) => t.tripType === 'PTrip' || t.tripType === 'JTrip').length,
      totalKm: trips.reduce((acc, t) => acc + t.leadKm, 0).toFixed(2),
    };
  }, [trips]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-100/80 min-h-screen text-slate-800 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold tracking-wider uppercase mb-1">
            <Navigation className="w-3.5 h-3.5" />
            <span>General GPS Trip Identification Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            RawData Trip Processor
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-loaded with client Location_Config (Loading, Parking, Destination_1–5). Upload V6 RawData CSV/Excel & run.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all">
            <Upload size={15} className="text-blue-600" />
            <span>{fileName ? `File: ${fileName}` : 'Upload RawData (CSV / Excel)'}</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={runProcessGeneralGPSTrips}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Play size={15} />
            <span>Run ProcessGeneralGPSTrips</span>
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Raw GPS Points</p>
          <p className="text-xl font-black text-slate-900 mt-1">{rawRows.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Trips</p>
          <p className="text-xl font-black text-blue-600 mt-1">{tripStats.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Loaded (LTrip)</p>
          <p className="text-xl font-black text-emerald-600 mt-1">{tripStats.lTrips}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Empty (ETrip)</p>
          <p className="text-xl font-black text-amber-600 mt-1">{tripStats.eTrips}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Lead (km)</p>
          <p className="text-xl font-black text-slate-900 mt-1">{tripStats.totalKm} km</p>
        </div>
      </div>

      {/* Tabs & Export Controls */}
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
            1. Location_Config ({locations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'raw'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            2. RawData ({rawRows.length})
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
            3. Trip_Summary ({trips.length})
          </button>
        </div>

        {trips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {tripStats.lTrips > 0 && (
              <button
                type="button"
                onClick={() => downloadCombinedKml('LTrip')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download size={14} />
                <span>Download All LTrip KML ({tripStats.lTrips})</span>
              </button>
            )}
            <button
              type="button"
              onClick={exportTripSummaryExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              <span>Export Trip_Summary (.xlsx)</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: Location_Config */}
      {activeTab === 'config' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" /> Location_Config Sheet
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                <b>A</b> = Loading/Origin | <b>C</b> = Sustained Parking (min 20m) | <b>DEST</b> = Destination_1 to Destination_5
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5">
                <Upload size={13} /> Import Location CSV
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleConfigUpload} className="hidden" />
              </label>
              <button
                type="button"
                onClick={resetLocations}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} /> Default Client Config
              </button>
              <button
                type="button"
                onClick={addLocationRow}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus size={14} /> Add Location
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-2.5">LocationName</th>
                  <th className="p-2.5">Type (A / C / DEST)</th>
                  <th className="p-2.5">Latitude</th>
                  <th className="p-2.5">Longitude</th>
                  <th className="p-2.5">Radius_m</th>
                  <th className="p-2.5">MinVisitMinutes</th>
                  <th className="p-2.5">MinPoints</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations.map((loc) => (
                  <tr key={loc.id}>
                    <td className="p-2">
                      <input
                        type="text"
                        value={loc.locationName}
                        onChange={(e) => updateLocation(loc.id, 'locationName', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={loc.type}
                        onChange={(e) => updateLocation(loc.id, 'type', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-900"
                      >
                        <option value="A">A (Loading)</option>
                        <option value="C">C (Parking)</option>
                        <option value="DEST">DEST (Destination)</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        value={loc.latitude}
                        onChange={(e) => updateLocation(loc.id, 'latitude', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        value={loc.longitude}
                        onChange={(e) => updateLocation(loc.id, 'longitude', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={loc.radius_m}
                        onChange={(e) => updateLocation(loc.id, 'radius_m', e.target.value)}
                        className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={loc.minVisitMinutes}
                        onChange={(e) => updateLocation(loc.id, 'minVisitMinutes', e.target.value)}
                        className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={loc.minPoints}
                        onChange={(e) => updateLocation(loc.id, 'minPoints', e.target.value)}
                        className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeLocation(loc.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RawData Preview */}
      {activeTab === 'raw' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              RawData Preview (Showing first 100 of {rawRows.length} rows)
            </h3>
          </div>

          {rawRows.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No RawData uploaded yet. Click "Upload RawData (CSV / Excel)" above.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[450px]">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-2.5">Row</th>
                    <th className="p-2.5">fixtime / devicetime</th>
                    <th className="p-2.5">latitude</th>
                    <th className="p-2.5">longitude</th>
                    <th className="p-2.5">speed</th>
                    <th className="p-2.5">device_name</th>
                    <th className="p-2.5">device_imei</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {rawRows.slice(0, 100).map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-400">{r._origRow}</td>
                      <td className="p-2.5">{formatDateTime(r.timeMs) || String(r.timeRaw)}</td>
                      <td className="p-2.5">{r.latitude}</td>
                      <td className="p-2.5">{r.longitude}</td>
                      <td className="p-2.5">{r.speed}</td>
                      <td className="p-2.5">{r.device_name || '-'}</td>
                      <td className="p-2.5">{r.device_imei || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Trip_Summary Output */}
      {activeTab === 'summary' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Trip_Summary ({trips.length} Trips)
            </h3>
          </div>

          {trips.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No trips identified yet. Upload RawData and click "Run ProcessGeneralGPSTrips".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Trip No</th>
                    <th className="p-2.5">Vehicle</th>
                    <th className="p-2.5">Trip Type</th>
                    <th className="p-2.5">Origin</th>
                    <th className="p-2.5">Destination</th>
                    <th className="p-2.5">Start Time</th>
                    <th className="p-2.5">End Time</th>
                    <th className="p-2.5">Duration_min</th>
                    <th className="p-2.5">Distance_m</th>
                    <th className="p-2.5">Lead_km</th>
                    <th className="p-2.5">Rows</th>
                    <th className="p-2.5">Review</th>
                    <th className="p-2.5 text-right">KML File</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trips.map((t) => (
                    <tr key={t.tripNo} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold">{t.tripNo}</td>
                      <td className="p-2.5 font-semibold">{t.vehicle}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            t.tripType === 'LTrip'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : t.tripType === 'ETrip'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {t.tripType}
                        </span>
                      </td>
                      <td className="p-2.5 font-medium">{t.origin}</td>
                      <td className="p-2.5 font-medium">{t.destination}</td>
                      <td className="p-2.5 font-mono text-[11px]">{t.startTime}</td>
                      <td className="p-2.5 font-mono text-[11px]">{t.endTime}</td>
                      <td className="p-2.5 font-mono">{t.durationMin}</td>
                      <td className="p-2.5 font-mono">{t.distanceM}</td>
                      <td className="p-2.5 font-mono font-bold text-blue-700">{t.leadKm}</td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-500">
                        {t.startRow}–{t.endRow}
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-600">{t.review}</td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => downloadKml(t)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Download size={12} /> Open KML
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GeneralTripProcessor;