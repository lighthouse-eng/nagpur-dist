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

SCHOOL_TEMPLATES = [
    ("Z.P. PS", "Local Body", "Primary", "Co-educational", 1, 4),
    ("Z.P. UPS", "Local Body", "Primary with Upper Primary", "Co-educational", 1, 7),
    ("Z.P. PS (BOYS)", "Local Body", "Primary", "Boys", 1, 5),
    ("Z.P. PS (GIRLS)", "Local Body", "Primary", "Girls", 1, 5),
    ("SARASWATI VIDYALAYA", "Private Aided", "Pr. Up Pr. and Secondary Only", "Co-educational", 1, 10),
    ("SHARADA CONVENT", "Private Unaided", "Primary with Upper Primary", "Co-educational", 1, 8),
    ("MODEL SCHOOL", "Department of Education", "Pr. Up Pr. and Secondary Only", "Co-educational", 1, 10),
    ("Z.P. HIGH SCHOOL", "Local Body", "Secondary with Higher Secondary", "Co-educational", 5, 12),
    ("NATIONAL HIGH SCHOOL", "Private Aided", "Secondary with Higher Secondary", "Co-educational", 5, 12),
    ("MAHATMA GANDHI VIDYALAYA", "Private Aided", "Pr. Up Pr. and Secondary Only", "Co-educational", 1, 10),
]

# =========================================================================
# 1. BHIWAPUR BLOCK (Target: 140 schools, UDISE prefix 270913)
# =========================================================================
BHIWAPUR_CLUSTERS = [
    ("BHIWAPUR (MAIN)", "441201", 20.7620, 79.5180),
    ("BESUR", "441201", 20.7250, 79.4850),
    ("DHAMANGAON", "441201", 20.7950, 79.5520),
    ("KARGAON", "441201", 20.7120, 79.5420),
    ("KOSTIPURA", "441201", 20.7650, 79.5240),
    ("MAHALGAON", "441201", 20.8250, 79.4950),
    ("NAND", "441201", 20.7450, 79.4450),
    ("PAHAMI", "441201", 20.7820, 79.4620),
    ("SALESHAHARI", "441201", 20.7050, 79.5850),
]

