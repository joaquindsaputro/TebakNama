import os
import re

def create_js_database():
    # Target folder gambar
    folders = {
        "normal_items": {
            "path": "themes/minecraft/images/Common",
            "default_rarity": "common"
        },
        "vip_items": {
            "path": "themes/minecraft/images/Rare",
            "default_rarity": "legendary" 
        }
    }

    output_file = "Minecraft_DB.txt"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        for item_type, config in folders.items():
            folder_path = config["path"]
            rarity = config["default_rarity"]
            
            if not os.path.exists(folder_path):
                print(f"[!] Folder tidak ditemukan: {folder_path}")
                continue
                
            f.write(f"        // Generated {item_type}\n")
            f.write(f"        {item_type}: [\n")
            
            # Ambil semua file gambar
            files = [file for file in os.listdir(folder_path) if file.lower().endswith(('.png', '.gif', '.webp'))]
            
            for i, file in enumerate(files):
                # 1. Ambil nama dasar tanpa ekstensi (Contoh: "Bat (1)")
                raw_name = os.path.splitext(file)[0]
                
                # 2. Hapus spasi dan angka dalam kurung di akhir nama menggunakan Regex
                # Pola ini akan mengubah "Bat (1)" atau "Bat (2)" kembali menjadi "Bat"
                clean_name = re.sub(r'\s*\(\d+\)$', '', raw_name).upper()
                
                # Tambahkan koma di akhir baris kecuali file terakhir
                comma = "," if i < len(files) - 1 else ""
                
                # Buat format object JavaScript (Nama bersih, tapi URL path tetap sesuai nama file asli)
                js_obj = f'            {{ name: "{clean_name}", rarity: "{rarity}", img: "{folder_path}/{file}" }}{comma}\n'
                f.write(js_obj)
                
            f.write("        ],\n\n")
            
    print(f"[SUKSES] Berhasil mencatat nama file! Buka file '{output_file}'.")

if __name__ == '__main__':
    create_js_database()
    input("Tekan Enter untuk keluar...")