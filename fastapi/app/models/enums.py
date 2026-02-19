from __future__ import annotations

from enum import Enum


class Role(str, Enum):
    ADMIN = "ADMIN"
    CUSTOMER = "CUSTOMER"


class FlowerType(str, Enum):
    ROSE = "ROSE"
    TULIP = "TULIP"
    LILY = "LILY"
    PEONY = "PEONY"
    ORCHID = "ORCHID"
    MIXED = "MIXED"


class BouquetStyle(str, Enum):
    ROMANTIC = "ROMANTIC"
    MODERN = "MODERN"
    GARDEN = "GARDEN"
    MINIMAL = "MINIMAL"
    SEASON = "SEASON"


class OrderStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    CANCELED = "CANCELED"