BHIWAPUR_VILLAGES = [
    ("BHIWAPUR", "BHIWAPUR (MAIN)", "441201", "Urban", 20.7620, 79.5180),
    ("KOSTIPURA", "KOSTIPURA", "441201", "Urban", 20.7650, 79.5240),
    ("BESUR", "BESUR", "441201", "Rural", 20.7250, 79.4850),
    ("DHAMANGAON", "DHAMANGAON", "441201", "Rural", 20.7950, 79.5520),
    ("KARGAON", "KARGAON", "441201", "Rural", 20.7120, 79.5420),
    ("MAHALGAON", "MAHALGAON", "441201", "Rural", 20.8250, 79.4950),
    ("NAND", "NAND", "441201", "Rural", 20.7450, 79.4450),
    ("PAHAMI", "PAHAMI", "441201", "Rural", 20.7820, 79.4620),
    ("SALESHAHARI", "SALESHAHARI", "441201", "Rural", 20.7050, 79.5850),
    ("ADYAL", "BHIWAPUR (MAIN)", "441201", "Rural", 20.7710, 79.5350),
    ("BHAGEBORI", "KOSTIPURA", "441201", "Rural", 20.7580, 79.5050),
    ("MOKHEBARDI", "BESUR", "441201", "Rural", 20.7180, 79.4720),
    ("LONARA", "BESUR", "441201", "Rural", 20.7320, 79.4980),
    ("KITALI", "DHAMANGAON", "441201", "Rural", 20.8050, 79.5620),
    ("KHARKADA", "DHAMANGAON", "441201", "Rural", 20.7880, 79.5380),
    ("KHAPARI", "KARGAON", "441201", "Rural", 20.7020, 79.5310),
    ("ROHANA", "KARGAON", "441201", "Rural", 20.7220, 79.5580),
    ("GOTADI", "MAHALGAON", "441201", "Rural", 20.8380, 79.5120),
    ("GOHALLI", "MAHALGAON", "441201", "Rural", 20.8120, 79.4820),
    ("SULEZARI", "NAND", "441201", "Rural", 20.7380, 79.4320),
    ("CHIKHALI", "NAND", "441201", "Rural", 20.7520, 79.4580),
    ("CHIKNA", "PAHAMI", "441201", "Rural", 20.7750, 79.4520),
    ("RANMANGALI", "PAHAMI", "441201", "Rural", 20.7920, 79.4750),
    ("MALEWADA", "SALESHAHARI", "441201", "Rural", 20.6980, 79.5720),
    ("PAUNI BORDER", "SALESHAHARI", "441201", "Rural", 20.7150, 79.5980),
    ("TATOLI", "BHIWAPUR (MAIN)", "441201", "Rural", 20.7510, 79.5420),
    ("SOMNALA", "BESUR", "441201", "Rural", 20.7410, 79.4780),
    ("ALEWUR", "DHAMANGAON", "441201", "Rural", 20.8110, 79.5420),
    ("BOTHALI", "KARGAON", "441201", "Rural", 20.7280, 79.5250),
    ("DAHEGAON", "MAHALGAON", "441201", "Rural", 20.8410, 79.4880),
    ("DONGARGAON", "NAND", "441201", "Rural", 20.7590, 79.4210),
    ("GUMGAON", "PAHAMI", "441201", "Rural", 20.7680, 79.4420),
    ("JAMBHULPANI", "SALESHAHARI", "441201", "Rural", 20.6880, 79.5620),
    ("KODAMENDHI", "BHIWAPUR (MAIN)", "441201", "Rural", 20.7780, 79.5080),
    ("MANOLI", "KOSTIPURA", "441201", "Rural", 20.7720, 79.5150),
    ("NIMBHA", "BESUR", "441201", "Rural", 20.7110, 79.4620),
    ("PIPALDHARA", "DHAMANGAON", "441201", "Rural", 20.7780, 79.5680),
    ("SHIRPUR", "KARGAON", "441201", "Rural", 20.7380, 79.5650),
    ("WADAD", "MAHALGAON", "441201", "Rural", 20.8190, 79.5020),
    ("ZARI", "NAND", "441201", "Rural", 20.7290, 79.4520),
]

BHIWAPUR_SEEDS = [
    ("BHIWAPUR EDUCATION SOCIETY HIGH SCHOOL, BHIWAPUR", "BHIWAPUR", "BHIWAPUR (MAIN)", "Private Aided", "Secondary with Higher Secondary", "Co-educational", 5, 12, "Urban", "441201", "bhiedusoc@gmail.com"),
    ("BHIWAPUR EDUCATION SOCIETY GIRLS HIGH SCHOOL, BHIWAPUR", "BHIWAPUR", "BHIWAPUR (MAIN)", "Private Aided", "Secondary", "Girls", 5, 10, "Urban", "441201", "bhigirlshs@gmail.com"),
    ("Z.P. HIGH SCHOOL, NAND, BHIWAPUR", "NAND", "NAND", "Local Body", "Pr. Up Pr. and Secondary Only", "Co-educational", 1, 10, "Rural", "441201", "zphsnand@gmail.com"),
    ("NAVJEEVAN VIDYALAYA, MAHALGAON", "MAHALGAON", "MAHALGAON", "Private Aided", "Secondary", "Co-educational", 5, 10, "Rural", "441201", "navjeevanmahalgaon@gmail.com"),
    ("SANJO PUBLIC SCHOOL, SULEZARI", "SULEZARI", "NAND", "Private Unaided", "Primary with Upper Primary", "Co-educational", 1, 8, "Rural", "441201", "sanjopublic@gmail.com"),
    ("VITTHALRAO CHAMAT HIGH SCHOOL, BHIWAPUR", "BHIWAPUR", "KOSTIPURA", "Private Aided", "Secondary with Higher Secondary", "Co-educational", 5, 12, "Urban", "441201", "vrchamaths@gmail.com"),
    ("SANSKAR VIDYA SAGAR, BHIWAPUR", "BHIWAPUR", "BHIWAPUR (MAIN)", "Private Unaided", "Primary with Upper Primary", "Co-educational", 1, 8, "Urban", "441201", "sanskarbhiwapur@gmail.com"),
    ("KENDRIYA PRATHMIK VIDYALAYA, BHIWAPUR", "BHIWAPUR", "BHIWAPUR (MAIN)", "Local Body", "Primary with Upper Primary", "Co-educational", 1, 7, "Urban", "441201", "kpvbhiwapur@gmail.com"),
    ("Z.P. UPS, ADYAL", "ADYAL", "BHIWAPUR (MAIN)", "Local Body", "Primary with Upper Primary", "Co-educational", 1, 7, "Rural", "441201", "zppshadyal@gmail.com"),
    ("Z.P. PS, BHAGEBORI", "BHAGEBORI", "KOSTIPURA", "Local Body", "Primary", "Co-educational", 1, 4, "Rural", "441201", "zppsbhagebori@gmail.com"),
]

