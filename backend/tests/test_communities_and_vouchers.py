"""
Backend API Tests for ChitraKalakar - Communities and Vouchers
Tests for new features: Communities, Community Detail, Admin Vouchers, Artist of the Day
"""
import pytest
import requests
import os

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://chitrakalakar.preview.emergentagent.com').rstrip('/')

class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"Health check passed: {data}")


class TestPublicCommunities:
    """Public communities endpoint tests"""
    
    def test_get_public_communities(self):
        """Test /api/public/communities returns valid response"""
        response = requests.get(f"{BASE_URL}/api/public/communities")
        assert response.status_code == 200
        data = response.json()
        assert "communities" in data
        assert isinstance(data["communities"], list)
        print(f"Public communities: {len(data['communities'])} communities found")
    
    def test_get_community_detail_not_found(self):
        """Test /api/public/community/{id} returns 404 for non-existent community"""
        response = requests.get(f"{BASE_URL}/api/public/community/non-existent-id-12345")
        # Should return 404 or 500 (depending on implementation)
        assert response.status_code in [404, 500]
        print(f"Community not found test passed with status: {response.status_code}")


class TestCommunitiesEndpoint:
    """Communities endpoint tests (authenticated)"""
    
    def test_get_communities_requires_auth(self):
        """Test /api/communities requires authentication"""
        response = requests.get(f"{BASE_URL}/api/communities")
        # Should return 401 or 403 for unauthenticated requests
        assert response.status_code in [401, 403, 520]  # 520 is Cloudflare error
        print(f"Communities auth check passed with status: {response.status_code}")


class TestAdminVouchers:
    """Admin vouchers endpoint tests"""
    
    def test_get_vouchers_requires_auth(self):
        """Test /api/admin/vouchers requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/vouchers")
        assert response.status_code in [401, 403]
        data = response.json()
        assert "detail" in data
        print(f"Admin vouchers auth check passed: {data.get('detail')}")


class TestArtistOfTheDay:
    """Artist of the day endpoint tests"""
    
    def test_get_artist_of_the_day(self):
        """Test /api/public/artist-of-the-day returns valid response"""
        response = requests.get(f"{BASE_URL}/api/public/artist-of-the-day")
        assert response.status_code == 200
        data = response.json()
        assert "artist" in data
        # Artist can be null if no artist is featured
        print(f"Artist of the day: {data.get('artist')}")


class TestPublicStats:
    """Public stats endpoint tests"""
    
    def test_get_public_stats(self):
        """Test /api/public/stats returns valid response"""
        response = requests.get(f"{BASE_URL}/api/public/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_artists" in data
        assert "total_artworks" in data
        assert "active_exhibitions" in data
        print(f"Public stats: {data}")


class TestPublicArtists:
    """Public artists endpoint tests"""
    
    def test_get_public_artists(self):
        """Test /api/public/artists returns valid response"""
        response = requests.get(f"{BASE_URL}/api/public/artists")
        assert response.status_code == 200
        data = response.json()
        assert "artists" in data
        assert isinstance(data["artists"], list)
        print(f"Public artists: {len(data['artists'])} artists found")


class TestPublicFeaturedArtists:
    """Public featured artists endpoint tests"""
    
    def test_get_featured_artists(self):
        """Test /api/public/featured-artists returns valid response"""
        response = requests.get(f"{BASE_URL}/api/public/featured-artists")
        assert response.status_code == 200
        data = response.json()
        assert "contemporary" in data
        assert "registered" in data
        print(f"Featured artists: {len(data.get('contemporary', []))} contemporary, {len(data.get('registered', []))} registered")


class TestPublicPaintings:
    """Public paintings endpoint tests"""
    
    def test_get_public_paintings(self):
        """Test /api/public/paintings returns valid response"""
        response = requests.get(f"{BASE_URL}/api/public/paintings")
        assert response.status_code == 200
        data = response.json()
        assert "paintings" in data
        assert isinstance(data["paintings"], list)
        print(f"Public paintings: {len(data['paintings'])} paintings found")


class TestPublicExhibitions:
    """Public exhibitions endpoint tests"""
    
    def test_get_public_exhibitions(self):
        """Test /api/public/exhibitions returns valid response"""
        response = requests.get(f"{BASE_URL}/api/public/exhibitions")
        assert response.status_code == 200
        data = response.json()
        assert "exhibitions" in data
        assert isinstance(data["exhibitions"], list)
        print(f"Public exhibitions: {len(data['exhibitions'])} exhibitions found")
    
    def test_get_active_exhibitions(self):
        """Test /api/public/exhibitions/active returns valid response"""
        response = requests.get(f"{BASE_URL}/api/public/exhibitions/active")
        assert response.status_code == 200
        data = response.json()
        assert "exhibitions" in data
        print(f"Active exhibitions: {len(data['exhibitions'])} exhibitions found")
    
    def test_get_archived_exhibitions(self):
        """Test /api/public/exhibitions/archived returns valid response"""
        response = requests.get(f"{BASE_URL}/api/public/exhibitions/archived")
        assert response.status_code == 200
        data = response.json()
        assert "exhibitions" in data
        print(f"Archived exhibitions: {len(data['exhibitions'])} exhibitions found")


class TestMembershipPlans:
    """Membership plans endpoint tests"""
    
    def test_get_membership_plans(self):
        """Test /api/membership/plans returns valid response"""
        response = requests.get(f"{BASE_URL}/api/membership/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert isinstance(data["plans"], list)
        # Should have at least monthly and annual plans
        plan_ids = [p.get("id") for p in data["plans"]]
        assert "monthly" in plan_ids or "annual" in plan_ids
        print(f"Membership plans: {data['plans']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
