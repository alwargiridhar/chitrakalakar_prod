#!/usr/bin/env python3
"""
ChitraKalakar Backend API Testing Script
Tests the public API endpoints and user endpoints as requested.
"""

import requests
import json
import sys
from typing import Dict, Any

# Backend URL - Using localhost as external URL appears to have routing issues
BACKEND_URL = "http://localhost:8001"

class APITester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, endpoint: str, status: str, message: str, response_data: Any = None):
        """Log test results"""
        result = {
            "endpoint": endpoint,
            "status": status,
            "message": message,
            "response_data": response_data
        }
        self.test_results.append(result)
        print(f"[{status}] {endpoint}: {message}")
        
    def test_health_check(self):
        """Test GET /api/health"""
        try:
            response = self.session.get(f"{self.base_url}/api/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log_test("/api/health", "PASS", "Health check successful", data)
                    return True
                else:
                    self.log_test("/api/health", "FAIL", f"Invalid health response: {data}")
                    return False
            else:
                self.log_test("/api/health", "FAIL", f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("/api/health", "ERROR", f"Request failed: {str(e)}")
            return False
    
    def test_public_paintings(self):
        """Test GET /api/public/paintings"""
        try:
            response = self.session.get(f"{self.base_url}/api/public/paintings", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "paintings" in data and isinstance(data["paintings"], list):
                    # Check that no contact info is exposed
                    for painting in data["paintings"]:
                        if "users" in painting:
                            user_data = painting["users"]
                            if "phone" in user_data or "email" in user_data:
                                self.log_test("/api/public/paintings", "FAIL", "Contact info exposed in public paintings")
                                return False
                    
                    self.log_test("/api/public/paintings", "PASS", f"Retrieved {len(data['paintings'])} paintings without contact info", {"count": len(data["paintings"])})
                    return True
                else:
                    self.log_test("/api/public/paintings", "FAIL", f"Invalid response structure: {data}")
                    return False
            else:
                self.log_test("/api/public/paintings", "FAIL", f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("/api/public/paintings", "ERROR", f"Request failed: {str(e)}")
            return False
    
    def test_public_artists(self):
        """Test GET /api/public/artists"""
        try:
            response = self.session.get(f"{self.base_url}/api/public/artists", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "artists" in data and isinstance(data["artists"], list):
                    # Check that no contact info is exposed
                    for artist in data["artists"]:
                        if "phone" in artist or "email" in artist:
                            self.log_test("/api/public/artists", "FAIL", "Contact info exposed in public artists")
                            return False
                    
                    self.log_test("/api/public/artists", "PASS", f"Retrieved {len(data['artists'])} artists without contact info", {"count": len(data["artists"])})
                    return True
                else:
                    self.log_test("/api/public/artists", "FAIL", f"Invalid response structure: {data}")
                    return False
            else:
                self.log_test("/api/public/artists", "FAIL", f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("/api/public/artists", "ERROR", f"Request failed: {str(e)}")
            return False
    
    def test_public_artist_detail(self, artist_id: str = "test-artist-id"):
        """Test GET /api/public/artist/{id}"""
        try:
            response = self.session.get(f"{self.base_url}/api/public/artist/{artist_id}", timeout=10)
            
            if response.status_code == 404:
                self.log_test(f"/api/public/artist/{artist_id}", "PASS", "Correctly returns 404 for non-existent artist")
                return True
            elif response.status_code == 200:
                data = response.json()
                if "artist" in data and "artworks" in data:
                    artist = data["artist"]
                    # Check that no contact info is exposed
                    if "phone" in artist or "email" in artist:
                        self.log_test(f"/api/public/artist/{artist_id}", "FAIL", "Contact info exposed in artist detail")
                        return False
                    
                    self.log_test(f"/api/public/artist/{artist_id}", "PASS", f"Retrieved artist detail with {len(data['artworks'])} artworks, no contact info", data)
                    return True
                else:
                    self.log_test(f"/api/public/artist/{artist_id}", "FAIL", f"Invalid response structure: {data}")
                    return False
            else:
                self.log_test(f"/api/public/artist/{artist_id}", "FAIL", f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(f"/api/public/artist/{artist_id}", "ERROR", f"Request failed: {str(e)}")
            return False
    
    def test_painting_detail(self, painting_id: str = "test-painting-id"):
        """Test GET /api/public/painting/{id}"""
        try:
            response = self.session.get(f"{self.base_url}/api/public/painting/{painting_id}", timeout=10)
            
            if response.status_code == 404:
                self.log_test(f"/api/public/painting/{painting_id}", "PASS", "Correctly returns 404 for non-existent painting")
                return True
            elif response.status_code == 200:
                data = response.json()
                if "painting" in data:
                    painting = data["painting"]
                    # Check that no contact info is exposed in artist data
                    if "users" in painting:
                        user_data = painting["users"]
                        if "phone" in user_data or "email" in user_data:
                            self.log_test(f"/api/public/painting/{painting_id}", "FAIL", "Contact info exposed in painting detail")
                            return False
                    
                    self.log_test(f"/api/public/painting/{painting_id}", "PASS", "Retrieved painting detail with artist info, no contact info", data)
                    return True
                else:
                    self.log_test(f"/api/public/painting/{painting_id}", "FAIL", f"Invalid response structure: {data}")
                    return False
            else:
                self.log_test(f"/api/public/painting/{painting_id}", "FAIL", f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(f"/api/public/painting/{painting_id}", "ERROR", f"Request failed: {str(e)}")
            return False
    
    def test_user_enquiries_without_auth(self):
        """Test GET /api/user/my-enquiries without authentication"""
        try:
            response = self.session.get(f"{self.base_url}/api/user/my-enquiries", timeout=10)
            
            if response.status_code == 401 or response.status_code == 403:
                self.log_test("/api/user/my-enquiries", "PASS", "Correctly requires authentication (401/403)")
                return True
            elif response.status_code == 422:
                self.log_test("/api/user/my-enquiries", "PASS", "Correctly requires authentication (422 - missing auth header)")
                return True
            else:
                self.log_test("/api/user/my-enquiries", "FAIL", f"Should require auth but got HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("/api/user/my-enquiries", "ERROR", f"Request failed: {str(e)}")
            return False
    
    def test_featured_artists(self):
        """Test GET /api/public/featured-artists"""
        try:
            response = self.session.get(f"{self.base_url}/api/public/featured-artists", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "contemporary" in data and "registered" in data:
                    self.log_test("/api/public/featured-artists", "PASS", f"Retrieved featured artists - Contemporary: {len(data['contemporary'])}, Registered: {len(data['registered'])}", data)
                    return True
                else:
                    self.log_test("/api/public/featured-artists", "FAIL", f"Invalid response structure: {data}")
                    return False
            else:
                self.log_test("/api/public/featured-artists", "FAIL", f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("/api/public/featured-artists", "ERROR", f"Request failed: {str(e)}")
            return False
    
    def test_upload_url_without_auth(self):
        """Test POST /api/upload-url without authentication"""
        try:
            payload = {
                "filename": "test.jpg",
                "content_type": "image/jpeg", 
                "folder": "avatars"
            }
            response = self.session.post(f"{self.base_url}/api/upload-url", json=payload, timeout=10)
            
            if response.status_code == 401 or response.status_code == 403:
                self.log_test("/api/upload-url", "PASS", "Correctly requires authentication (401/403)")
                return True
            elif response.status_code == 422:
                self.log_test("/api/upload-url", "PASS", "Correctly requires authentication (422 - missing auth header)")
                return True
            else:
                self.log_test("/api/upload-url", "FAIL", f"Should require auth but got HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("/api/upload-url", "ERROR", f"Request failed: {str(e)}")
            return False
    
    def test_profile_update_without_auth(self):
        """Test PUT /api/auth/profile without authentication"""
        try:
            payload = {
                "full_name": "Test User",
                "bio": "Test bio"
            }
            response = self.session.put(f"{self.base_url}/api/auth/profile", json=payload, timeout=10)
            
            if response.status_code == 401 or response.status_code == 403:
                self.log_test("/api/auth/profile", "PASS", "Correctly requires authentication (401/403)")
                return True
            elif response.status_code == 422:
                self.log_test("/api/auth/profile", "PASS", "Correctly requires authentication (422 - missing auth header)")
                return True
            else:
                self.log_test("/api/auth/profile", "FAIL", f"Should require auth but got HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("/api/auth/profile", "ERROR", f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all API tests"""
        print(f"Starting ChitraKalakar API Tests against: {self.base_url}")
        print("=" * 60)
        
        tests = [
            ("Health Check", self.test_health_check),
            ("Public Paintings API", self.test_public_paintings),
            ("Public Artists API", self.test_public_artists),
            ("Public Featured Artists API", self.test_featured_artists),
            ("Public Artist Detail API", self.test_public_artist_detail),
            ("Painting Detail API", self.test_painting_detail),
            ("User Enquiries API (Auth Required)", self.test_user_enquiries_without_auth),
            ("Upload URL API (Auth Required)", self.test_upload_url_without_auth),
            ("Profile Update API (Auth Required)", self.test_profile_update_without_auth),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n--- Testing {test_name} ---")
            if test_func():
                passed += 1
        
        print("\n" + "=" * 60)
        print(f"TEST SUMMARY: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ ALL TESTS PASSED")
            return True
        else:
            print("❌ SOME TESTS FAILED")
            return False

def main():
    """Main test execution"""
    tester = APITester(BACKEND_URL)
    success = tester.run_all_tests()
    
    # Print detailed results
    print("\n" + "=" * 60)
    print("DETAILED TEST RESULTS:")
    print("=" * 60)
    
    for result in tester.test_results:
        print(f"\nEndpoint: {result['endpoint']}")
        print(f"Status: {result['status']}")
        print(f"Message: {result['message']}")
        if result['response_data'] and result['status'] == 'PASS':
            print(f"Response: {json.dumps(result['response_data'], indent=2)[:200]}...")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())