"""
Exhibition lifecycle + payment contract smoke tests.
Covers public exhibition payload routes, aliases, and auth protection on artist payment endpoints.
"""

import os
from pathlib import Path

import pytest
import requests


def _load_frontend_backend_url() -> str | None:
    frontend_env = Path(__file__).resolve().parents[2] / "frontend" / ".env"
    if not frontend_env.exists():
        return None

    for line in frontend_env.read_text(encoding="utf-8").splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            value = line.split("=", 1)[1].strip()
            return value or None
    return None


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or _load_frontend_backend_url()


@pytest.fixture(scope="session")
def api_base_url():
    if not BASE_URL:
        pytest.skip("REACT_APP_BACKEND_URL is not set")
    return BASE_URL.rstrip("/")


class TestExhibitionPublicContracts:
    # Module: public exhibitions endpoints return stable payload shape
    def test_public_active_exhibitions_payload(self, api_base_url):
        response = requests.get(f"{api_base_url}/api/public/exhibitions/active", timeout=20)
        assert response.status_code == 200
        body = response.json()
        assert isinstance(body, dict)
        assert "exhibitions" in body
        assert isinstance(body["exhibitions"], list)

    def test_public_archived_exhibitions_payload(self, api_base_url):
        response = requests.get(f"{api_base_url}/api/public/exhibitions/archived", timeout=20)
        assert response.status_code == 200
        body = response.json()
        assert isinstance(body, dict)
        assert "exhibitions" in body
        assert isinstance(body["exhibitions"], list)

    def test_public_active_exhibitions_alias_payload(self, api_base_url):
        response = requests.get(f"{api_base_url}/api/public/active-exhibitions", timeout=20)
        assert response.status_code == 200
        body = response.json()
        assert isinstance(body, dict)
        assert "exhibitions" in body
        assert isinstance(body["exhibitions"], list)

    def test_public_archived_exhibitions_alias_payload(self, api_base_url):
        response = requests.get(f"{api_base_url}/api/public/archived-exhibitions", timeout=20)
        assert response.status_code == 200
        body = response.json()
        assert isinstance(body, dict)
        assert "exhibitions" in body
        assert isinstance(body["exhibitions"], list)


class TestExhibitionPaymentContracts:
    # Module: artist pricing/order endpoints must enforce auth and avoid 500
    def test_artist_pricing_requires_auth(self, api_base_url):
        response = requests.get(f"{api_base_url}/api/artist/exhibitions/pricing", timeout=20)
        assert response.status_code in [401, 403]
        body = response.json()
        assert body.get("detail")

    def test_artist_payment_order_requires_auth(self, api_base_url):
        response = requests.post(
            f"{api_base_url}/api/artist/exhibitions/payment-order?exhibition_type=Kalakanksh",
            timeout=20,
        )
        assert response.status_code in [401, 403]
        body = response.json()
        assert body.get("detail")
