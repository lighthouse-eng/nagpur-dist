import csv
import json
import math
import hashlib
import os

RAMTEK_LAT = 21.3970
RAMTEK_LNG = 79.3292

def calc_dist(lat1, lon1, lat2, lon2):
    R = 6371.0
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return round(R * c, 1)

BLOCK_CENTERS = {
    "RAMTEK": (21.3970, 79.3292),
    "SAONER": (21.3857, 78.9189),
    "MOUDA": (21.1687, 79.3951),
    "PARSEONI": (21.3789, 79.2084),
}

# Known coordinates for prominent villages/towns in the 4 blocks
KNOWN_VILLAGES = {
    # RAMTEK
    ("RAMTEK", "RAMTEK"): (21.3970, 79.3292),
    ("RAMTEK", "MANSAR"): (21.3889, 79.2825),
    ("RAMTEK", "NAGARDHAN"): (21.3444, 79.3175),
    ("RAMTEK", "KACHURWAHI"): (21.4310, 79.3820),
    ("RAMTEK", "MUSEWADI"): (21.4120, 79.3620),
    ("RAMTEK", "BHANDARBODI"): (21.4420, 79.3150),
    ("RAMTEK", "CHORBAHULI"): (21.4920, 79.2850),
    ("RAMTEK", "DEOLAPAR"): (21.5580, 79.3450),
    ("RAMTEK", "SHITALWADI"): (21.3650, 79.3210),
    ("RAMTEK", "HIWRA"): (21.3780, 79.3510),
    ("RAMTEK", "DUDHALA"): (21.4210, 79.2950),
    ("RAMTEK", "PAWNI"): (21.5120, 79.3120),
    ("RAMTEK", "MAHADULA"): (21.3610, 79.3420),
    ("RAMTEK", "KHINDSI"): (21.4180, 79.3520),

    # SAONER
    ("SAONER", "SAONER"): (21.3857, 78.9189),
    ("SAONER", "KHAPA"): (21.4190, 78.9620),
    ("SAONER", "KELWAD"): (21.4580, 78.8950),
    ("SAONER", "WADEGAON"): (21.3620, 78.8850),
    ("SAONER", "BAZARGAON"): (21.3320, 78.8920),
    ("SAONER", "BORGAON"): (21.3720, 78.9450),
    ("SAONER", "KHANDALA"): (21.4010, 78.9810),
    ("SAONER", "KODIGAON"): (21.4320, 78.8520),
    ("SAONER", "BHOJAPUR"): (21.3410, 78.9210),
    ("SAONER", "PIPLA (KEWALRAM)"): (21.3520, 78.9320),
    ("SAONER", "WAGHODA"): (21.4210, 78.8820),
    ("SAONER", "PARSODI"): (21.4120, 78.8910),
    ("SAONER", "SARRA"): (21.4410, 78.8650),

    # MOUDA
    ("MOUDA", "MOUDA"): (21.1687, 79.3951),
    ("MOUDA", "TARSA"): (21.2335, 79.3621),
    ("MOUDA", "KHAT"): (21.2890, 79.4120),
    ("MOUDA", "AROLI"): (21.2940, 79.4610),
    ("MOUDA", "KODAMENDHI"): (21.2580, 79.4410),
    ("MOUDA", "MATHNI"): (21.1820, 79.3710),
    ("MOUDA", "CHACHER"): (21.2290, 79.3120),
    ("MOUDA", "DHANLA"): (21.1920, 79.4310),
    ("MOUDA", "NIMKHEDA"): (21.2180, 79.3820),
    ("MOUDA", "REWRAL"): (21.2410, 79.3920),
    ("MOUDA", "CHIRWA"): (21.2010, 79.4210),
    ("MOUDA", "BORGAON"): (21.1910, 79.4520),

    # PARSEONI
    ("PARSEONI", "PARSEONI"): (21.3789, 79.2084),
    ("PARSEONI", "PARSEONI (CT)"): (21.3789, 79.2084),
    ("PARSEONI", "ITGAON"): (21.3520, 79.1820),
    ("PARSEONI", "KANHAN"): (21.3120, 79.2390),
    ("PARSEONI", "KANDRI"): (21.4180, 79.2610),
    ("PARSEONI", "MANSAR"): (21.3889, 79.2825),
    ("PARSEONI", "GHATKUKDA"): (21.3910, 79.1950),
    ("PARSEONI", "GONAHI"): (21.4020, 79.1820),
    ("PARSEONI", "SINGHORI"): (21.3650, 79.2250),
    ("PARSEONI", "SAWANGI"): (21.3550, 79.1620),
    ("PARSEONI", "KHAIRI"): (21.3410, 79.2310),
    ("PARSEONI", "PALORA"): (21.4210, 79.2150),
    ("PARSEONI", "BORKHEDI"): (21.3690, 79.1910),
    ("PARSEONI", "SALAI"): (21.4420, 79.1850),
    ("PARSEONI", "MAHARKUND"): (21.4150, 79.1420),
}

