import os
import shutil
import requests

# ===============================
# KONFIGURASI
# ===============================
API_URL = "http://localhost:8000/api/documents/upload"
SOURCE_FOLDER = "to_upload"
UPLOADED_FOLDER = "uploaded"
FAILED_FOLDER = "failed"

# Buat folder tujuan jika belum ada
os.makedirs(UPLOADED_FOLDER, exist_ok=True)
os.makedirs(FAILED_FOLDER, exist_ok=True)

# ===============================
# FUNGSI UPLOAD
# ===============================
def upload_file(file_path):
    filename = os.path.basename(file_path)

    try:
        with open(file_path, "rb") as f:
            files = {
                "file": (filename, f, "application/pdf")
            }

            response = requests.post(API_URL, files=files)

        if response.status_code == 200:
            print(f"[SUCCESS] Upload berhasil: {filename}")
            shutil.move(file_path, os.path.join(UPLOADED_FOLDER, filename))
        else:
            print(f"[FAILED] Upload gagal ({response.status_code}): {filename}")
            print(response.text)
            shutil.move(file_path, os.path.join(FAILED_FOLDER, filename))

    except Exception as e:
        print(f"[ERROR] {filename}: {e}")
        shutil.move(file_path, os.path.join(FAILED_FOLDER, filename))


# ===============================
# PROSES SEMUA FILE
# ===============================
def main():
    files = os.listdir(SOURCE_FOLDER)

    if not files:
        print("Tidak ada file untuk diupload.")
        return

    for file_name in files:
        file_path = os.path.join(SOURCE_FOLDER, file_name)

        if os.path.isfile(file_path):
            upload_file(file_path)


if __name__ == "__main__":
    main()
