import base64
import os
import json

IMAGE_DIR = r"C:\Users\casey\.gemini\antigravity\scratch\coloring_book\images"
OUTPUT_FILE = r"C:\Users\casey\.gemini\antigravity\scratch\coloring_book\assets.js"

images = [
    {"name": "Mona Lisa", "filename": "mona_lisa.png"},
    {"name": "Starry Night", "filename": "starry_night.png"},
    {"name": "Cyberpunk Robot", "filename": "robot.png"},
    {"name": "Gacha Cat Girl", "filename": "gacha_cat.png"},
    {"name": "Gacha Boy", "filename": "gacha_boy.png"},
    {"name": "Gacha Fairy", "filename": "gacha_fairy.png"},
    {"name": "Gacha Sport", "filename": "gacha_sport.png"},
    {"name": "Gacha Bear", "filename": "gacha_bear.png"},
    {"name": "Unicorn Wow", "filename": "uni_poop_pile.png"},
    {"name": "Unicorn Trail", "filename": "uni_trail.png"},
    {"name": "Unicorn Potty", "filename": "uni_potty.png"},
    {"name": "Unicorn Cheeky", "filename": "uni_cheeky.png"},
    {"name": "Unicorn Jump", "filename": "uni_jump.png"}
]

js_content = "const ASSETS = [\n"

for img in images:
    path = os.path.join(IMAGE_DIR, img['filename'])
    try:
        with open(path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode('utf-8')
            js_content += "    {\n"
            js_content += f"        name: \"{img['name']}\",\n"
            js_content += "        type: 'image',\n"
            js_content += f"        src: 'data:image/png;base64,{encoded}'\n"
            js_content += "    },\n"
    except Exception as e:
        print(f"Error processing {path}: {e}")

js_content += "];\n"

with open(OUTPUT_FILE, "w") as f:
    f.write(js_content)

print("assets.js updated with Base64 images.")