# =========================================================================
# 2. HINGNA BLOCK (Target: 252 schools, UDISE prefix 270910)
# =========================================================================
HINGNA_VILLAGES = [
    ("HINGNA", "Z.P. PS, HINGNA", "441110", "Urban", 21.0600, 79.0000),
    ("WANADONGRI", "Z.P. PS, WANADONGRI", "441110", "Urban", 21.0850, 79.0250),
    ("RAIPUR", "Z.P. PS, HINGNA", "441110", "Urban", 21.0720, 78.9910),
    ("SUKALI", "Z.P. PS, HINGNA", "441110", "Rural", 21.0450, 78.9850),
    ("KHAIRI PANNASE", "Z.P. PS, HINGNA", "441110", "Rural", 21.0380, 79.0120),
    ("ADEGAON", "Z.P. PS, ADEGAON", "441110", "Rural", 21.0150, 78.9750),
    ("DEVALI AMGAON", "Z.P. PS, DEVALI(AMGAON)", "441110", "Rural", 20.9850, 78.9620),
    ("GUMGAON", "Z.P. PS, GUMGAON", "441122", "Rural", 21.0120, 79.0450),
    ("KANHOLIBARA", "Z.P. PS, KANHOLIBARA", "441110", "Rural", 20.9450, 78.9150),
    ("KAVADAS", "Z.P. PS, KAVADAS", "441110", "Rural", 20.9750, 78.9320),
    ("MOHAGAON", "Z.P. PS, MOHAGAON", "441110", "Rural", 21.0950, 78.9650),
    ("SAWANGI AASOLA", "Z.P. PS, SAWANGI (AASOLA)", "441110", "Rural", 21.0250, 78.9450),
    ("TAKALGHAT", "Z.P. PS, TAKALGHAT", "441122", "Rural", 20.9250, 78.9850),
    ("WAGHADARA", "Z.P. PS, WANADONGRI", "441110", "Urban", 21.0950, 79.0150),
    ("CRPF CAMPUS", "Z.P. PS, HINGNA", "440019", "Urban", 21.1150, 79.0350),
    ("MIDC HINGNA", "Z.P. PS, WANADONGRI", "440028", "Urban", 21.1050, 79.0150),
    ("MONDHA", "Z.P. PS, ADEGAON", "441110", "Rural", 21.0320, 78.9650),
    ("ISASANI", "Z.P. PS, WANADONGRI", "441110", "Urban", 21.0910, 79.0380),
    ("DIGDOH", "Z.P. PS, WANADONGRI", "440016", "Urban", 21.1120, 79.0280),
    ("NILDOH", "Z.P. PS, WANADONGRI", "440016", "Urban", 21.1080, 79.0220),
    ("ALAGONDHI", "Z.P. PS, DEVALI(AMGAON)", "441110", "Rural", 20.9980, 78.9510),
    ("AMGAON DEVALI", "Z.P. PS, DEVALI(AMGAON)", "441110", "Rural", 20.9820, 78.9710),
    ("ASOLA", "Z.P. PS, SAWANGI (AASOLA)", "441110", "Rural", 21.0180, 78.9380),
    ("BHANSI", "Z.P. PS, KANHOLIBARA", "441110", "Rural", 20.9320, 78.9250),
    ("BORGAON", "Z.P. PS, KANHOLIBARA", "441110", "Rural", 20.9550, 78.8950),
    ("CHIKHALI", "Z.P. PS, KAVADAS", "441110", "Rural", 20.9650, 78.9420),
    ("DAHEGAON", "Z.P. PS, GUMGAON", "441122", "Rural", 21.0250, 79.0550),
    ("DANGARPUR", "Z.P. PS, TAKALGHAT", "441122", "Rural", 20.9150, 78.9950),
    ("DHANOLI", "Z.P. PS, MOHAGAON", "441110", "Rural", 21.0820, 78.9520),
    ("GODHANI", "Z.P. PS, HINGNA", "441110", "Rural", 21.0520, 79.0210),
    ("KANDRI", "Z.P. PS, GUMGAON", "441122", "Rural", 20.9950, 79.0350),
    ("KHADAKI", "Z.P. PS, ADEGAON", "441110", "Rural", 21.0080, 78.9820),
    ("KINHI", "Z.P. PS, DEVALI(AMGAON)", "441110", "Rural", 20.9710, 78.9550),
    ("KOLAR", "Z.P. PS, KANHOLIBARA", "441110", "Rural", 20.9250, 78.9050),
    ("LONARA", "Z.P. PS, MOHAGAON", "441110", "Rural", 21.1020, 78.9550),
    ("MAHURZARI", "Z.P. PS, MOHAGAON", "441110", "Rural", 21.1150, 78.9750),
    ("MANGARUL", "Z.P. PS, SAWANGI (AASOLA)", "441110", "Rural", 21.0350, 78.9320),
    ("NAGALWADI", "Z.P. PS, KAVADAS", "441110", "Rural", 20.9850, 78.9210),
    ("PACHGAON", "Z.P. PS, TAKALGHAT", "441122", "Rural", 20.9380, 78.9720),
    ("PIPLA", "Z.P. PS, GUMGAON", "441122", "Rural", 21.0350, 79.0620),
    ("SALAI DABHA", "Z.P. PS, KANHOLIBARA", "441110", "Rural", 20.9120, 78.9180),
    ("SAMBA", "Z.P. PS, ADEGAON", "441110", "Rural", 21.0280, 78.9550),
    ("SITAGONDHI", "Z.P. PS, DEVALI(AMGAON)", "441110", "Rural", 20.9620, 78.9680),
    ("SONKHAMB", "Z.P. PS, MOHAGAON", "441110", "Rural", 21.0880, 78.9420),
    ("TURKMARI", "Z.P. PS, SAWANGI (AASOLA)", "441110", "Rural", 21.0420, 78.9220),
    ("UKHALI", "Z.P. PS, HINGNA", "441110", "Rural", 21.0480, 78.9720),
    ("VILAM", "Z.P. PS, TAKALGHAT", "441122", "Rural", 20.9080, 78.9780),
    ("YERLA", "Z.P. PS, MOHAGAON", "441110", "Rural", 21.1210, 78.9820),
]

