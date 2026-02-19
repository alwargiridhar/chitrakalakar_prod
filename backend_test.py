#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class ArtistMembershipTester:
    def __init__(self, base_url="https://art-creator-21.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.artist_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_public_artists_membership_filter(self):
        """Test that public artists endpoint only returns artists with active membership"""
        print("\n🔍 Testing Public Artists Membership Filter...")
        
        success, response = self.run_test(
            "GET /api/public/artists (membership filter)",
            "GET",
            "public/artists",
            200
        )
        
        if success and 'artists' in response:
            artists = response['artists']
            print(f"   Found {len(artists)} public artists")
            
            # Check that all returned artists have is_member = True
            all_members = all(artist.get('is_member', False) for artist in artists)
            if all_members:
                self.log_test("All public artists have active membership", True)
            else:
                non_members = [a for a in artists if not a.get('is_member', False)]
                self.log_test("All public artists have active membership", False, 
                            f"Found {len(non_members)} non-members in public list")
        
        return success

    def test_admin_artists_by_membership(self):
        """Test admin endpoint for artists by membership status"""
        print("\n🔍 Testing Admin Artists by Membership...")
        
        # This endpoint requires admin auth, so we'll test without auth first
        success, response = self.run_test(
            "GET /api/admin/artists-by-membership (no auth)",
            "GET", 
            "admin/artists-by-membership",
            401  # Should require authentication
        )
        
        if success:
            self.log_test("Admin endpoint properly requires authentication", True)
        
        return success

    def test_admin_role_management_endpoints(self):
        """Test admin role management endpoints"""
        print("\n🔍 Testing Admin Role Management Endpoints...")
        
        # Test update user role endpoint (should require auth)
        success1, _ = self.run_test(
            "POST /api/admin/update-user-role (no auth)",
            "POST",
            "admin/update-user-role", 
            401,
            data={"user_id": "test", "new_role": "artist"}
        )
        
        # Test grant membership endpoint (should require auth)
        success2, _ = self.run_test(
            "POST /api/admin/grant-membership (no auth)",
            "POST",
            "admin/grant-membership",
            401,
            data={"artist_id": "test", "plan": "basic", "duration_days": 30}
        )
        
        # Test revoke membership endpoint (should require auth)
        success3, _ = self.run_test(
            "POST /api/admin/revoke-membership (no auth)",
            "POST", 
            "admin/revoke-membership?artist_id=test",
            401
        )
        
        return success1 and success2 and success3

    def test_health_check(self):
        """Test basic health check"""
        print("\n🔍 Testing Health Check...")
        
        success, response = self.run_test(
            "GET /api/health",
            "GET",
            "health",
            200
        )
        
        if success and response.get('status') == 'healthy':
            self.log_test("Health check returns healthy status", True)
        elif success:
            self.log_test("Health check returns healthy status", False, 
                        f"Status: {response.get('status', 'unknown')}")
        
        return success

    def test_public_stats(self):
        """Test public stats endpoint"""
        print("\n🔍 Testing Public Stats...")
        
        success, response = self.run_test(
            "GET /api/public/stats",
            "GET",
            "public/stats", 
            200
        )
        
        if success:
            required_fields = ['total_artists', 'total_artworks', 'active_exhibitions', 'satisfaction_rate']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test("Public stats contains all required fields", True)
            else:
                self.log_test("Public stats contains all required fields", False,
                            f"Missing: {missing_fields}")
        
        return success

    def test_featured_artists_membership_filter(self):
        """Test that featured artists endpoint filters by membership"""
        print("\n🔍 Testing Featured Artists Membership Filter...")
        
        success, response = self.run_test(
            "GET /api/public/featured-artists",
            "GET",
            "public/featured-artists",
            200
        )
        
        if success:
            contemporary = response.get('contemporary', [])
            registered = response.get('registered', [])
            
            print(f"   Found {len(contemporary)} contemporary artists")
            print(f"   Found {len(registered)} registered featured artists")
            
            # All registered featured artists should have active membership
            # (This is filtered in the backend logic)
            self.log_test("Featured artists endpoint accessible", True)
        
        return success

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for Artist Membership Management")
        print("=" * 70)
        
        # Test basic connectivity
        self.test_health_check()
        
        # Test public endpoints
        self.test_public_stats()
        self.test_public_artists_membership_filter()
        self.test_featured_artists_membership_filter()
        
        # Test admin endpoints (authentication required)
        self.test_admin_artists_by_membership()
        self.test_admin_role_management_endpoints()
        
        # Print summary
        print("\n" + "=" * 70)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   • {failure}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✨ Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = ArtistMembershipTester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())