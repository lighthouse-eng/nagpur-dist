import json, math, re

RAMTEK_LAT = 21.3970
RAMTEK_LNG = 79.3292

def calc_dist(lat1, lon1, lat2, lon2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return round(R * c, 1)

VILLAGE_COORDS = {
    "MOUDA": (21.1687, 79.3951),
    "MATHNI": (21.1820, 79.3710),
    "PAWADDUANA": (21.1710, 79.3820),
    "ZULLAR": (21.1920, 79.3610),
    "WANJARA": (21.1850, 79.4010),
    "MOHKHEDI": (21.1980, 79.3920),
    "CHEHADI": (21.1760, 79.3580),
    "KESLAPUR": (21.1620, 79.4120),
    "RAHADI": (21.1590, 79.3820),
    "DAHALI": (21.1530, 79.4080),
    "NANADEVI": (21.1480, 79.3920),
    "SUKALI (ZULLAR)": (21.1980, 79.3520),
    "BORGAON": (21.1910, 79.4520),
    "CHIRWA": (21.2010, 79.4210),
    "MOHADI": (21.2120, 79.4120),
    "PANMARA": (21.2080, 79.4420),
    "NIHARWANI": (21.2210, 79.4310),
    "CHIKHALABODI": (21.2280, 79.4410),
    "GOWARI": (21.2150, 79.4580),
    "KOTGAON": (21.2050, 79.4620),
    "MAHADULA": (21.1890, 79.4610),
    "SINGORI (MARODI)": (21.1980, 79.4710),
    "MARODI": (21.2050, 79.4790),
    "NANDGAON": (21.2180, 79.4280),
    "NIHARWAANI (TOLI)": (21.2250, 79.4350),
    "WADHANA": (21.2120, 79.4250),
    "AAJANGAON": (21.2250, 79.3780),
    "BHENDALA": (21.2380, 79.3620),
    "MANGALITELI": (21.2150, 79.3950),
    "DHAMANGAON": (21.2210, 79.3880),
    "KORAD": (21.2120, 79.4680),
    "LAPKA": (21.1780, 79.4120),
    "ISAPUR": (21.2320, 79.3710),
    "KUMBHARI": (21.1820, 79.4250),
    "NAVEGAON(KORAD)": (21.2180, 79.4620),
    "DHANLA": (21.1920, 79.4310),
    "PIPARI": (21.2010, 79.4380),
    "DAHEGAON": (21.2120, 79.4490),
    "CHICHOLI": (21.1850, 79.4380),
    "BHOWARI": (21.2190, 79.4410),
    "KHANDALA(PIPARI)": (21.2080, 79.4250),
    "SUNDARGAON": (21.2020, 79.4150),
    "CHARBHA": (21.2110, 79.4320),
    "INDIRANAGAR(DHANLA)": (21.1940, 79.4350),
    "TARSA": (21.2335, 79.3621),
    "NARSALA": (21.2420, 79.3780),
    "BABDEO": (21.2390, 79.3680),
    "SAWARGAON": (21.2450, 79.3710),
    "HIVRA(GANGNER)": (21.2510, 79.3580),
    "KUMBHAPUR": (21.2480, 79.3820),
    "KOPRA": (21.2550, 79.3720),
    "KIRNAPUR": (21.2360, 79.3890),
    "SINGORI (NARSALA)": (21.2490, 79.3850),
    "MANGALI CHANDE": (21.2410, 79.3610),
    "MANGALI GOSAVI": (21.2350, 79.3550),
    "TARSA CHOWK": (21.2310, 79.3650),
    "CHACHER": (21.2290, 79.3120),
    "DUDHALA": (21.2380, 79.3210),
    "NAVEGAON (ASHTI)": (21.2450, 79.3320),
    "NANDAPURI": (21.2510, 79.3250),
    "KHOPDI": (21.2210, 79.3050),
    "KHANDALA (GA)": (21.2350, 79.3180),
    "GANGNER": (21.2480, 79.3450),
    "NERLA": (21.2410, 79.3280),
    "ASHTI (NAVEGAON)": (21.2490, 79.3380),
    "NISATKHEDA": (21.2320, 79.3080),
    "YESAMBA": (21.2180, 79.2980),
    "SALVA": (21.2250, 79.2890),
    "NIMKHEDA": (21.2180, 79.3820),
    "VIRSHI": (21.2320, 79.3950),
    "HINGANA": (21.2250, 79.3890),
    "KHAPARKHEDA (TELI)": (21.2290, 79.3980),
    "DHANI": (21.2150, 79.3750),
    "BANOR": (21.2210, 79.3850),
    "BARSHI": (21.2410, 79.3180),
    "SHANTINAGAR(NIMKHEDA)": (21.2190, 79.3860),
    "TUMAN": (21.2120, 79.3920),
    "TARODI": (21.2080, 79.3980),
    "PARDIKALA": (21.2280, 79.3780),
    "KHAPARKHEDA (KIRAD)": (21.2150, 79.3910),
    "PARDI KHURD": (21.2240, 79.3720),
    "REWRAL": (21.2410, 79.3920),
    "RAJOLI": (21.2480, 79.3980),
    "KHARDA": (21.2550, 79.4050),
    "INDORA": (21.2620, 79.4180),
    "INDRAPURI": (21.2650, 79.4210),
    "NAVARGAON(DEVI)": (21.2520, 79.3850),
    "IJANI": (21.2580, 79.3910),
    "REWRAL TOLI": (21.2430, 79.3940),
    "KHAT": (21.2890, 79.4120),
    "TANDA": (21.2950, 79.4250),
    "MORGAON": (21.2820, 79.4210),
    "DHARMAPURI": (21.2780, 79.4080),
    "GHOTMUNDHARI": (21.2850, 79.4320),
    "MAHALGAON": (21.2920, 79.4180),
    "DEOMUNDHARI": (21.2810, 79.4390),
    "AADASA": (21.2750, 79.4250),
    "HIVRA": (21.2680, 79.4180),
    "PANJARA": (21.2720, 79.4310),
    "DHOLMARA(ASHTI)": (21.2880, 79.4420),
    "ASHTI(DHOLMARA)": (21.2850, 79.4480),
    "SHIVANI": (21.2790, 79.4280),
    "DHANOLI": (21.2710, 79.4310),
    "WAIGAON": (21.2750, 79.4420),
    "TONDALI": (21.2680, 79.4490),
    "SUKLI(DEV)": (21.2790, 79.4520),
    "MURMADI": (21.2850, 79.4580),
    "KHIDKI": (21.2640, 79.4380),
    "WAGHBODI": (21.2590, 79.4420),
    "KATHALABODI": (21.2610, 79.4510),
    "AROLI": (21.2940, 79.4610),
    "BERDEPAR": (21.2990, 79.4690),
    "KHANDALA(GUJAR)": (21.2890, 79.4550),
    "BHANDEWADI": (21.3020, 79.4720),
    "SHIVADOULI": (21.3080, 79.4650),
    "SAVANGI": (21.2850, 79.4710),
    "KODAMENDHI": (21.2580, 79.4410),
    "ADEGAON": (21.2510, 79.4480),
    "WAKESHWAR": (21.2650, 79.4520),
    "SIRSOLI": (21.2780, 79.4620),
    "BORI GHIWARI": (21.2690, 79.4580),
    "PIMPALGAON": (21.2820, 79.4690),
    "SHRIKHANDA": (21.2910, 79.4780),
}

def parse_classes(class_str):
    c = class_str.replace("–", "-").split("-")
    try:
        f = int(c[0].strip())
        t = int(c[1].strip())
        return f, t
    except:
        return 1, 8

def clean_type(t_str):
    if "Co-ed" in t_str: return "Co-educational"
    if "Girls" in t_str: return "Girls"
    if "Boys" in t_str: return "Boys"
    return t_str.strip()

print("Mouda helper defined successfully")