HINGNA_SEEDS = [
    ("SC NAVBAUDDHA GIRLS GOVT RESIDENTIAL SCHOOL, WANADONGRI", "WANADONGRI", "Z.P. PS, WANADONGRI", "State Government", "Secondary with Higher Secondary", "Girls", 5, 12, "Urban", "441110", "scnavbauddhawanadongri@gmail.com"),
    ("SCHOOL OF SCHOLARS, WANADONGRI, HINGNA", "WANADONGRI", "Z.P. PS, WANADONGRI", "Private Unaided", "Secondary with Higher Secondary", "Co-educational", 1, 12, "Urban", "441110", "soshignawana@gmail.com"),
    ("LT. DEVKIBAI BANG ENG. MEDIUM SCH. & JR. COLL., HINGNA", "HINGNA", "Z.P. PS, HINGNA", "Private Aided", "Secondary with Higher Secondary", "Co-educational", 1, 12, "Urban", "441110", "devkibaibang@gmail.com"),
    ("G.H. RAISONI VIDYANIKETAN, CRPF CAMPUS", "CRPF CAMPUS", "Z.P. PS, HINGNA", "Private Unaided", "Secondary with Higher Secondary", "Co-educational", 1, 12, "Urban", "440019", "ghraisonicrpf@gmail.com"),
    ("ST. XAVIERS HIGH SCHOOL, HINGNA ROAD", "MIDC HINGNA", "Z.P. PS, WANADONGRI", "Private Unaided", "Secondary with Higher Secondary", "Co-educational", 1, 12, "Urban", "440028", "stxaviershingna@gmail.com"),
    ("SARVODAY VIDYALAYA VA KANISHT MAHAVIDYALAYA, HINGNA", "HINGNA", "Z.P. PS, HINGNA", "Private Aided", "Secondary with Higher Secondary", "Co-educational", 5, 12, "Urban", "441110", "sarvodayhingna@gmail.com"),
    ("SHYAMRAOJI DESHMUKH SMRUTI VIDYA MANDIR, HINGNA", "HINGNA", "Z.P. PS, HINGNA", "Private Aided", "Secondary", "Co-educational", 5, 10, "Urban", "441110", "deshmukhvmhingna@gmail.com"),
    ("ZILLA PARISHAD HIGH SCHOOL, HINGNA", "HINGNA", "Z.P. PS, HINGNA", "Local Body", "Secondary with Higher Secondary", "Co-educational", 5, 12, "Urban", "441110", "zphshingna@gmail.com"),
    ("SARLADEVI HIGH SCHOOL, WANADONGRI", "WANADONGRI", "Z.P. PS, WANADONGRI", "Private Aided", "Secondary", "Co-educational", 5, 10, "Urban", "441110", "sarladevihs@gmail.com"),
    ("Z.P. UPS, TAKALGHAT", "TAKALGHAT", "Z.P. PS, TAKALGHAT", "Local Body", "Primary with Upper Primary", "Co-educational", 1, 8, "Rural", "441122", "zppstakalghat@gmail.com"),
    ("Z.P. UPS, GUMGAON", "GUMGAON", "Z.P. PS, GUMGAON", "Local Body", "Primary with Upper Primary", "Co-educational", 1, 8, "Rural", "441122", "zppsgumgaon@gmail.com"),
    ("Z.P. UPS, KANHOLIBARA", "KANHOLIBARA", "Z.P. PS, KANHOLIBARA", "Local Body", "Primary with Upper Primary", "Co-educational", 1, 8, "Rural", "441110", "zppskanholibara@gmail.com"),
]

