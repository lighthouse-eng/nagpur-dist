import { School } from '../types';
import { getDistanceFromRamtek, isWithinRamtek200Km, normalizeBlockName } from './geo';

/**
 * Parses raw CSV string into School objects with normalized fields
 */
export function parseSchoolCsv(csvText: string): { schools: School[]; errors: string[] } {
  const lines = csvText.split(/\r\n|\n/).map(l => l.trim()).filter(l => l.length > 0);
  const errors: string[] = [];
  const schools: School[] = [];

  if (lines.length < 2) {
    return { schools, errors: ['CSV file is empty or missing data rows.'] };
  }

  // Parse header line respecting quotes
  const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, ''));

  // Map header index to fields
  const colIndex = {
    name: findColIndex(headers, ['schoolname', 'school_name', 'name', 'school']),
    udise: findColIndex(headers, ['udisecode', 'udise', 'udiseno', 'dise_code']),
    district: findColIndex(headers, ['district', 'districtname']),
    block: findColIndex(headers, ['block', 'blockname', 'taluka', 'tehsil']),
    cluster: findColIndex(headers, ['cluster', 'clustername']),
    village: findColIndex(headers, ['village', 'villagename', 'location', 'city']),
    pin: findColIndex(headers, ['pin', 'pincode', 'postalcode', 'zip']),
    address: findColIndex(headers, ['address', 'schooladdress', 'fulladdress']),
    management: findColIndex(headers, ['management', 'schmgmt', 'mgmt', 'sch_mgmt']),
    category: findColIndex(headers, ['category', 'schcat', 'schoolcategory']),
    type: findColIndex(headers, ['type', 'schooltype', 'gender', 'schtype']),
    classFrom: findColIndex(headers, ['classfrom', 'fromclass', 'lowclass', 'class_from']),
    classTo: findColIndex(headers, ['classto', 'toclass', 'highclass', 'class_to']),
    ruralUrban: findColIndex(headers, ['ruralurban', 'rural_urban', 'locationtype', 'area']),
    status: findColIndex(headers, ['status', 'schoolstatus', 'operationalstatus']),
    latitude: findColIndex(headers, ['latitude', 'lat', 'y']),
    longitude: findColIndex(headers, ['longitude', 'long', 'lng', 'lon', 'x']),
  };

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;
    const values = parseCsvLine(rawLine);
    if (values.length < 2) continue;

    const getVal = (idx: number, fallback = '') => (idx >= 0 && idx < values.length ? values[idx].trim() : fallback);

    const name = getVal(colIndex.name, `School #${i}`);
    const rawUdise = getVal(colIndex.udise, `2709${String(i).padStart(7, '0')}`);
    const district = getVal(colIndex.district, 'NAGPUR');
    const rawBlock = getVal(colIndex.block, 'RAMTEK');
    const block = normalizeBlockName(rawBlock);
    const cluster = getVal(colIndex.cluster, 'Central');
    const village = getVal(colIndex.village, block);
    const pin = getVal(colIndex.pin, '441106');
    const address = getVal(colIndex.address, `${village}, ${block}, ${district}`);
    const management = getVal(colIndex.management, 'Department of Education');
    const category = getVal(colIndex.category, 'Primary with Upper Primary');
    const type = getVal(colIndex.type, 'Co-educational');
    const classFrom = parseInt(getVal(colIndex.classFrom, '1'), 10) || 1;
    const classTo = parseInt(getVal(colIndex.classTo, '8'), 10) || 8;
    const ruralUrban = getVal(colIndex.ruralUrban, 'Rural');
    const status = getVal(colIndex.status, 'Operational');

    // Parse coordinates with fallback logic
    const latStr = getVal(colIndex.latitude, '0');
    const lngStr = getVal(colIndex.longitude, '0');
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
      errors.push(`Row ${i}: Missing or invalid coordinates for "${name}".`);
      continue;
    }

    const distRamtek = getDistanceFromRamtek(lat, lng);
    const within200 = isWithinRamtek200Km(lat, lng);

    schools.push({
      id: `school-${i}-${rawUdise}`,
      name,
      udise: rawUdise,
      district,
      block,
      cluster,
      village,
      pin,
      address,
      management,
      category,
      type,
      classFrom,
      classTo,
      ruralUrban,
      status,
      latitude: lat,
      longitude: lng,
      distanceRamtekKm: distRamtek,
      isWithin200KmRamtek: within200,
    });
  }

  return { schools, errors };
}

function findColIndex(headers: string[], candidateMatches: string[]): number {
  for (const candidate of candidateMatches) {
    const cleanCand = candidate.toLowerCase().replace(/[\s_-]+/g, '');
    const idx = headers.findIndex(h => h.includes(cleanCand) || cleanCand.includes(h));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
