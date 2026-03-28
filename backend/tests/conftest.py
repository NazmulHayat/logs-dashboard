import os
import sys
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

if not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:///./validation_tests.db"

from app.routers import analytics, logs


@pytest.fixture
def app() -> FastAPI:
    test_app = FastAPI()
    test_app.include_router(logs.router)
    test_app.include_router(analytics.router)

    def _override_get_db():
        yield None

    test_app.dependency_overrides[logs.get_db] = _override_get_db
    test_app.dependency_overrides[analytics.get_db] = _override_get_db
    return test_app


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    return TestClient(app)