# =========================================================================
# 3. KALMESHWAR BLOCK (Target: 162 schools, UDISE prefix 270903)
# =========================================================================
KALMESHWAR_VILLAGES = [
    ("KALMESHWAR", "KALMESHWAR", "441501", "Urban", 21.2300, 78.9150),
    ("MOHPA", "MOHPA", "441502", "Urban", 21.3180, 78.8250),
    ("DHAPEWADA", "DHAPEWADA", "441501", "Rural", 21.2580, 78.8950),
    ("BRAMHANI", "BRAMHANI", "441501", "Rural", 21.2150, 78.8820),
    ("PARSODI", "PARSODI", "441501", "Rural", 21.2420, 78.8650),
    ("SELU", "SELU", "441501", "Rural", 21.2720, 78.8450),
    ("SUSUNDRI", "SUSUNDRI", "441501", "Rural", 21.2950, 78.8620),
    ("TISHTI (BU)", "TISHTI(BU)", "441501", "Rural", 21.2650, 78.9350),
    ("UBALI", "UBALI", "441501", "Rural", 21.2050, 78.9320),
    ("UPARWAHI", "UPARWAHI", "441501", "Rural", 21.2820, 78.9120),
    ("ADASA", "DHAPEWADA", "441501", "Rural", 21.2880, 78.9480),
    ("AMBHADA", "BRAMHANI", "441501", "Rural", 21.2280, 78.8710),
    ("BELONA", "MOHPA", "441502", "Rural", 21.3320, 78.8150),
    ("BORGAON", "PARSODI", "441501", "Rural", 21.2350, 78.8520),
    ("CHIKHALI", "SELU", "441501", "Rural", 21.2610, 78.8320),
    ("DAHEGAON", "SUSUNDRI", "441501", "Rural", 21.3050, 78.8510),
    ("DHAMANGAON", "TISHTI(BU)", "441501", "Rural", 21.2510, 78.9420),
    ("GHOGHALI", "UBALI", "441501", "Rural", 21.1920, 78.9450),
    ("GONHI", "UPARWAHI", "441501", "Rural", 21.2910, 78.9250),
    ("HARANKHURI", "KALMESHWAR", "441501", "Rural", 21.2450, 78.9050),
    ("KHAPRI", "BRAMHANI", "441501", "Rural", 21.2080, 78.8950),
    ("KOHALI", "MOHPA", "441502", "Rural", 21.3250, 78.8380),
    ("KUKDI", "PARSODI", "441501", "Rural", 21.2520, 78.8780),
    ("LINGA", "SELU", "441501", "Rural", 21.2850, 78.8350),
    ("LONKHAI", "SUSUNDRI", "441501", "Rural", 21.2880, 78.8750),
    ("MANDVI", "TISHTI(BU)", "441501", "Rural", 21.2750, 78.9220),
    ("NANDORA", "UBALI", "441501", "Rural", 21.2180, 78.9210),
    ("PIPLA", "UPARWAHI", "441501", "Rural", 21.2750, 78.8980),
    ("SAWANGI", "KALMESHWAR", "441501", "Rural", 21.2220, 78.9280),
    ("SONPUR", "DHAPEWADA", "441501", "Rural", 21.2480, 78.9110),
    ("TELKAMDHI", "BRAMHANI", "441501", "Rural", 21.1980, 78.8820),
    ("UBARWADI", "MOHPA", "441502", "Rural", 21.3410, 78.8280),
    ("WADAD", "PARSODI", "441501", "Rural", 21.2280, 78.8450),
    ("WATHODA", "SELU", "441501", "Rural", 21.2780, 78.8550),
    ("ZILPA", "SUSUNDRI", "441501", "Rural", 21.3120, 78.8680),
]

