"""Microservicio de procesamiento de pagos (simulación)."""

from __future__ import annotations

import random
import uuid
from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(
    title="Payment Service",
    description="Simula la aprobación o rechazo de un pago.",
    version="1.0.0",
)


class ProcessPaymentRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Monto del pago")
    card_id: str = Field(..., min_length=1, description="Identificador de la tarjeta")


class ProcessPaymentResponse(BaseModel):
    status: Literal["APPROVED", "REJECTED"]
    transaction_id: str


class HealthResponse(BaseModel):
    status: Literal["healthy"]
    service: Literal["payment-processing-python"]


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Healthcheck para orquestadores (Docker Compose, k8s, etc.)."""
    return HealthResponse(
        status="healthy",
        service="payment-processing-python",
    )


@app.post("/process-payment", response_model=ProcessPaymentResponse)
def process_payment(payload: ProcessPaymentRequest) -> ProcessPaymentResponse:
    """Aprueba el pago con 80% de probabilidad; lo rechaza con 20%."""
    status: Literal["APPROVED", "REJECTED"] = (
        "APPROVED" if random.random() < 0.8 else "REJECTED"
    )
    return ProcessPaymentResponse(
        status=status,
        transaction_id=str(uuid.uuid4()),
    )
