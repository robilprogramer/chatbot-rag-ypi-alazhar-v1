import sys
import os
from sqlalchemy import text
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)
from utils.db import SessionLocal
from repositories.master_repository import MasterRepository
from utils.metadata_extractor import MetadataExtractor, QueryParser
# ============================================================================
# TESTING
# ============================================================================

def test_extract_from_filename(extractor):
    print("\n📁 TEST 1: Extract from Filename")
    test_files = [
        "SK_Biaya_TK_Cibinong_2025.pdf",
        "Biaya_SD_Pulogadung_2024-2025.pdf",
        "Panduan_PPDB_SMP_Kelapa_Gading_2025.pdf",
        "SK_223_TK_Islam_Al_Azhar_27_Cibinong_2026.pdf"
    ]
    
    for fname in test_files:
        meta = extractor.extract_from_filename(fname)
        print(f"\n{fname}")
        for k, v in meta.items():
            print(f"  {k}: {v}")
            
def test_extract_from_content(extractor):
    # # Test 2: Extract from content
    print("\n\n📄 TEST 2: Extract from Content")
    sample_content = """
    Keputusan Pengurus Yayasan Pesantren Islam (YPI) Al Azhar Nomor 223
    menetapkan Uang Pangkal (UP) dan Uang Sekolah (SPP) untuk TK Islam 
    Al Azhar 27 Cibinong Tahun Pelajaran 2026/2027.
    """
    
    content_meta = extractor.extract_from_content(sample_content)
    print("\nContent Metadata:")
    for k, v in content_meta.items():
        print(f"  {k}: {v}")
            

if __name__ == "__main__":
    session = SessionLocal()
    master_repo = MasterRepository(session)
    extractor = MetadataExtractor(master_repo)
    parser = QueryParser(extractor)
    
    print("="*80)
    print("TESTING METADATA EXTRACTOR")
    print("="*80)
    
    # Test 1: Extract from filename
    # test_extract_from_filename(extractor)
    #test_extract_from_content(extractor)
    
   
    
    # # Test 3: Merge metadata
    # print("\n\n🔀 TEST 3: Merge Metadata")
    # sample_content = """
    # Keputusan Pengurus Yayasan Pesantren Islam (YPI) Al Azhar Nomor 223
    # menetapkan Uang Pangkal (UP) dan Uang Sekolah (SPP) untuk TK Islam 
    # Al Azhar 27 Cibinong Tahun Pelajaran 2026/2027.
    # """
    # merged = extractor.extract_full("SK_Biaya_TK_2025.pdf", sample_content)
    # print("\nMerged Metadata:")
    # for k, v in merged.items():
    #     print(f"  {k}: {v}")
    
    # # Test 4: Query Parser
    print("\n\n🔍 TEST 4: Query Parser")
    test_queries = [
        "Berapa biaya TK di Cibinong?",
        "Biaya SD Pulogadung tahun 2025",
        "SPP SMP tahun 2024/2025",
        "Panduan pendaftaran SMK Kelapa Gading"
    ]
    
    for query in test_queries:
        parsed = parser.parse_query(query)
        print(f"\n'{query}'")
        for k, v in parsed.items():
            if v:
                print(f"  {k}: {v}")
    
    print("\n" + "="*80)
    print("✅ TESTING COMPLETED")
    print("="*80)