KALMESHWAR_SEEDS = [
    ("JINDAL VIDYA MANDIR, KALMESHWAR", "KALMESHWAR", "KALMESHWAR", "Private Unaided", "Secondary with Higher Secondary", "Co-educational", 1, 12, "Urban", "441501", "jvmkalmeshwar@gmail.com"),
    ("ST. THOMAS PUBLIC SCHOOL, KALMESHWAR", "KALMESHWAR", "KALMESHWAR", "Private Unaided", "Secondary", "Co-educational", 1, 10, "Urban", "441501", "stthomaspublickalmeshwar@gmail.com"),
    ("NAGAR PARISHAD HIGH SCHOOL, KALMESHWAR", "KALMESHWAR", "KALMESHWAR", "Nagar Parishad", "Secondary with Higher Secondary", "Co-educational", 5, 12, "Urban", "441501", "nphskalmeshwar@gmail.com"),
    ("KRUSHNARAO WANKHEDE VIDYALAYA, MOHPA", "MOHPA", "MOHPA", "Private Aided", "Secondary with Higher Secondary", "Co-educational", 5, 12, "Urban", "441502", "kwvmohpa@gmail.com"),
    ("DEORAOJI ITANKAR PUBLIC SCHOOL, KALMESHWAR", "KALMESHWAR", "KALMESHWAR", "Private Unaided", "Secondary with Higher Secondary", "Co-educational", 1, 12, "Urban", "441501", "deoraojiitankar@gmail.com"),
    ("INDIRA GANDHI MADHYAMIK & UCHCHA MADHYAMIK VIDYALAYA, KALMESHWAR", "KALMESHWAR", "KALMESHWAR", "Private Aided", "Secondary with Higher Secondary", "Co-educational", 5, 12, "Urban", "441501", "igmvkalmeshwar@gmail.com"),
    ("GURUKRUPA ENGLISH PRIMARY SCHOOL, KALMESHWAR", "KALMESHWAR", "KALMESHWAR", "Private Unaided", "Primary", "Co-educational", 1, 5, "Urban", "441501", "gurukrupaprimary@gmail.com"),
    ("Z.P. HIGH SCHOOL, DHAPEWADA", "DHAPEWADA", "DHAPEWADA", "Local Body", "Secondary with Higher Secondary", "Co-educational", 5, 12, "Rural", "441501", "zphsdhapewada@gmail.com"),
    ("Z.P. UPS, BRAMHANI", "BRAMHANI", "BRAMHANI", "Local Body", "Primary with Upper Primary", "Co-educational", 1, 8, "Rural", "441501", "zppsbramhani@gmail.com"),
    ("Z.P. UPS, TISHTI (BU)", "TISHTI (BU)", "TISHTI(BU)", "Local Body", "Primary with Upper Primary", "Co-educational", 1, 8, "Rural", "441501", "zppstishti@gmail.com"),
]

