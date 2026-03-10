"""
Regression tests for community creation and exhibition workflow fixes.
Covers: auth contracts + model/runtime readiness checks from previous critical blockers.
"""

import os
import sys
from pathlib import Path

import pytest
import requests

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def _load_frontend_backend_url():
    frontend_env = Path(__file__).resolve().parents[2] / "frontend" / ".env"
    if not frontend_env.exists():
        return None

    for line in frontend_env.read_text(encoding="utf-8").splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            return line.split("=", 1)[1].strip()
    return None


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or _load_frontend_backend_url()
SERVER_PATH = BACKEND_DIR / "server.py"


@pytest.fixture(scope="session")
def api_base_url():
    if not BASE_URL:
        pytest.skip("REACT_APP_BACKEND_URL is not set")
    return BASE_URL.rstrip("/")


# Module: Unauthenticated API contracts (must not be 500)
class TestUnauthContracts:
    def test_health_ok(self, api_base_url):
        response = requests.get(f"{api_base_url}/api/health", timeout=20)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"

    def test_community_create_requires_auth_not_500(self, api_base_url):
        response = requests.post(
            f"{api_base_url}/api/community/create",
            json={"name": "TEST_Community", "description": "Regression contract", "location": "Mumbai"},
            timeout=20,
        )
        assert response.status_code in [401, 403]
        body = response.json()
        assert body.get("detail")

    def test_admin_exhibition_create_requires_auth_not_500(self, api_base_url):
        response = requests.post(
            f"{api_base_url}/api/admin/exhibitions/create",
            json={
                "name": "TEST_Admin_Exhibition",
                "description": "Regression contract",
                "start_date": "2026-03-11",
                "end_date": "2026-03-15",
                "artwork_ids": [],
                "exhibition_type": "Kalakanksh",
                "exhibition_images": [],
            },
            timeout=20,
        )
        assert response.status_code in [401, 403]
        body = response.json()
        assert body.get("detail")


# Module: Code-level regression checks for prior blockers
class TestCodeReadinessRegression:
    def test_community_create_model_contains_route_fields(self):
        from server import CommunityCreate

        model_fields = set(CommunityCreate.model_fields.keys())
        assert "name" in model_fields
        assert "description" in model_fields
        assert "image" in model_fields
        assert "category" in model_fields
        assert "location" in model_fields
        assert "invite_criteria" in model_fields

    def test_server_has_single_communitycreate_definition(self):
        source = SERVER_PATH.read_text(encoding="utf-8")
        assert source.count("class CommunityCreate(BaseModel):") == 1
