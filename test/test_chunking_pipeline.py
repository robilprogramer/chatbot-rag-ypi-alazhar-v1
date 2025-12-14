# ============================================================================
# FILE: tests/test_chunking_pipeline.py
# ============================================================================
"""
Integration Test:
EnhancedChunker + MetadataExtractor + DocumentProcessor
"""
import sys
import os

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)
from utils.enhanced_chunker import EnhancedChunker
from utils.metadata_extractor import MetadataExtractor
from utils.enhanced_chunker import DocumentProcessor
from utils.db import SessionLocal
from repositories.master_repository import MasterRepository

def run_chunking_test():
    print("=" * 80)
    print("🧪 STARTING CHUNKING PIPELINE TEST")
    print("=" * 80)

    # ---------------------------------------------------------------------
    # SAMPLE DOCUMENTS
    # ---------------------------------------------------------------------
    sample_docs = [
        {
            'filename': 'SK_Biaya_TK_Cibinong_2025.pdf',
            'content': """
            Keputusan Pengurus Yayasan Pesantren Islam (YPI) Al Azhar Nomor 223
            menetapkan Uang Pangkal (UP) dan Uang Sekolah (SPP) untuk TK Islam 
            Al Azhar 27 Cibinong Tahun Pelajaran 2026/2027.
            
            Untuk jenjang Toddler, Uang Pangkal sebesar Rp 5.500.000 tanpa potongan,
            dan SPP per bulan sebesar Rp 625.000.
            
            Pada jenjang KB (Kelompok Bermain), kategori Dalam memiliki Uang Pangkal 
            Rp 6.500.000 tanpa potongan, SPP Rp 750.000.
            """
        },
        {
            'filename': 'SK_Biaya_SD_Pulogadung_2025.pdf',
            'content': """
            Surat Keputusan YPI Al Azhar tentang biaya SD Islam Al Azhar 15 Pulogadung
            untuk Tahun Ajaran 2025/2026.
            
            Uang Pangkal untuk kelas 1: Rp 25.000.000
            SPP per bulan: Rp 2.500.000
            
            Uang Pangkal untuk kelas 2-6: Rp 15.000.000
            SPP per bulan: Rp 2.500.000
            """
        },
        {
            'filename': 'SK_Biaya_SMP_Bogor_2025.pdf',
            'content': """
            Keputusan tentang biaya SMP Islam Al Azhar Bogor Tahun Pelajaran 2025/2026.
            
            Uang Pangkal kelas 7: Rp 30.000.000
            SPP per bulan: Rp 3.000.000
            
            Untuk kelas 8-9, tidak ada uang pangkal.
            SPP per bulan: Rp 3.000.000
            """
        }
    ]
    

    # ---------------------------------------------------------------------
    # INITIALIZE PIPELINE
    # ---------------------------------------------------------------------
    chunker = EnhancedChunker(
        config_path="config/config.yaml"
    )
    session = SessionLocal()
    master_repo = MasterRepository(session)
    extractor = MetadataExtractor(master_repo)
    processor = DocumentProcessor(
        chunker=chunker,
        metadata_extractor=extractor
    )

    # ---------------------------------------------------------------------
    # PROCESS DOCUMENTS
    # ---------------------------------------------------------------------
    all_chunks = processor.process_multiple_documents(sample_docs)
   
    # ---------------------------------------------------------------------
    # OUTPUT SAMPLE CHUNKS
    # ---------------------------------------------------------------------
    print("\n🔍 SAMPLE CHUNKS:")
    print("=" * 80)

    for i, chunk in enumerate(all_chunks[:3]):
        print(f"\nChunk {i + 1}:")
        print("-" * 40)
        print(f"Content (preview): {chunk.page_content[:100]}...")
        print("Metadata:")
        for k, v in chunk.metadata.items():
            print(f"  {k}: {v}")

    # ------------------------------------------------------------------
if __name__ == "__main__":
    run_chunking_test()
