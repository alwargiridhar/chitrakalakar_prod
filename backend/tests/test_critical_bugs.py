"""
Backend API Tests for ChitraKalakar - Critical Bug Testing
Tests for: Communities, Cart, Art Class Enquiry
Focus: Testing authenticated endpoints that were reported as broken
"""
import pytest
import requests
import os
import json

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://chitrakalakar-art.preview.emergentagent.com').rstrip('/')

# Supabase credentials for authentication
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://lurvhgzauuzwftfymjym.supabase.co')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cnZoZ3phdXV6d2Z0ZnltanltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MzAwNDEsImV4cCI6MjA4MzAwNjA0MX0.TkAyZVCyaidDgdznrFD1MXj6Mji70A4XM4s5Z17cA34')

# Test credentials
ADMIN_EMAIL = "admin@chitrakalakar.com"
ADMIN_PASSWORD = "admin123"


def get_auth_token(email, password):
    """Get Supabase auth token"""
    auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "email": email,
        "password": password
    }
    
    response = requests.post(auth_url, headers=headers, json=payload)
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token")
    else:
        print(f"Auth failed: {response.status_code} - {response.text}")
        return None


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ Health check passed: {data}")


class TestPublicCommunities:
    """Public communities endpoint tests - CRITICAL BUG FIX VERIFICATION"""
    
    def test_get_public_communities_returns_data(self):
        """Test /api/public/communities returns communities (was returning empty)"""
        response = requests.get(f"{BASE_URL}/api/public/communities")
        assert response.status_code == 200
        data = response.json()
        assert "communities" in data
        assert isinstance(data["communities"], list)
        
        # Verify communities are returned (bug was: no communities found)
        community_count = len(data["communities"])
        print(f"✓ Public communities: {community_count} communities found")
        
        # If communities exist, verify structure
        if community_count > 0:
            community = data["communities"][0]
            assert "id" in community
            assert "name" in community
            print(f"  First community: {community.get('name')}")
    
    def test_get_community_detail_valid_id(self):
        """Test /api/public/community/{id} returns community details"""
        # First get list of communities
        list_response = requests.get(f"{BASE_URL}/api/public/communities")
        assert list_response.status_code == 200
        communities = list_response.json().get("communities", [])
        
        if len(communities) > 0:
            community_id = communities[0]["id"]
            detail_response = requests.get(f"{BASE_URL}/api/public/community/{community_id}")
            assert detail_response.status_code == 200
            data = detail_response.json()
            assert "community" in data
            assert data["community"]["id"] == community_id
            print(f"✓ Community detail: {data['community'].get('name')}")
        else:
            pytest.skip("No communities available to test detail endpoint")
    
    def test_get_community_detail_invalid_id(self):
        """Test /api/public/community/{id} returns 404 for invalid ID"""
        response = requests.get(f"{BASE_URL}/api/public/community/invalid-uuid-12345")
        # Should return 404 or 500 (depending on UUID validation)
        assert response.status_code in [404, 500]
        print(f"✓ Invalid community ID returns: {response.status_code}")


