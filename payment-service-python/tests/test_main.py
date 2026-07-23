"""Tests for POST /process-payment."""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_process_payment_returns_200_and_valid_status() -> None:
    response = client.post(
        "/process-payment",
        json={
            "amount": 100.50,
            "card_id": "11111111-1111-1111-1111-111111111111",
        },
    )

    assert response.status_code == 200

    body = response.json()
    assert body["status"] in ("APPROVED", "REJECTED")
    assert "transaction_id" in body
