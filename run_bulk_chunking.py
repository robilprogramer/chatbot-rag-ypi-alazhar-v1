from utils.db import SessionLocal
from services.bulk_chunking_service import BulkChunkingService

def main():
    db = SessionLocal()

    try:
        service = BulkChunkingService(
            db=db,
            base_url="http://localhost:8000/api/chunks"
        )
        service.process_all_documents(page_size=20)

    finally:
        db.close()


if __name__ == "__main__":
    main()