def get_village_coord(block_name, village_name, udise):
    # Check known village
    v_clean = village_name.strip().upper()
    b_clean = block_name.strip().upper()
    
    # Try exact match
    if (b_clean, v_clean) in KNOWN_VILLAGES:
        base_lat, base_lng = KNOWN_VILLAGES[(b_clean, v_clean)]
    else:
        # Check partial match
        matched = False
        for (b, v), coords in KNOWN_VILLAGES.items():
            if b == b_clean and (v in v_clean or v_clean in v):
                base_lat, base_lng = coords
                matched = True
                break
        if not matched:
            # Deterministic spread around block center based on village name hash
            v_hash = int(hashlib.md5(v_clean.encode('utf-8')).hexdigest()[:6], 16)
            center_lat, center_lng = BLOCK_CENTERS.get(b_clean, (21.3970, 79.3292))
            
            # Scatter within 0.08 deg (~9 km) of block center
            angle = (v_hash % 360) * (math.pi / 180.0)
            radius = ((v_hash // 360) % 75) / 1000.0 + 0.01
            base_lat = center_lat + radius * math.sin(angle)
            base_lng = center_lng + radius * math.cos(angle)
            
    # Add minor deterministic jitter based on UDISE so multiple schools in same village don't stack directly
    u_hash = int(hashlib.md5(str(udise).encode('utf-8')).hexdigest()[:4], 16)
    jitter_lat = ((u_hash % 21) - 10) * 0.00035
    jitter_lng = (((u_hash // 21) % 21) - 10) * 0.00035

    final_lat = round(base_lat + jitter_lat, 6)
    final_lng = round(base_lng + jitter_lng, 6)
    return final_lat, final_lng

def parse_classes(class_str):
    if not class_str:
        return 1, 8
    c = class_str.replace("–", "-").split("-")
    try:
        f = int(c[0].strip())
        t = int(c[1].strip())
        return f, t
    except:
        return 1, 8

def clean_type(t_str):
    if not t_str:
        return "Co-educational"
    if "Co-ed" in t_str or "Co-Ed" in t_str:
        return "Co-educational"
    if "Girls" in t_str:
        return "Girls"
    if "Boys" in t_str:
        return "Boys"
    return t_str.strip()

def process_block(block_key, csv_path):
    schools = []
    with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        for r in reader:
            udise = r.get("UDISE Code", "").strip()
            name = r.get("School Name", "").strip()
            block = r.get("Block", "").strip().upper()
            village = r.get("Village", "").strip()
            cluster = r.get("Cluster", "").strip()
            district = r.get("District", "NAGPUR").strip().upper()
            pin_raw = r.get("PIN Code", "").strip()
            pin = pin_raw.replace(".0", "") if pin_raw else "441107"
            address = r.get("Address", "").strip()
            email = r.get("Email", "").strip()
            management = r.get("School Management", "Local Body").strip()
            category = r.get("School Category", "Primary").strip()
            school_type = clean_type(r.get("School Type", "Co-educational"))
            class_from, class_to = parse_classes(r.get("Classes From–To", "1–4"))
            rural_urban = r.get("Rural/Urban", "Rural").strip()
            status = r.get("School Status", "Operational").strip()
            sr_no = r.get("Sr No.", "").strip()
            lgd_village = r.get("LGD Village", "").strip()
            lgd_panchayat = r.get("LGD Panchayat", "").strip()
            lgd_block = r.get("LGD Block", "").strip()

            lat, lng = get_village_coord(block, village, udise)
            dist_ramtek = calc_dist(lat, lng, RAMTEK_LAT, RAMTEK_LNG)

            school_obj = {
                "id": udise,
                "name": name,
                "udise": udise,
                "district": district,
                "block": block,
                "cluster": cluster,
                "village": village,
                "pin": pin,
                "address": address,
                "management": management,
                "category": category,
                "type": school_type,
                "classFrom": class_from,
                "classTo": class_to,
                "ruralUrban": rural_urban,
                "status": status,
                "latitude": lat,
                "longitude": lng,
                "distanceRamtekKm": dist_ramtek,
                "isWithin200KmRamtek": dist_ramtek <= 200,
                "srNo": sr_no,
                "email": email,
                "lgdVillage": lgd_village,
                "lgdPanchayat": lgd_panchayat,
                "lgdBlock": lgd_block,
            }
            schools.append(school_obj)
    return schools

os.makedirs("src/data/blocks", exist_ok=True)

blocks = [
    ("RAMTEK", "scripts/data_ramtek.csv", "ramtek.ts"),
    ("SAONER", "scripts/data_saoner.csv", "saoner.ts"),
    ("MOUDA", "scripts/data_mouda.csv", "mouda.ts"),
    ("PARSEONI", "scripts/data_parseoni.csv", "parseoni.ts"),
]

all_counts = {}
for block_name, csv_file, ts_filename in blocks:
    school_list = process_block(block_name, csv_file)
    all_counts[block_name] = len(school_list)
    var_name = f"{block_name.lower()}Schools"
    
    ts_content = f"""// {block_name} Block School Data ({len(school_list)} schools)
import {{ School }} from '../../types';

export const {var_name}: School[] = {json.dumps(school_list, indent=2)};
"""
    with open(f"src/data/blocks/{ts_filename}", "w", encoding="utf-8") as out:
        out.write(ts_content)

print("Block counts:", all_counts)
total = sum(all_counts.values())
print(f"Total schools generated: {total}")
