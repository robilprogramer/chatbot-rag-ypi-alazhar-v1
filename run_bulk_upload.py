
# ============================================================================
# EXAMPLE 1: Process Document dengan Enhanced Service
# ============================================================================

import asyncio
from pathlib import Path
async def example_process_document():
    """
    Example: Upload dan process document
    """
    print("\n" + "="*60)
    print("EXAMPLE 1: Process Document")
    print("="*60)
    
    from sqlalchemy.orm import Session
    from utils.db import SessionLocal
    from services.document_service_enhanced import EnhancedDocumentService
    from fastapi import UploadFile
    
    # Setup
    db = SessionLocal()
    service = EnhancedDocumentService(db)
    
    # Simulate file upload
    pdf_path = Path("CS-v2.pdf")
    
    if not pdf_path.exists():
        print("⚠️ Sample PDF not found")
        return
    
    # Create UploadFile mock
    with open(pdf_path, "rb") as f:
        from fastapi import UploadFile
        from io import BytesIO
        
        # Upload document
        print("\n1. Uploading document...")
        result = await service.upload_document(
            UploadFile(
                filename=pdf_path.name,
                file=BytesIO(f.read())
            )
        )
        
        print(f"✅ Document uploaded: ID={result['document_id']}")
        
        # Process document
        print("\n2. Processing document...")
        doc_id = result['document_id']
        
        process_result = service.process_document(
            document_id=doc_id,
            doc_type="AUTO"  # Will auto-detect
        )
        
        print(f"✅ Document processed!")
        print(f"   Type: {process_result['doc_type']}")
        print(f"   Pages: {process_result['total_pages']}")
        print(f"   Length: {process_result['text_length']} chars")
        
        # Get metadata
        print("\n3. Getting metadata...")
        metadata = service.get_document_metadata(doc_id)
        print(f"   Jenjang: {metadata['jenjang']}")
        print(f"   Cabang: {metadata['cabang']}")
        print(f"   Tahun: {metadata['tahun']}")
        print(f"   Kategori: {metadata['kategori']}")
    
    db.close()


# ============================================================================
# MAIN
# ============================================================================

def main():
    """
    Run all examples
    """
    print("\n" + "="*60)
    print("ENHANCED RAG SYSTEM - INTEGRATION EXAMPLES")
    print("="*60)
    
    # Note: Comment out examples you don't want to run

    # Example 1: Document Processing
    asyncio.run(example_process_document())
    
    # # Example 2: Query RAG
    # example_query_rag()
    
    # Example 3: Component Usage
    # example_component_usage()
    
    # Example 4: Custom Prompts
    # example_custom_prompts()
    
    # Example 5: Error Handling
    # example_error_handling()
    
    # Example 6: Batch Processing
    # example_batch_processing()
    
    print("\n" + "="*60)
    print("EXAMPLES COMPLETED")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
