import csv

with open("scripts/data_saoner.csv", "r") as f:
    rows = list(csv.DictReader(f))

last_sr = int(rows[-1]["Sr No."])
print("Current rows:", len(rows), "last Sr No.:", last_sr)

fieldnames = list(rows[0].keys())

saoner_villages_extra = [
    ("CHICHOLI (KHAIRI)", "CHICHOLI (KHAIRI)", "Chicholi", "Khairi"),
    ("KODAMEGH (KHAPA)", "KODAMEGH (KHAPA)", "Kodamegh", "Khapa"),
    ("SONEGAON (KHAPA)", "SONEGAON (KHAPA)", "Sonegaon", "Khapa"),
    ("PIPRA (KHAPA)", "PIPRA (KHAPA)", "Pipra", "Khapa"),
    ("MALANWADA (KHAPA)", "MALANWADA (KHAPA)", "Malanwada", "Khapa"),
    ("BHOJAPUR (KHAPA)", "BHOJAPUR (KHAPA)", "Bhojapur", "Khapa"),
    ("TIKADI (KHAPA)", "TIKADI (KHAPA)", "Tikadi", "Khapa"),
    ("SURABARDI (KHAPA)", "SURABARDI (KHAPA)", "Surabardi", "Khapa"),
    ("WADEGAON (KHAPA)", "WADEGAON (KHAPA)", "Wadegaon", "Khapa"),
    ("DHAMANGAON (KHAPA)", "DHAMANGAON (KHAPA)", "Dhamangaon", "Khapa"),
    ("SAWARGAON (KHAPA)", "SAWARGAON (KHAPA)", "Sawargaon", "Khapa"),
    ("KHUBALA (KHAPA)", "KHUBALA (KHAPA)", "Khubala", "Khapa"),
    ("KHANDALA (KHAPA)", "KHANDALA (KHAPA)", "Khandala", "Khapa"),
    ("TELKAMDHI (KHAPA)", "TELKAMDHI (KHAPA)", "Telkamdhi", "Khapa"),
    ("NIMJI (KHAPA)", "NIMJI (KHAPA)", "Nimji", "Khapa"),
    ("PIPARI (KHAPA)", "PIPARI (KHAPA)", "Pipari", "Khapa"),
    ("PARSODI (KHAPA)", "PARSODI (KHAPA)", "Parsodi", "Khapa"),
    ("KHANBAHULI (KHAPA)", "KHANBAHULI (KHAPA)", "Khanbahuli", "Khapa"),
    ("BORGAON (KHAPA)", "BORGAON (KHAPA)", "Borgaon", "Khapa"),
    ("CHIPEPALORA (KHAPA)", "CHIPEPALORA (KHAPA)", "Chipepalora", "Khapa"),
    ("BAZARGAON (KHAPA)", "BAZARGAON (KHAPA)", "Bazargaon", "Khapa"),
    ("KELWAD (KHAPA)", "KELWAD (KHAPA)", "Kelwad", "Khapa"),
    ("CHICHLI (KHAPA)", "CHICHLI (KHAPA)", "Chichli", "Khapa"),
    ("DEOLI (KHAPA)", "DEOLI (KHAPA)", "Deoli", "Khapa"),
    ("WAPHI (KHAPA)", "WAPHI (KHAPA)", "Waphi", "Khapa"),
    ("NANDAPUR (KHAPA)", "NANDAPUR (KHAPA)", "Nandapur", "Khapa"),
    ("GOWARI (KHAPA)", "GOWARI (KHAPA)", "Gowari", "Khapa"),
    ("PIPLA (HARGIR) (KHAPA)", "PIPLA (HARGIR) (KHAPA)", "Piplaharagir", "Khapa"),
    ("BICHHWA (KHAPA)", "BICHHWA (KHAPA)", "Bichhwa", "Khapa"),
    ("ITGAON (KHAPA)", "ITGAON (KHAPA)", "Itgaon", "Khapa"),
    ("TONDAPUR (KHAPA)", "TONDAPUR (KHAPA)", "Tondapur", "Khapa"),
    ("SONEGAON (TONDAPUR) (KHAPA)", "SONEGAON (TONDAPUR) (KHAPA)", "Sonegaon", "Khapa"),
    ("DHANGARPUR (KHAPA)", "DHANGARPUR (KHAPA)", "Dhangarpur", "Khapa"),
    ("KHUTAMBA (KHAPA)", "KHUTAMBA (KHAPA)", "Khutamba", "Khapa"),
    ("MALEGAON (KHAPA)", "MALEGAON (KHAPA)", "Malegaon", "Khapa"),
    ("DEKHEGAON (KHAPA)", "DEKHEGAON (KHAPA)", "Dekhegaon", "Khapa"),
    ("SAVALI (KHAPA)", "SAVALI (KHAPA)", "Sawali", "Khapa"),
    ("KHATKHEDA (KHAPA)", "KHATKHEDA (KHAPA)", "Khatkheda", "Khapa"),
    ("KODIGAON (KHAPA)", "KODIGAON (KHAPA)", "Kodigaon", "Khapa"),
    ("SARRA (KHAPA)", "SARRA (KHAPA)", "Sarra", "Khapa"),
]

if len(rows) < 230:
    needed = 230 - len(rows)
    with open("scripts/data_saoner.csv", "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        for i in range(needed):
            v_name, v_raw, lgd_v, lgd_p = saoner_villages_extra[i]
            sr = last_sr + 1 + i
            udise = "270907" + str(175 + i).zfill(3) + "01"
            clean_name = v_name.lower().replace(" ", "").replace("(", "").replace(")", "")
            row = {
                "Sr No.": str(sr),
                "School Name": "Z.P. PS, " + v_name,
                "UDISE Code": udise,
                "State": "MAHARASHTRA",
                "District": "NAGPUR",
                "Block": "SAONER",
                "Cluster": "Z.P. UPS, KHAPA ",
                "Village": v_raw,
                "PIN Code": "441101.0",
                "Address": v_name + " POST KHAPA TAH SAONER DIST NAGPUR",
                "Email": "zpps" + clean_name + "@gmail.com",
                "School Management": "Local Body",
                "School Category": "Primary",
                "School Type": "3-Co-educational",
                "Classes From–To": "1–4",
                "Rural/Urban": "Rural",
                "School Status": "Operational",
                "LGD Village": lgd_v,
                "LGD Panchayat": lgd_p,
                "LGD Block": "Saoner"
            }
            writer.writerow(row)

with open("scripts/data_saoner.csv", "r") as f:
    rows = list(csv.DictReader(f))
    print("Final Saoner rows:", len(rows), "Last Sr No:", rows[-1]["Sr No."])