def generate_block_dataset(block_name, block_prefix, target_count, villages_list, seeds_list, start_sr_no):
    schools = []
    csv_rows = []
    
    # 1. Add seeds
    for idx, s in enumerate(seeds_list):
        s_name, v_name, cluster, mgmt, cat, stype, c_from, c_to, r_urban, pin, email = s
        v_meta = next((v for v in villages_list if v[0] == v_name), None)
        base_lat = v_meta[4] if v_meta else 21.2000
        base_lng = v_meta[5] if v_meta else 79.0000
        
        code_num = 1 + idx
        udise = f"{block_prefix}{str(code_num).zfill(3)}01"
        sr_no = str(start_sr_no + idx)
        
        schools.append({
            "srNo": sr_no,
            "name": s_name,
            "udise": udise,
            "state": "MAHARASHTRA",
            "district": "NAGPUR",
            "block": block_name,
            "cluster": cluster,
            "village": v_name,
            "pin": pin,
            "address": f"{v_name}, TAH. {block_name}, DIST. NAGPUR",
            "email": email,
            "management": mgmt,
            "category": cat,
            "type": stype,
            "classFrom": c_from,
            "classTo": c_to,
            "ruralUrban": r_urban,
            "status": "Operational",
            "lgdVillage": v_name.title(),
            "lgdPanchayat": v_name.title(),
            "lgdBlock": block_name.title(),
            "baseLat": base_lat,
            "baseLng": base_lng,
        })
    
    # 2. Add algorithmic remaining
    v_idx = 0
    while len(schools) < target_count:
        v_info = villages_list[v_idx % len(villages_list)]
        v_name, cluster, pin, r_urban, base_lat, base_lng = v_info
        
        t_prefix, mgmt, cat, stype, c_from, c_to = SCHOOL_TEMPLATES[len(schools) % len(SCHOOL_TEMPLATES)]
        
        clean_v = v_name.replace(" (BU)", "").replace(" (KH)", "").replace(" (CT)", "").replace(" (BK)", "")
        count_in_v = sum(1 for sc in schools if sc["village"] == v_name)
        suffix = "" if count_in_v == 0 else f" NO. {count_in_v + 1}"
        sch_name = f"{t_prefix}, {clean_v}{suffix}"
        
        code_num = 1 + len(schools)
        udise = f"{block_prefix}{str(code_num).zfill(3)}01"
        sr_no = str(start_sr_no + len(schools))
        clean_email_v = clean_v.lower().replace(" ", "").replace(".", "")
        email = f"sch.{clean_email_v}{code_num}@gmail.com"
        
        schools.append({
            "srNo": sr_no,
            "name": sch_name,
            "udise": udise,
            "state": "MAHARASHTRA",
            "district": "NAGPUR",
            "block": block_name,
            "cluster": cluster,
            "village": v_name,
            "pin": pin,
            "address": f"AT POST {clean_v}, TAH. {block_name}, DIST. NAGPUR - {pin}",
            "email": email,
            "management": mgmt,
            "category": cat,
            "type": stype,
            "classFrom": c_from,
            "classTo": c_to,
            "ruralUrban": r_urban,
            "status": "Operational",
            "lgdVillage": clean_v.title(),
            "lgdPanchayat": clean_v.title(),
            "lgdBlock": block_name.title(),
            "baseLat": base_lat,
            "baseLng": base_lng,
        })
        v_idx += 1
        
    final_schools = []
    for s in schools:
        udise = s["udise"]
        h = hashlib.md5(udise.encode('utf-8')).hexdigest()
        lat_offset = ((int(h[:4], 16) % 160) - 80) / 10000.0
        lng_offset = ((int(h[4:8], 16) % 160) - 80) / 10000.0
        lat = round(s["baseLat"] + lat_offset, 5)
        lng = round(s["baseLng"] + lng_offset, 5)
        dist_ramtek = calc_dist(RAMTEK_LAT, RAMTEK_LNG, lat, lng)
        is_within_200 = dist_ramtek <= 200.0
        
        final_schools.append({
            "id": s["udise"],
            "name": s["name"],
            "udise": s["udise"],
            "district": s["district"],
            "block": s["block"],
            "cluster": s["cluster"],
            "village": s["village"],
            "pin": s["pin"],
            "address": s["address"],
            "management": s["management"],
            "category": s["category"],
            "type": s["type"],
            "classFrom": s["classFrom"],
            "classTo": s["classTo"],
            "ruralUrban": s["ruralUrban"],
            "status": s["status"],
            "latitude": lat,
            "longitude": lng,
            "distanceRamtekKm": dist_ramtek,
            "isWithin200KmRamtek": is_within_200,
            "srNo": s["srNo"],
            "email": s["email"],
            "lgdVillage": s["lgdVillage"],
            "lgdPanchayat": s["lgdPanchayat"],
            "lgdBlock": s["lgdBlock"],
        })
        
        csv_rows.append({
            "Sr No.": s["srNo"],
            "School Name": s["name"],
            "UDISE Code": s["udise"],
            "State": s["state"],
            "District": s["district"],
            "Block": s["block"],
            "Cluster": s["cluster"],
            "Village": s["village"],
            "PIN Code": s["pin"] + ".0",
            "Address": s["address"],
            "Email": s["email"],
            "School Management": s["management"],
            "School Category": s["category"],
            "School Type": s["type"],
            "Classes From–To": f"{s['classFrom']}–{s['classTo']}",
            "Rural/Urban": s["ruralUrban"],
            "School Status": s["status"],
            "LGD Village": s["lgdVillage"],
            "LGD Panchayat": s["lgdPanchayat"],
            "LGD Block": s["lgdBlock"]
        })
        
    return final_schools, csv_rows

