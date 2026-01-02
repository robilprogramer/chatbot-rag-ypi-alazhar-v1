"""
Safe Database Initialization Script
TIDAK akan drop existing tables - hanya create jika belum ada
"""

from database import DatabaseManager, Base
from config import settings
from sqlalchemy import inspect
import sys


def check_database_exists(db_manager: DatabaseManager) -> bool:
    """Check apakah database sudah memiliki tables"""
    inspector = inspect(db_manager.engine)
    tables = inspector.get_table_names()
    return len(tables) > 0


def init_database(force: bool = False):
    """
    Initialize database safely
    
    Args:
        force: Jika True, akan DROP semua tables (HATI-HATI!)
    """
    
    print("=" * 60)
    print("YPI Al-Azhar Database Initialization")
    print("=" * 60)
    print(f"Database URL: {settings.DATABASE_URL}")
    print()
    
    db_manager = DatabaseManager(settings.DATABASE_URL)
    
    # Check existing tables
    if check_database_exists(db_manager):
        print("⚠️  Database already has existing tables!")
        print()
        
        if force:
            confirm = input("⚠️  WARNING: This will DELETE ALL DATA! Type 'DELETE ALL' to confirm: ")
            if confirm != "DELETE ALL":
                print("❌ Aborted. No changes made.")
                return
            
            print("🗑️  Dropping all tables...")
            db_manager.drop_tables()
            print("✓ All tables dropped")
        else:
            print("ℹ️  Use --force flag to drop existing tables (DANGEROUS!)")
            print("ℹ️  Creating only missing tables...")
    
    # Create tables
    print("📊 Creating database tables...")
    db_manager.create_tables()
    
    # Verify
    inspector = inspect(db_manager.engine)
    tables = inspector.get_table_names()
    
    print()
    print("✅ Database initialization complete!")
    print(f"📋 Tables created: {len(tables)}")
    for table in tables:
        print(f"   - {table}")
    print()
    print("=" * 60)


def create_sample_data():
    """Create sample/test data (optional)"""
    db_manager = DatabaseManager(settings.DATABASE_URL)
    
    print("Creating sample data...")
    
    # Example: Create a test registration
    try:
        registration_id = db_manager.save_registration(
            registration_number="AZHAR-2025-SD-TEST0001",
            student_data={
                "nama_lengkap": "Ahmad Test",
                "jenjang_tujuan": "SD",
                "cabang_tujuan": "Jakarta Pusat"
            },
            parent_data={
                "nama_ayah": "Budi Santoso",
                "nama_ibu": "Siti Rahayu"
            },
            academic_data={
                "nama_sekolah_asal": "TK Al-Ikhlas"
            },
            status="draft"
        )
        
        print(f"✓ Sample registration created (ID: {registration_id})")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Initialize YPI Al-Azhar Database")
    parser.add_argument(
        "--force", 
        action="store_true", 
        help="DANGER: Drop all existing tables before creating"
    )
    parser.add_argument(
        "--sample-data",
        action="store_true",
        help="Create sample/test data"
    )
    
    args = parser.parse_args()
    
    # Initialize database
    init_database(force=args.force)
    
    # Create sample data if requested
    if args.sample_data:
        create_sample_data()
