"""
Commissioning feature regression tests.
Covers: public commission config, matching artists endpoint, and upload-url auth contract.
"""

import os
import pytest
import requests


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")


@pytest.fixture(scope="session")
def api_base_url():
    """Resolve public base URL from environment."""
    if not BASE_URL:
        pytest.skip("REACT_APP_BACKEND_URL is not set")
    return BASE_URL.rstrip("/")


# Module: Health and public commission configuration
class TestCommissionPublicConfig:
    def test_health_ok(self, api_base_url):
        response = requests.get(f"{api_base_url}/api/health", timeout=20)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert "database" in data

    def test_commission_config_includes_flat_categories(self, api_base_url):
        response = requests.get(f"{api_base_url}/api/public/commission-config", timeout=20)
        assert response.status_code == 200
        data = response.json()

        assert "category_pricing" in data
        category_pricing = data["category_pricing"]
        assert category_pricing["Sculpture"]["model"] == "flat"
        assert category_pricing["Photography"]["model"] == "flat"
        assert category_pricing["Digital Art"]["model"] == "flat"
        assert category_pricing["Illustrations"]["model"] == "flat"

    def test_commission_config_has_required_sections(self, api_base_url):
        response = requests.get(f"{api_base_url}/api/public/commission-config", timeout=20)
        assert response.status_code == 200
        data = response.json()

        assert isinstance(data.get("categories"), list)
        assert isinstance(data.get("medium_pricing"), dict)
        assert isinstance(data.get("detail_multipliers"), dict)
        assert isinstance(data.get("statuses"), list)


# Module: Category + budget artist matching
class TestCommissionMatchingArtists:
    def test_matching_artists_valid_category_budget(self, api_base_url):
        params = {"category": "Sculpture", "budget": "50000"}
        response = requests.get(
            f"{api_base_url}/api/public/commission/matching-artists",
            params=params,
            timeout=20,
        )
        assert response.status_code == 200
        data = response.json()
        assert "artists" in data
        assert isinstance(data["artists"], list)

    def test_matching_artists_invalid_category(self, api_base_url):
        params = {"category": "InvalidCategory", "budget": "50000"}
        response = requests.get(
            f"{api_base_url}/api/public/commission/matching-artists",
            params=params,
            timeout=20,
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data


# Module: Upload URL endpoint contract for bucket_key behavior
class TestUploadUrlContract:
    def test_upload_url_requires_authentication(self, api_base_url):
        payload = {
            "filename": "ref-test.png",
            "content_type": "image/png",
            "folder": "commission-references",
            "bucket_key": "commission-references",
            "entity_id": "test-entity-id",
        }
        response = requests.post(
            f"{api_base_url}/api/upload-url",
            json=payload,
            timeout=20,
        )
        assert response.status_code in [401, 403]

    def test_upload_url_rejects_invalid_bucket_key_when_authenticated_is_missing(self, api_base_url):
        """
        API is auth-protected in this environment; this test verifies auth is enforced first.
        Bucket-key validation requires authenticated context and is covered via code review in this iteration.
        """
        payload = {
            "filename": "ref-test.png",
            "content_type": "image/png",
            "folder": "commission-references",
            "bucket_key": "invalid-bucket-key",
        }
        response = requests.post(
            f"{api_base_url}/api/upload-url",
            json=payload,
            timeout=20,
        )
        assert response.status_code in [401, 403]
