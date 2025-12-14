# ============================================================================
# FILE: test_full_pipeline.py
# ============================================================================
# Add project root

import sys
import os
from pathlib import Path
import json

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)
from dotenv import load_dotenv

load_dotenv()

from utils.db import SessionLocal
from repositories.master_repository import MasterRepository

print("📦 Loading modules...")

from utils.metadata_extractor import MetadataExtractor, QueryParser
from utils.enhanced_chunker import EnhancedChunker, DocumentProcessor
from utils.embeddings import EmbeddingManager, EmbeddingModel
from utils.smart_retriever import SmartRetriever, EnhancedQueryChain
from langchain_chroma import Chroma
from langchain_openai import ChatOpenAI
from langchain_core.documents import Document

print("✅ Modules loaded!\n")


# ============================================================================
# SAMPLE DOCUMENTS - Simulasi hasil parsing
# ============================================================================

SAMPLE_DOCUMENTS = [
    {
        'filename': 'SK_Biaya_TK_Cibinong_2025.pdf',
        'content': """
Keputusan Pengurus Yayasan Pesantren Islam (YPI) Al Azhar Nomor 223/VII/KEP/YPIA-P/1447.2025 
menetapkan Uang Pangkal (UP) dan Uang Sekolah (SPP) untuk TK Islam Al Azhar 27 Cibinong 
Tahun Pelajaran 2026/2027. 

Keputusan ini ditetapkan pada 22 Agustus 2025 dan berlaku mulai 2 September 2025, 
dengan dasar kebutuhan operasional tahun pelajaran 2026/2027, Anggaran Dasar & Rumah Tangga 
YPI Al Azhar, serta hasil rapat pengurus pada 21 Agustus 2025.

RINCIAN BIAYA TK CIBINONG:

Jenjang TODDLER:
- Uang Pangkal: Rp 5.500.000 (tanpa potongan)
- SPP per bulan: Rp 625.000

Jenjang KB (Kelompok Bermain):
Kategori DALAM:
- Uang Pangkal: Rp 6.500.000
- SPP per bulan: Rp 750.000

Kategori LUAR:
- Uang Pangkal: Rp 7.500.000
- SPP per bulan: Rp 750.000

Kategori KHUSUS:
- Uang Pangkal: Rp 3.750.000
- SPP per bulan: Rp 400.000

Jenjang TK A:
Kategori DALAM:
- Uang Pangkal: Rp 12.300.000 (potongan Rp 750.000)
- Setelah potongan: Rp 11.550.000
- SPP per bulan: Rp 900.000

Kategori LUAR:
- Uang Pangkal: Rp 13.475.000 (potongan Rp 750.000)
- Setelah potongan: Rp 12.725.000
- SPP per bulan: Rp 900.000

Kategori KHUSUS:
- Uang Pangkal: Rp 6.737.500
- SPP per bulan: Rp 475.000

Jenjang TK B:
Kategori DALAM:
- SPP per bulan: Rp 900.000

Kategori LUAR:
- Uang Pangkal: Rp 10.750.000
- SPP per bulan: Rp 900.000

Kategori KHUSUS:
- SPP per bulan: Rp 475.000

CATATAN:
- Pembayaran dapat dilakukan secara bertahap
- Potongan harga berlaku untuk pendaftaran sebelum 30 Juni 2025
- Uang Pangkal KB Paket sampai TK B tidak termasuk seragam TK A
"""
    },
    
    {
        'filename': 'SK_Biaya_SD_Pulogadung_2024-2025.pdf',
        'content': """
Surat Keputusan Yayasan Pesantren Islam Al Azhar Nomor 445/VIII/KEP/YPIA-P/2024
tentang Biaya Pendidikan SD Islam Al Azhar 15 Pulogadung Tahun Ajaran 2024/2025.

Ditetapkan di Jakarta pada tanggal 15 Juli 2024, berlaku mulai 1 Agustus 2024.

RINCIAN BIAYA SD PULOGADUNG:

KELAS 1 (Siswa Baru):
Kategori REGULER:
- Uang Pangkal: Rp 25.000.000
- SPP per bulan: Rp 2.500.000
- Uang Kegiatan: Rp 3.000.000 (per tahun)
- Uang Seragam: Rp 2.000.000

Kategori PRESTASI (beasiswa 50%):
- Uang Pangkal: Rp 12.500.000
- SPP per bulan: Rp 1.250.000
- Uang Kegiatan: Rp 1.500.000 (per tahun)
- Uang Seragam: Rp 2.000.000

KELAS 2-6 (Siswa Lama):
- Tidak ada Uang Pangkal
- SPP per bulan: Rp 2.500.000
- Uang Kegiatan: Rp 3.000.000 (per tahun)

FASILITAS TERMASUK:
- Buku pelajaran
- Seragam lengkap (4 stel)
- Field trip 2x per tahun
- Ekstrakurikuler gratis (pilih 2)

CARA PEMBAYARAN:
- Uang Pangkal: Lunas saat pendaftaran
- SPP: Dibayar setiap tanggal 1-10
- Uang Kegiatan: Dapat dicicil 2x (Juli & Januari)

KETENTUAN TAMBAHAN:
- Diskon 10% untuk anak ke-2 dan seterusnya
- Diskon 5% untuk pembayaran SPP 1 tahun penuh
- Gratis seragam untuk siswa berprestasi akademik & non-akademik
"""
    },
    
    {
        'filename': 'SK_Biaya_SMP_Bogor_2025.pdf',
        'content': """
Keputusan Pengurus YPI Al Azhar Nomor 678/IX/KEP/YPIA-P/2025
tentang Penetapan Biaya Pendidikan SMP Islam Al Azhar 5 Bogor
Tahun Pelajaran 2025/2026.

Ditetapkan pada tanggal 1 Agustus 2025, berlaku mulai 15 Agustus 2025.

RINCIAN BIAYA SMP BOGOR:

KELAS 7 (Siswa Baru):
Jalur REGULER:
- Uang Pangkal: Rp 30.000.000
- SPP per bulan: Rp 3.000.000
- Uang Seragam & Buku: Rp 4.500.000
- Uang Kegiatan Tahunan: Rp 5.000.000

Jalur PRESTASI (nilai rata-rata ≥85):
- Uang Pangkal: Rp 15.000.000 (diskon 50%)
- SPP per bulan: Rp 2.250.000 (diskon 25%)
- Uang Seragam & Buku: Rp 4.500.000
- Uang Kegiatan Tahunan: Rp 5.000.000

Jalur UNGGULAN (nilai rata-rata ≥90):
- Uang Pangkal: Gratis
- SPP per bulan: Rp 1.500.000 (diskon 50%)
- Uang Seragam & Buku: Rp 2.250.000 (diskon 50%)
- Uang Kegiatan Tahunan: Rp 2.500.000 (diskon 50%)

KELAS 8-9 (Siswa Lama):
- Tidak ada Uang Pangkal
- SPP per bulan: Rp 3.000.000
- Uang Kegiatan Tahunan: Rp 5.000.000

PROGRAM BEASISWA:
1. Beasiswa Akademik (nilai rata-rata ≥90):
   - Gratis SPP penuh 1 tahun
   
2. Beasiswa Hafidz Quran (hafal min. 5 juz):
   - Diskon SPP 50%
   
3. Beasiswa Prestasi Non-Akademik (juara tingkat nasional):
   - Diskon SPP 30%

FASILITAS:
- Laptop untuk pembelajaran
- Tablet untuk Al-Quran digital
- Akses perpustakaan digital
- Lab komputer & sains modern
- Asrama (opsional, Rp 2.000.000/bulan)

KETENTUAN PEMBAYARAN:
- Cicilan Uang Pangkal: max 3x (0% bunga)
- SPP: dibayar sebelum tanggal 10 setiap bulan
- Denda keterlambatan: Rp 100.000/hari
"""
    },
    
    {
        'filename': 'SK_Biaya_SMK_Kelapa_Gading_2024-2025.pdf',
        'content': """
Surat Keputusan YPI Al Azhar Nomor 890/X/KEP/YPIA-P/2024
tentang Biaya Pendidikan SMK Islam Al Azhar Kelapa Gading
Tahun Ajaran 2024/2025.

Ditetapkan di Jakarta pada 20 Juni 2024, berlaku mulai 1 Juli 2024.

RINCIAN BIAYA SMK KELAPA GADING:

Program Keahlian:
1. Teknik Komputer dan Jaringan (TKJ)
2. Multimedia (MM)
3. Rekayasa Perangkat Lunak (RPL)
4. Akuntansi dan Keuangan Lembaga (AKL)

KELAS 10 (Siswa Baru):
Jalur REGULER:
- Uang Pangkal: Rp 35.000.000
- SPP per bulan: Rp 3.500.000
- Uang Praktikum: Rp 7.500.000 (per tahun)
- Uang Seragam & Alat: Rp 5.000.000

Jalur BEASISWA PRESTASI:
- Uang Pangkal: Rp 17.500.000 (diskon 50%)
- SPP per bulan: Rp 2.625.000 (diskon 25%)
- Uang Praktikum: Rp 5.625.000 (diskon 25%)
- Uang Seragam & Alat: Rp 5.000.000

Jalur KEMITRAAN INDUSTRI (terbatas):
- Uang Pangkal: Rp 10.000.000
- SPP per bulan: Gratis (ditanggung mitra)
- Uang Praktikum: Gratis (ditanggung mitra)
- Uang Seragam & Alat: Rp 5.000.000
- Catatan: Wajib bekerja di perusahaan mitra min. 2 tahun setelah lulus

KELAS 11-12 (Siswa Lama):
- Tidak ada Uang Pangkal
- SPP per bulan: Rp 3.500.000
- Uang Praktikum: Rp 7.500.000 (per tahun)

BIAYA PKL (Praktik Kerja Lapangan):
- Kelas 11: Rp 2.000.000 (3 bulan)
- Sudah termasuk transportasi, makan, dan asuransi

BIAYA UJI KOMPETENSI:
- Kelas 12: Rp 3.000.000
- Sertifikasi profesi dari BNSP

FASILITAS:
- Laptop pribadi (spesifikasi sesuai jurusan)
- Software lisensi resmi
- Lab praktikum modern
- Internet unlimited
- Asrama (opsional, Rp 2.500.000/bulan)

PROGRAM UNGGULAN:
- Magang di perusahaan IT/keuangan terkemuka
- Sertifikasi internasional (CISCO, Microsoft, SAP)
- Kelas kewirausahaan
- Inkubasi bisnis startup

KETENTUAN:
- Diskon 15% untuk pembayaran lunas 1 tahun
- Diskon 10% untuk anak ke-2 dari keluarga yang sama
- Beasiswa penuh untuk siswa berprestasi luar biasa (seleksi ketat)
"""
    },
    
    {
        'filename': 'Panduan_PPDB_SMA_2025.pdf',
        'content': """
PANDUAN PENERIMAAN PESERTA DIDIK BARU (PPDB)
SMA ISLAM AL AZHAR JAKARTA
TAHUN PELAJARAN 2025/2026

JADWAL PPDB:
- Pendaftaran Online: 1 Mei - 30 Juni 2025
- Tes Seleksi: 5-10 Juli 2025
- Pengumuman: 15 Juli 2025
- Daftar Ulang: 20-25 Juli 2025
- Masa Orientasi: 1-5 Agustus 2025
- Mulai Pembelajaran: 10 Agustus 2025

JALUR PENERIMAAN:

1. JALUR PRESTASI AKADEMIK (40% kuota)
   Persyaratan:
   - Nilai rata-rata rapor SMP ≥85
   - Peringkat 10 besar di sekolah asal
   - Sertifikat prestasi akademik (jika ada)
   
   Biaya:
   - Uang Pangkal: Rp 28.000.000 (diskon 30%)
   - SPP per bulan: Rp 3.200.000

2. JALUR PRESTASI NON-AKADEMIK (20% kuota)
   Persyaratan:
   - Juara kompetisi tingkat kabupaten/kota minimal
   - Nilai rata-rata rapor SMP ≥75
   - Sertifikat prestasi asli
   
   Biaya:
   - Uang Pangkal: Rp 32.000.000 (diskon 20%)
   - SPP per bulan: Rp 3.200.000

3. JALUR REGULER (40% kuota)
   Persyaratan:
   - Nilai rata-rata rapor SMP ≥70
   - Lulus tes seleksi akademik
   
   Biaya:
   - Uang Pangkal: Rp 40.000.000
   - SPP per bulan: Rp 3.500.000

BIAYA TAMBAHAN (Semua Jalur):
- Uang Kegiatan Tahunan: Rp 6.000.000
- Uang Seragam & Buku: Rp 5.500.000
- Uang Lab & Praktikum: Rp 4.000.000

DOKUMEN YANG DIPERLUKAN:
1. Formulir pendaftaran online (sudah diisi lengkap)
2. Fotokopi ijazah/SKHUN SMP (legalisir)
3. Fotokopi rapor SMP kelas 7-9 (legalisir)
4. Fotokopi Akta Kelahiran
5. Fotokopi Kartu Keluarga
6. Pas foto 3x4 (5 lembar, background merah)
7. Surat keterangan sehat dari dokter
8. Sertifikat prestasi (jika ada)
9. Surat rekomendasi dari kepala sekolah SMP

TES SELEKSI:
1. Tes Akademik:
   - Matematika (90 menit)
   - Bahasa Indonesia (60 menit)
   - Bahasa Inggris (60 menit)
   - IPA (90 menit)

2. Tes Psikologi (120 menit)

3. Tes Baca Al-Quran (15 menit)

4. Wawancara dengan orang tua (30 menit)

PROGRAM BEASISWA:
1. Beasiswa Penuh (100%):
   - Untuk siswa berprestasi luar biasa
   - Seleksi sangat ketat (max 5 siswa)
   
2. Beasiswa 75%:
   - Juara OSN/KSN tingkat nasional
   
3. Beasiswa 50%:
   - Juara OSN/KSN tingkat provinsi
   - Hafidz Quran min. 10 juz

KONTAK INFORMASI:
- Website: www.alazhar-ppdb.sch.id
- Email: ppdb@alazhar.sch.id
- WhatsApp: 0812-3456-7890
- Hotline: (021) 5555-6666

CATATAN PENTING:
- Pendaftaran online tidak dipungut biaya
- Biaya tes seleksi: Rp 500.000 (non-refundable)
- Bukti pembayaran tes harap dibawa saat ujian
- Informasi lebih lanjut: kunjungi website resmi
"""
    }
]


