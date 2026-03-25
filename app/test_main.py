import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_execute_request_get():
    # Use JSONPlaceholder for a reliable mock API
    response = client.post(
        "/execute",
        json={
            "method": "GET",
            "url": "https://jsonplaceholder.typicode.com/todos/1"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == 200
    assert "time_ms" in data
    assert "body" in data
    assert "userId" in data["body"] # It's a string, we might want to test if it contains this

def test_execute_request_invalid_url():
    response = client.post(
        "/execute",
        json={
            "method": "GET",
            "url": "http://invalid-url-that-doesnt-exist.com"
        }
    )
    assert response.status_code == 400
    assert "Request error" in response.json()["detail"]