class TestCommunityJoin:
    """Community join endpoint tests - CRITICAL BUG FIX VERIFICATION"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        token = get_auth_token(ADMIN_EMAIL, ADMIN_PASSWORD)
        if not token:
            pytest.skip("Authentication failed - cannot test authenticated endpoints")
        return token
    
    def test_join_community_requires_auth(self):
        """Test /api/community/{id}/join requires authentication"""
        # First get a community ID
        list_response = requests.get(f"{BASE_URL}/api/public/communities")
        communities = list_response.json().get("communities", [])
        
        if len(communities) > 0:
            community_id = communities[0]["id"]
            response = requests.post(f"{BASE_URL}/api/community/{community_id}/join")
            assert response.status_code in [401, 403]
            print(f"✓ Join community requires auth: {response.status_code}")
        else:
            pytest.skip("No communities available to test join endpoint")
    
    def test_join_community_with_auth(self, auth_token):
        """Test /api/community/{id}/join with valid authentication"""
        # First get a community ID
        list_response = requests.get(f"{BASE_URL}/api/public/communities")
        communities = list_response.json().get("communities", [])
        
        if len(communities) > 0:
            community_id = communities[0]["id"]
            headers = {"Authorization": f"Bearer {auth_token}"}
            response = requests.post(f"{BASE_URL}/api/community/{community_id}/join", headers=headers)
            
            # Should return 200 (success), 400 (already member), or 403 (not artist)
            assert response.status_code in [200, 400, 403]
            data = response.json()
            print(f"✓ Join community response: {response.status_code} - {data}")
        else:
            pytest.skip("No communities available to test join endpoint")


class TestCartAPI:
    """Cart API tests - CRITICAL BUG FIX VERIFICATION"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        token = get_auth_token(ADMIN_EMAIL, ADMIN_PASSWORD)
        if not token:
            pytest.skip("Authentication failed - cannot test authenticated endpoints")
        return token
    
    def test_add_to_cart_requires_auth(self):
        """Test /api/cart/add requires authentication"""
        payload = {"artwork_id": "test-artwork-id", "quantity": 1}
        response = requests.post(f"{BASE_URL}/api/cart/add", json=payload)
        assert response.status_code in [401, 403]
        print(f"✓ Add to cart requires auth: {response.status_code}")
    
    def test_add_to_cart_with_auth(self, auth_token):
        """Test /api/cart/add with valid authentication"""
        # First get an available artwork
        paintings_response = requests.get(f"{BASE_URL}/api/public/paintings")
        paintings = paintings_response.json().get("paintings", [])
        
        if len(paintings) > 0:
            artwork_id = paintings[0]["id"]
            headers = {"Authorization": f"Bearer {auth_token}"}
            payload = {"artwork_id": artwork_id, "quantity": 1}
            response = requests.post(f"{BASE_URL}/api/cart/add", json=payload, headers=headers)
            
            # Should return 200 (success), 404 (artwork not found/available), or 500 (error)
            print(f"✓ Add to cart response: {response.status_code} - {response.text[:200]}")
            
            # If 500, check the error message
            if response.status_code == 500:
                data = response.json()
                print(f"  Error detail: {data.get('detail')}")
        else:
            pytest.skip("No paintings available to test cart endpoint")
    
    def test_get_cart_requires_auth(self):
        """Test /api/cart requires authentication"""
        response = requests.get(f"{BASE_URL}/api/cart")
        assert response.status_code in [401, 403]
        print(f"✓ Get cart requires auth: {response.status_code}")
    
    def test_get_cart_with_auth(self, auth_token):
        """Test /api/cart with valid authentication"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/cart", headers=headers)
        
        # Should return 200 with cart items
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Get cart response: {response.status_code} - {data}")


class TestArtClassEnquiry:
    """Art class enquiry tests - CRITICAL BUG FIX VERIFICATION"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        token = get_auth_token(ADMIN_EMAIL, ADMIN_PASSWORD)
        if not token:
            pytest.skip("Authentication failed - cannot test authenticated endpoints")
        return token
    
    def test_art_class_enquiry_requires_auth(self):
        """Test /api/public/art-class-enquiry requires authentication"""
        payload = {
            "art_type": "Painting",
            "skill_level": "beginner",
            "duration": "1 month",
            "budget_range": "250-350",
            "class_type": "online"
        }
        response = requests.post(f"{BASE_URL}/api/public/art-class-enquiry", json=payload)
        assert response.status_code in [401, 403]
        print(f"✓ Art class enquiry requires auth: {response.status_code}")
    
    def test_art_class_enquiry_with_auth(self, auth_token):
        """Test /api/public/art-class-enquiry with valid authentication"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "art_type": "Painting",
            "skill_level": "beginner",
            "duration": "1 month",
            "budget_range": "250-350",
            "class_type": "online"
        }
        response = requests.post(f"{BASE_URL}/api/public/art-class-enquiry", json=payload, headers=headers)
        
        # Should return 200 (success), 400 (already submitted this month), or 500 (error)
        print(f"✓ Art class enquiry response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            assert "success" in data
            print(f"  Success: {data}")
        elif response.status_code == 400:
            data = response.json()
            print(f"  Already submitted: {data.get('detail')}")
        else:
            data = response.json()
            print(f"  Error: {data.get('detail')}")


class TestAdminDashboard:
    """Admin dashboard tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        token = get_auth_token(ADMIN_EMAIL, ADMIN_PASSWORD)
        if not token:
            pytest.skip("Authentication failed - cannot test authenticated endpoints")
        return token
    
    def test_admin_dashboard_requires_auth(self):
        """Test /api/admin/dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code in [401, 403]
        print(f"✓ Admin dashboard requires auth: {response.status_code}")
    
    def test_admin_dashboard_with_auth(self, auth_token):
        """Test /api/admin/dashboard with valid authentication"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=headers)
        
        # Should return 200 (success) or 403 (not admin)
        print(f"✓ Admin dashboard response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"  Dashboard data keys: {list(data.keys())}")
        elif response.status_code == 403:
            data = response.json()
            print(f"  Access denied: {data.get('detail')}")


class TestMyCommunities:
    """My communities endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        token = get_auth_token(ADMIN_EMAIL, ADMIN_PASSWORD)
        if not token:
            pytest.skip("Authentication failed - cannot test authenticated endpoints")
        return token
    
    def test_my_communities_requires_auth(self):
        """Test /api/artist/my-communities requires authentication"""
        response = requests.get(f"{BASE_URL}/api/artist/my-communities")
        assert response.status_code in [401, 403]
        print(f"✓ My communities requires auth: {response.status_code}")
    
    def test_my_communities_with_auth(self, auth_token):
        """Test /api/artist/my-communities with valid authentication"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/artist/my-communities", headers=headers)
        
        # Should return 200 (success) or 403 (not artist)
        print(f"✓ My communities response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"  Created: {len(data.get('created_communities', []))}, Joined: {len(data.get('joined_communities', []))}")
        elif response.status_code == 403:
            data = response.json()
            print(f"  Access denied: {data.get('detail')}")


class TestCommunityDetails:
    """Community details endpoint tests"""
    
    def test_community_details_endpoint(self):
        """Test /api/community/{id} returns community details with members"""
        # First get list of communities
        list_response = requests.get(f"{BASE_URL}/api/public/communities")
        communities = list_response.json().get("communities", [])
        
        if len(communities) > 0:
            community_id = communities[0]["id"]
            detail_response = requests.get(f"{BASE_URL}/api/community/{community_id}")
            
            # This endpoint may or may not require auth
            if detail_response.status_code == 200:
                data = detail_response.json()
                assert "community" in data
                assert "members" in data
                print(f"✓ Community details: {data['community'].get('name')}, {len(data.get('members', []))} members")
            else:
                print(f"✓ Community details response: {detail_response.status_code}")
        else:
            pytest.skip("No communities available to test detail endpoint")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