# ============================================================================
# MAIN PIPELINE
# ============================================================================

def main():
    print("\n" + "="*80)
    print("🚀 FULL PIPELINE TEST - METADATA-AWARE RAG")
    print("="*80)
    
    # ========================================================================
    # STEP 1: Initialize Components
    # ========================================================================
    print("\n📦 STEP 1: Initializing Components...")
    
    # Metadata Extractor
    session = SessionLocal()
    master_repo = MasterRepository(session)
    extractor = MetadataExtractor(master_repo)
    print("   ✅ Metadata Extractor")
    
    # Query Parser
    parser = QueryParser(extractor)
    print("   ✅ Query Parser")
    
    # Chunker
    chunker = EnhancedChunker(
        config_path="config/config.yaml"
    )
 
    print("   ✅ Enhanced Chunker")
    
    # Document Processor
    processor = DocumentProcessor(
        chunker=chunker,
        metadata_extractor=extractor
    )
    print("   ✅ Document Processor")
    
    # Embeddings
    embedding_manager = EmbeddingManager(
        model_type=EmbeddingModel.OPENAI,
        config={'model_name': 'text-embedding-3-small'}
    )
    embeddings = embedding_manager.get_embeddings()
    print("   ✅ Embeddings (OpenAI)")
    
    # LLM
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0
    )
    print("   ✅ LLM (GPT-4o-mini)")
    
    # ========================================================================
    # STEP 2: Process Documents
    # ========================================================================
    print("\n" + "="*80)
    print("📚 STEP 2: Processing Documents with Metadata")
    print("="*80)
    
    all_chunks = processor.process_multiple_documents(SAMPLE_DOCUMENTS)
    serializable_chunks = []
    for doc in all_chunks:
        serializable_chunks.append({
            "content": getattr(doc, "page_content", ""),  # fallback ke "" kalau atribut ga ada
            "metadata": {k: str(v) for k, v in doc.metadata.items()}  # convert semua value ke str
        })

    with open("all_chunks.json", "w", encoding="utf-8") as f:
        json.dump(serializable_chunks, f, ensure_ascii=False, indent=4)

    print("📝 Saved all chunks to 'all_chunks.json'")


    print("   📄 File 'all_chunks.json' berhasil dibuat!")
    print("   ✅ Documents processed and chunked with metadata")
    print(f"\n✅ Total chunks created: {len(all_chunks)}")
    
    # ========================================================================
    # STEP 3: Create Vector Store
    # ========================================================================
    print("\n" + "="*80)
    print("🗄️ STEP 3: Creating Vector Store (ChromaDB)")
    print("="*80)
    
    # Clear existing
    import shutil
    chroma_dir = "./chroma_db"
    if os.path.exists(chroma_dir):
        shutil.rmtree(chroma_dir)
        print(f"   🗑️ Cleared existing: {chroma_dir}")
    
    # Create new
    vectorstore = Chroma.from_documents(
        documents=all_chunks,
        embedding=embeddings,
        collection_name="ypi_knowledge_base",
        persist_directory=chroma_dir
    )
    
    print(f"   ✅ Vector store created")
    print(f"   📊 Total vectors: {vectorstore._collection.count()}")
    
    # ========================================================================
    # STEP 4: Create Smart Retriever
    # ========================================================================
    print("\n" + "="*80)
    print("🔍 STEP 4: Creating Smart Retriever")
    print("="*80)
    
    smart_retriever = SmartRetriever(
        vectorstore=vectorstore,
        query_parser=parser,
        top_k=3,
        use_hybrid=False  # Simplified for test
    )
    
    print("   ✅ Smart Retriever ready")
    
    # Show available metadata
    available = smart_retriever.get_available_metadata()
    print("\n   📊 Available Metadata:")
    for key, values in available.items():
        print(f"      {key}: {values}")
    
    # ========================================================================
    # STEP 5: Test Queries
    # ========================================================================
    print("\n" + "="*80)
    print("💬 STEP 5: Testing Queries")
    print("="*80)
    
    # Query prompts
    system_prompt = """
ATURAN UTAMA:
1. Jawab HANYA dalam BAHASA INDONESIA
2. WAJIB sebutkan JENJANG, CABANG, dan TAHUN dari dokumen
3. Jika ada filter metadata di dokumen, prioritaskan yang sesuai

Anda adalah asisten YPI Al-Azhar yang membantu memberikan informasi.
"""
    
    query_prompt = """
Pertanyaan: {question}

Konteks dari dokumen:
{context}

ATURAN MENJAWAB:
1. Jawab dalam Bahasa Indonesia
2. Sebutkan jenjang, cabang, dan tahun dari dokumen
3. Jika ada beberapa dokumen dengan info berbeda, sebutkan semua
4. Format yang jelas dan mudah dibaca

Jawaban:
"""
    
    # Create query chain
    query_chain = EnhancedQueryChain(
        smart_retriever=smart_retriever,
        llm=llm,
        system_prompt=system_prompt,
        query_prompt=query_prompt
    )
    
    # Test queries
    test_queries = [
        "Berapa biaya TK di Cibinong?",
        "Berapa biaya SD di Pulogadung?",
        "Berapa SPP SMP di Bogor?",
        "Berapa biaya SMK di Kelapa Gading?",
        "Bagaimana cara daftar SMA?",
        "Berapa biaya TK tahun 2025?",
        "Ada beasiswa untuk SD Pulogadung?"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n{'='*80}")
        print(f"❓ Query {i}: {query}")
        print("="*80)
        
        result = query_chain.query(query)
        
        print(f"\n💡 Jawaban:")
        print(result['answer'])
        
        print(f"\n📚 Sources ({len(result['sources'])}):")
        for j, src in enumerate(result['sources'], 1):
            print(f"   {j}. {src['jenjang']} - {src['cabang']} - {src['tahun']}")
        
        print()
    
    # ========================================================================
    # STEP 6: Test Manual Filtering
    # ========================================================================
    print("\n" + "="*80)
    print("🔬 STEP 6: Testing Manual Metadata Filtering")
    print("="*80)
    
    # Test specific metadata queries
    print("\n📋 Test: Retrieve all SD documents")
    sd_docs = smart_retriever.retrieve_by_metadata(jenjang='SD', limit=5)
    print(f"   Found {len(sd_docs)} SD documents")
    
    print("\n📋 Test: Retrieve all Cibinong documents")
    cibinong_docs = smart_retriever.retrieve_by_metadata(cabang='Cibinong', limit=5)
    print(f"   Found {len(cibinong_docs)} Cibinong documents")
    
    print("\n📋 Test: Retrieve TK + Cibinong")
    tk_cibinong = smart_retriever.retrieve_by_metadata(
        jenjang='TK',
        cabang='Cibinong',
        limit=5
    )
    print(f"   Found {len(tk_cibinong)} TK Cibinong documents")
    
    # ========================================================================
    # SUMMARY
    # ========================================================================
    print("\n" + "="*80)
    print("✅ PIPELINE TEST COMPLETED!")
    print("="*80)
    print(f"📊 Statistics:")
    print(f"   Documents processed: {len(SAMPLE_DOCUMENTS)}")
    print(f"   Total chunks: {len(all_chunks)}")
    print(f"   Queries tested: {len(test_queries)}")
    print(f"   Vector DB: {chroma_dir}")
    print("="*80)


if __name__ == "__main__":
    main()