def test_query_invalid_severity_rejected(client):
    response = client.get("/api/logs", params={"severity": "CRITICAL"})
    assert response.status_code == 422


def test_query_invalid_date_format_rejected(client):
    response = client.get("/api/logs", params={"start_date": "not-a-date"})
    assert response.status_code == 422


def test_start_date_after_end_date_rejected(client):
    response = client.get(
        "/api/logs",
        params={
            "start_date": "2026-03-10T00:00:00Z",
            "end_date": "2026-03-01T00:00:00Z",
        },
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "start_date must not be after end_date"


def test_invalid_page_rejected(client):
    response = client.get("/api/logs", params={"page": 0})
    assert response.status_code == 422


def test_invalid_page_size_rejected(client):
    response = client.get("/api/logs", params={"page_size": 0})
    assert response.status_code == 422


def test_post_missing_required_fields_rejected(client):
    response = client.post("/api/logs", json={})
    assert response.status_code == 422


def test_post_bad_severity_rejected(client):
    payload = {
        "timestamp": "2026-03-01T10:15:00Z",
        "severity": "CRITICAL",
        "source": "api",
        "message": "something happened",
    }
    response = client.post("/api/logs", json=payload)
    assert response.status_code == 422


def test_post_bad_timestamp_rejected(client):
    payload = {
        "timestamp": "not-a-timestamp",
        "severity": "INFO",
        "source": "api",
        "message": "something happened",
    }
    response = client.post("/api/logs", json=payload)
    assert response.status_code == 422


def test_post_blank_source_rejected(client):
    payload = {
        "timestamp": "2026-03-01T10:15:00Z",
        "severity": "INFO",
        "source": "   ",
        "message": "something happened",
    }
    response = client.post("/api/logs", json=payload)
    assert response.status_code == 422


def test_post_blank_message_rejected(client):
    payload = {
        "timestamp": "2026-03-01T10:15:00Z",
        "severity": "INFO",
        "source": "api",
        "message": "   ",
    }
    response = client.post("/api/logs", json=payload)
    assert response.status_code == 422


def test_analytics_start_after_end_rejected(client):
    response = client.get(
        "/api/logs/analytics/trend",
        params={
            "start_date": "2026-03-10T00:00:00Z",
            "end_date": "2026-03-01T00:00:00Z",
        },
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "start_date must not be after end_date"


def test_invalid_sort_by_rejected(client):
    response = client.get("/api/logs", params={"sort_by": "message"})
    assert response.status_code == 422


def test_invalid_sort_order_rejected(client):
    response = client.get("/api/logs", params={"sort_order": "sideways"})
    assert response.status_code == 422