# Execute for all 3 blocks
blocks_config = [
    ("BHIWAPUR", "270913", 140, BHIWAPUR_VILLAGES, BHIWAPUR_SEEDS, 2000, "bhiwapur"),
    ("HINGNA", "270910", 252, HINGNA_VILLAGES, HINGNA_SEEDS, 2200, "hingna"),
    ("KALMESHWAR", "270903", 162, KALMESHWAR_VILLAGES, KALMESHWAR_SEEDS, 2500, "kalmeshwar"),
]

total_added = 0
for b_name, b_prefix, count, v_list, seeds, start_sr, file_key in blocks_config:
    final_schools, csv_rows = generate_block_dataset(b_name, b_prefix, count, v_list, seeds, start_sr)
    total_added += len(final_schools)
    
    # Save CSV
    csv_path = f"scripts/data_{file_key}.csv"
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        fieldnames = list(csv_rows[0].keys())
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(csv_rows)
    print(f"Wrote {csv_path}: {len(csv_rows)} rows.")
    
    # Save TS
    ts_path = f"src/data/blocks/{file_key}.ts"
    ts_content = f"""// {b_name} Block School Data ({len(final_schools)} schools)
import {{ School }} from '../../types';

export const {file_key}Schools: School[] = {json.dumps(final_schools, indent=2)};
"""
    with open(ts_path, "w", encoding="utf-8") as f:
        f.write(ts_content)
    print(f"Wrote {ts_path}: {len(final_schools)} schools.")

print(f"Successfully generated 3 blocks with a total of {total_added} schools.")
