"""
Quick Test Script for Statistics API
Run this to verify your statistics API is working
"""

import requests
import json
from typing import Dict, Any

# Configuration
API_BASE_URL = "http://localhost:8000"

def print_section(title: str):
    """Print section header"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_json(data: Dict[str, Any]):
    """Pretty print JSON"""
    print(json.dumps(data, indent=2))

def test_health():
    """Test health check endpoint"""
    print_section("1. Testing Health Check")
    
    try:
        response = requests.get(f"{API_BASE_URL}/api/statistics/health")
        response.raise_for_status()
        
        data = response.json()
        print(f"✅ Status: {data.get('status')}")
        print(f"✅ Database: {data.get('database')}")
        print(f"✅ Vectorstore: {data.get('vectorstore')}")
        
        return True
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_all_statistics():
    """Test main statistics endpoint"""
    print_section("2. Testing All Statistics")
    
    try:
        response = requests.get(f"{API_BASE_URL}/api/statistics/")
        response.raise_for_status()
        
        data = response.json()
        
        if data.get("success"):
            stats = data.get("statistics", {})
            
            print("\n📊 Statistics Summary:")
            print(f"  Documents: {stats.get('documents', {}).get('total', 0)}")
            print(f"  Knowledge Entries: {stats.get('knowledge_entries', {}).get('active', 0)}")
            print(f"  Chunks: {stats.get('chunks', {}).get('total', 0)}")
            print(f"  Vectors: {stats.get('vectorstore', {}).get('total', 0)}")
            
            print("\n📈 Document Status:")
            for status, count in stats.get('documents', {}).get('by_status', {}).items():
                print(f"  {status}: {count}")
            
            print("\n🎓 Knowledge by Jenjang:")
            for jenjang, count in stats.get('knowledge_entries', {}).get('by_jenjang', {}).items():
                print(f"  {jenjang}: {count}")
            
            print("\n📚 Knowledge by Kategori:")
            for kategori, count in stats.get('knowledge_entries', {}).get('by_kategori', {}).items():
                print(f"  {kategori}: {count}")
            
            print("\n✅ All statistics retrieved successfully!")
            return True
        else:
            print(f"❌ API returned success=false")
            return False
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_document_statistics():
    """Test document statistics endpoint"""
    print_section("3. Testing Document Statistics")
    
    try:
        response = requests.get(f"{API_BASE_URL}/api/statistics/documents")
        response.raise_for_status()
        
        data = response.json()
        stats = data.get("statistics", {})
        
        print(f"Total Documents: {stats.get('total', 0)}")
        print("\nBy Status:")
        print_json(stats.get('by_status', {}))
        
        print("\n✅ Document statistics retrieved!")
        return True
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_chunk_statistics():
    """Test chunk statistics endpoint"""
    print_section("4. Testing Chunk Statistics")
    
    try:
        response = requests.get(f"{API_BASE_URL}/api/statistics/chunks")
        response.raise_for_status()
        
        data = response.json()
        stats = data.get("statistics", {})
        
        print(f"Total Chunks: {stats.get('total', 0)}")
        print(f"Embedded: {stats.get('embedded', 0)}")
        print(f"Pending: {stats.get('pending', 0)}")
        
        print("\n✅ Chunk statistics retrieved!")
        return True
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_vectorstore_statistics():
    """Test vectorstore statistics endpoint"""
    print_section("5. Testing Vectorstore Statistics")
    
    try:
        response = requests.get(f"{API_BASE_URL}/api/statistics/vectorstore")
        response.raise_for_status()
        
        data = response.json()
        stats = data.get("statistics", {})
        
        print(f"Total Vectors: {stats.get('total', 0)}")
        print("\nBy Jenjang:")
        print_json(stats.get('by_jenjang', {}))
        
        print("\n✅ Vectorstore statistics retrieved!")
        return True
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "🔥"*30)
    print("  STATISTICS API TEST SUITE")
    print("🔥"*30)
    
    print(f"\nTesting API at: {API_BASE_URL}")
    
    results = {
        "Health Check": test_health(),
        "All Statistics": test_all_statistics(),
        "Document Stats": test_document_statistics(),
        "Chunk Stats": test_chunk_statistics(),
        "Vectorstore Stats": test_vectorstore_statistics(),
    }
    
    # Summary
    print_section("Test Results Summary")
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    
    print(f"\nTotal: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("\n🎉 All tests passed! Statistics API is working correctly!")
    else:
        print("\n⚠️ Some tests failed. Check the errors above.")
        print("\nTroubleshooting:")
        print("1. Make sure backend server is running: uvicorn main:app --reload")
        print("2. Check if database is connected")
        print("3. Verify ChromaDB is initialized")
        print("4. Ensure you have processed some documents")

if __name__ == "__main__":
    main()