"""
Regression tests for exhibition workflow endpoints and community create contract.
Covers: unauth behavior for new exhibition endpoints and CommunityCreate model readiness.
"""

import os
import sys
from pathlib import Path

import pytest
import requests


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture(scope="session")
def api_base_url():
    if not BASE_URL:
        pytest.skip("REACT_APP_BACKEND_URL is not set")
    return BASE_URL.rstrip("/")


# Module: Public health and auth contracts for exhibition/community APIs
class TestExhibitionsAndCommunityAuthContracts:
    def test_health_ok(self, api_base_url):
        response = requests.get(f"{api_base_url}/api/health", timeout=20)
        assert response.status_code == 200
        payload = response.json()
        assert payload.get("status") == "healthy"
        assert "database" in payload

    def test_artist_exhibitions_requires_auth(self, api_base_url):
        response = requests.get(f"{api_base_url}/api/artist/exhibitions", timeout=20)
        assert response.status_code in [401, 403]

    def test_admin_create_exhibition_requires_auth(self, api_base_url):
        response = requests.post(
            f"{api_base_url}/api/admin/exhibitions/create",
            json={
                "name": "TEST_Unauth Admin Exhibition",
                "description": "Unauth should be blocked",
                "start_date": "2026-03-10",
                "end_date": "2026-03-14",
                "artwork_ids": [],
                "exhibition_type": "Kalakanksh",
                "exhibition_images": [],
            },
            timeout=20,
        )
        assert response.status_code in [401, 403]

    def test_community_create_requires_auth(self, api_base_url):
        response = requests.post(
            f"{api_base_url}/api/community/create",
            json={
                "name": "TEST Community",
                "description": "Contract test",
                "location": "Mumbai",
            },
            timeout=20,
        )
        assert response.status_code in [401, 403]


# Module: Code-level readiness for community creation payload model
class TestCommunityCreateModelReadiness:
    def test_community_create_model_missing_fields_used_by_route(self):
        from server import CommunityCreate

        model_fields = set(CommunityCreate.model_fields.keys())

        # These fields are referenced inside create_community_managed route.
        assert "image" not in model_fields
        assert "category" not in model_fields
        assert "invite_criteria" not in model_fields
