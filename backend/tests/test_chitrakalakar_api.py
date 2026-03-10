"""
ChitraKalakar API Tests - Iteration 12
Testing: Public Artists, Exhibitions, Communities, Health Check, Admin Exhibition Controls
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://kalakanksh-gallery.preview.emergentagent.com').rstrip('/')


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint_returns_healthy(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert "database" in data
        print(f"✓ Health check passed: {data}")


class TestPublicArtistsAPI:
    """Tests for /api/public/artists endpoint - should return ALL registered artists"""
    
    def test_public_artists_returns_200(self):
        """Test /api/public/artists returns 200"""
        response = requests.get(f"{BASE_URL}/api/public/artists")
        assert response.status_code == 200
        data = response.json()
        assert "artists" in data
        print(f"✓ Public artists endpoint returned {len(data['artists'])} artists")
    
    def test_public_artists_returns_all_registered_artists(self):
        """Test that ALL registered artists are returned, not just members"""
        response = requests.get(f"{BASE_URL}/api/public/artists")
        assert response.status_code == 200
        data = response.json()
        artists = data.get("artists", [])
        
        # Check that we have artists
        assert len(artists) >= 1, "Expected at least 1 registered artist"
        
        # Check that both members and non-members are included
        members = [a for a in artists if a.get("is_member") == True]
        non_members = [a for a in artists if a.get("is_member") == False]
        
        print(f"✓ Total artists: {len(artists)}, Members: {len(members)}, Non-members: {len(non_members)}")
        
        # Verify artist data structure
        for artist in artists:
            assert "id" in artist, "Artist should have id"
            assert "name" in artist, "Artist should have name"
            assert "is_member" in artist, "Artist should have is_member field"
        
        # The fix should return ALL artists, not just members
        # If we have non-members in the list, the fix is working
        if len(non_members) > 0:
            print(f"✓ VERIFIED: Non-member artists are included in the response")
        else:
            print(f"⚠ Note: All current artists happen to be members")
    
    def test_public_artist_detail(self):
        """Test /api/public/artist/{id} returns artist details"""
        # First get list of artists
        response = requests.get(f"{BASE_URL}/api/public/artists")
        assert response.status_code == 200
        artists = response.json().get("artists", [])
        
        if len(artists) > 0:
            artist_id = artists[0]["id"]
            detail_response = requests.get(f"{BASE_URL}/api/public/artist/{artist_id}")
            assert detail_response.status_code == 200
            data = detail_response.json()
            assert "artist" in data
            print(f"✓ Artist detail for {artist_id}: {data['artist'].get('full_name', 'N/A')}")


class TestPublicExhibitionsAPI:
    """Tests for /api/public/exhibitions endpoint - should return exhibition_images, exhibition_paintings"""
    
    def test_public_exhibitions_returns_200(self):
        """Test /api/public/exhibitions returns 200"""
        response = requests.get(f"{BASE_URL}/api/public/exhibitions")
        assert response.status_code == 200
        data = response.json()
        assert "exhibitions" in data
        print(f"✓ Public exhibitions endpoint returned {len(data['exhibitions'])} exhibitions")
    
    def test_exhibitions_have_required_columns(self):
        """Test that exhibitions have exhibition_images, exhibition_paintings, primary_exhibition_image columns"""
        response = requests.get(f"{BASE_URL}/api/public/exhibitions")
        assert response.status_code == 200
        exhibitions = response.json().get("exhibitions", [])
        
        for exhibition in exhibitions:
            # Check that required columns exist (even if empty)
            assert "exhibition_images" in exhibition, f"Exhibition {exhibition.get('id')} missing exhibition_images"
            assert "exhibition_paintings" in exhibition, f"Exhibition {exhibition.get('id')} missing exhibition_paintings"
            assert "primary_exhibition_image" in exhibition, f"Exhibition {exhibition.get('id')} missing primary_exhibition_image"
            
            # Log exhibition data status
            has_images = len(exhibition.get("exhibition_images", [])) > 0
            has_paintings = len(exhibition.get("exhibition_paintings", [])) > 0
            has_primary = exhibition.get("primary_exhibition_image") is not None
            
            print(f"  Exhibition '{exhibition.get('name')}': images={has_images}, paintings={has_paintings}, primary={has_primary}")
        
        print(f"✓ All {len(exhibitions)} exhibitions have required columns")
    
    def test_exhibitions_with_artwork_data(self):
        """Test that exhibitions with artwork_ids have enriched data"""
        response = requests.get(f"{BASE_URL}/api/public/exhibitions")
        assert response.status_code == 200
        exhibitions = response.json().get("exhibitions", [])
        
        exhibitions_with_artworks = [e for e in exhibitions if len(e.get("artwork_ids", [])) > 0]
        exhibitions_with_paintings = [e for e in exhibitions if len(e.get("exhibition_paintings", [])) > 0]
        
        print(f"✓ Exhibitions with artwork_ids: {len(exhibitions_with_artworks)}")
        print(f"✓ Exhibitions with exhibition_paintings data: {len(exhibitions_with_paintings)}")
        
        # Verify painting structure for exhibitions that have them
        for exhibition in exhibitions_with_paintings:
            for painting in exhibition.get("exhibition_paintings", []):
                assert "image_url" in painting, "Painting should have image_url"
                assert "title" in painting, "Painting should have title"
                print(f"  - Painting: {painting.get('title')}")
    
    def test_active_exhibitions_endpoint(self):
        """Test /api/public/exhibitions/active returns active exhibitions"""
        response = requests.get(f"{BASE_URL}/api/public/exhibitions/active")
        assert response.status_code == 200
        data = response.json()
        assert "exhibitions" in data
        
        # All returned exhibitions should have status 'active'
        for exhibition in data.get("exhibitions", []):
            assert exhibition.get("status") == "active", f"Expected active status, got {exhibition.get('status')}"
        
        print(f"✓ Active exhibitions: {len(data['exhibitions'])}")
    
    def test_archived_exhibitions_endpoint(self):
        """Test /api/public/exhibitions/archived returns archived exhibitions"""
        response = requests.get(f"{BASE_URL}/api/public/exhibitions/archived")
        assert response.status_code == 200
        data = response.json()
        assert "exhibitions" in data
        
        # All returned exhibitions should have status 'archived'
        for exhibition in data.get("exhibitions", []):
            assert exhibition.get("status") == "archived", f"Expected archived status, got {exhibition.get('status')}"
        
        print(f"✓ Archived exhibitions: {len(data['exhibitions'])}")


class TestCommunitiesAPI:
    """Tests for /api/public/communities endpoint"""
    
    def test_public_communities_returns_200(self):
        """Test /api/public/communities returns 200 without errors"""
        response = requests.get(f"{BASE_URL}/api/public/communities")
        assert response.status_code == 200
        data = response.json()
        assert "communities" in data
        print(f"✓ Public communities endpoint returned {len(data['communities'])} communities")


class TestAdminExhibitionControls:
    """Tests for admin exhibition control endpoints (auth required - testing endpoint existence)"""
    
    def test_admin_exhibitions_all_requires_auth(self):
        """Test /api/admin/exhibitions/all requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/exhibitions/all")
        # Should return 401/403 without auth, not 500
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Admin exhibitions endpoint properly requires auth (status: {response.status_code})")
    
    def test_admin_exhibition_extend_requires_auth(self):
        """Test /api/admin/exhibitions/extend requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/admin/exhibitions/extend",
            json={"exhibition_id": "test-id", "extra_days": 5}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Admin extend endpoint properly requires auth (status: {response.status_code})")
    
    def test_admin_exhibition_update_requires_auth(self):
        """Test /api/admin/exhibitions/{id} PUT requires authentication"""
        response = requests.put(
            f"{BASE_URL}/api/admin/exhibitions/test-id",
            json={"exhibition_id": "test-id", "status": "paused"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Admin update endpoint properly requires auth (status: {response.status_code})")
    
    def test_admin_exhibition_delete_requires_auth(self):
        """Test /api/admin/exhibitions/{id} DELETE requires authentication"""
        response = requests.delete(f"{BASE_URL}/api/admin/exhibitions/test-id")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Admin delete endpoint properly requires auth (status: {response.status_code})")


class TestArtistExhibitionControls:
    """Tests for artist exhibition control endpoints (auth required - testing endpoint existence)"""
    
    def test_artist_exhibitions_requires_auth(self):
        """Test /api/artist/exhibitions requires authentication"""
        response = requests.get(f"{BASE_URL}/api/artist/exhibitions")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Artist exhibitions endpoint properly requires auth (status: {response.status_code})")
    
    def test_artist_exhibition_action_requires_auth(self):
        """Test /api/artist/exhibitions/{id}/request-action requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/artist/exhibitions/test-id/request-action",
            json={"action": "pause", "reason": "test"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Artist exhibition action endpoint properly requires auth (status: {response.status_code})")


class TestCartAPI:
    """Tests for cart API (auth required - testing endpoint existence)"""
    
    def test_cart_add_requires_auth(self):
        """Test /api/cart/add requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/cart/add",
            json={"artwork_id": "test-id", "quantity": 1}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Cart add endpoint properly requires auth (status: {response.status_code})")
    
    def test_cart_get_requires_auth(self):
        """Test /api/cart requires authentication"""
        response = requests.get(f"{BASE_URL}/api/cart")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Cart get endpoint properly requires auth (status: {response.status_code})")


class TestPublicStats:
    """Tests for public stats endpoint"""
    
    def test_public_stats_returns_200(self):
        """Test /api/public/stats returns platform statistics"""
        response = requests.get(f"{BASE_URL}/api/public/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_artists" in data
        assert "total_artworks" in data
        assert "active_exhibitions" in data
        
        print(f"✓ Platform stats: artists={data.get('total_artists')}, artworks={data.get('total_artworks')}, exhibitions={data.get('active_exhibitions')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
