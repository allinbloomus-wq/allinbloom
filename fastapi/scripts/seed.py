from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.database import SessionLocal
from app.models.bouquet import Bouquet
from app.models.promo_slide import PromoSlide
from app.models.review import Review
from app.models.user import User
from app.models.enums import BouquetType, FlowerType, Role


bouquets = [
    {
        "name": "Blush Sonata",
        "description": "Garden roses, ranunculus, and lisianthus in pink and white tones.",
        "price_cents": 9800,
        "flower_type": FlowerType.ROSE,
        "style": "ROSE, RANUNCULUSES",
        "bouquet_type": BouquetType.MIXED,
        "colors": "pink,white,yellow",
        "is_mixed": True,
        "is_featured": True,
        "image": "/images/bouquet-1.webp",
    },
    {
        "name": "Velvet Tulip Reverie",
        "description": "Velvety tulips and anemones wrapped in satin ribbon for modern romance.",
        "price_cents": 7600,
        "flower_type": FlowerType.TULIP,
        "style": "TULIP",
        "bouquet_type": BouquetType.MONO,
        "colors": "burgundy,pink,peach",
        "is_mixed": False,
        "is_featured": True,
        "image": "/images/bouquet-2.webp",
    },
    {
        "name": "Hydrangea Champagne Cloud",
        "description": "Hydrangeas, cream roses, and eucalyptus in a soft airy silhouette.",
        "price_cents": 11200,
        "flower_type": FlowerType.HYDRANGEAS,
        "style": "HYDRANGEAS, ROSE",
        "bouquet_type": BouquetType.MIXED,
        "colors": "white,yellow,light blue",
        "is_mixed": True,
        "is_featured": True,
        "image": "/images/bouquet-3.webp",
    },
    {
        "name": "Peony Muse",
        "description": "Peonies with delicate spray roses and textured grasses, light and lush.",
        "price_cents": 13400,
        "flower_type": FlowerType.PEONY,
        "style": "PEONY, SPRAY_ROSES",
        "bouquet_type": BouquetType.MIXED,
        "colors": "pink,peach,yellow",
        "is_mixed": True,
        "is_featured": False,
        "image": "/images/bouquet-4.webp",
    },
    {
        "name": "Sage Orchid Mist",
        "description": "Minimal orchid stems with cool blue greens and matte wrap in a sleek form.",
        "price_cents": 8800,
        "flower_type": FlowerType.ORCHID,
        "style": "ORCHID",
        "bouquet_type": BouquetType.MONO,
        "colors": "light blue,white",
        "is_mixed": False,
        "is_featured": False,
        "image": "/images/bouquet-5.webp",
    },
    {
        "name": "Sunlit Garden",
        "description": "Seasonal mixed blooms in peach, buttercream, and warm pink shades.",
        "price_cents": 6900,
        "flower_type": FlowerType.ROSE,
        "style": "ROSE, TULIP, PEONY",
        "bouquet_type": BouquetType.SEASON,
        "colors": "peach,pink,yellow",
        "is_mixed": False,
        "is_featured": False,
        "image": "/images/bouquet-6.webp",
    },
    {
        "name": "Ivory Poem",
        "description": "White roses, lisianthus, and soft greens for a timeless statement.",
        "price_cents": 9400,
        "flower_type": FlowerType.ROSE,
        "style": "ROSE",
        "bouquet_type": BouquetType.MONO,
        "colors": "white,light blue",
        "is_mixed": False,
        "is_featured": False,
        "image": "/images/bouquet-7.webp",
    },
    {
        "name": "Lavender Haze",
        "description": "Lavender and lilac blooms with a misty texture and feather-light wrap.",
        "price_cents": 10100,
        "flower_type": FlowerType.TULIP,
        "style": "TULIP, HYDRANGEAS, PEONY",
        "bouquet_type": BouquetType.MIXED,
        "colors": "lavender,pink,white",
        "is_mixed": True,
        "is_featured": False,
        "image": "/images/bouquet-8.webp",
    },
]

promo_slides = [
    {
        "title": "",
        "subtitle": "",
        "image": "/images/promo-1.webp",
        "link": "",
        "position": 1,
    },
    {
        "title": "",
        "subtitle": "",
        "image": "/images/promo-2.webp",
        "link": "",
        "position": 2,
    },
    {
        "title": "Gift-ready wraps",
        "subtitle": "Signature satin ribbon and handwritten note included.",
        "image": "/images/promo-3.webp",
        "link": "/catalog?filter=featured",
        "position": 3,
    },
]

reviews = [
    {
        "name": "Emma L.",
        "email": "emma@example.com",
        "rating": 5,
        "text": "Absolutely stunning bouquet and very fast delivery. The colors looked even better in person.",
        "image": "/images/bouquet-2.webp",
        "is_active": True,
        "is_read": True,
    },
    {
        "name": "Mia R.",
        "email": "mia@example.com",
        "rating": 5,
        "text": "Beautiful wrapping, fresh flowers, and a lovely handwritten note. Perfect gift experience.",
        "image": "/images/bouquet-4.webp",
        "is_active": True,
        "is_read": True,
    },
    {
        "name": "Sophie K.",
        "email": "sophie@example.com",
        "rating": 4,
        "text": "Great quality and elegant style. Will definitely order again for special occasions.",
        "image": None,
        "is_active": True,
        "is_read": True,
    },
]


def main():
    admin_email = os.environ.get("ADMIN_EMAIL") or "allinbloom.us@gmail.com"

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == admin_email).first()
        if user:
            user.role = Role.ADMIN
        else:
            db.add(User(email=admin_email, role=Role.ADMIN))

        db.query(Bouquet).delete()
        db.add_all([Bouquet(**bouquet) for bouquet in bouquets])

        db.query(PromoSlide).delete()
        db.add_all([PromoSlide(**slide) for slide in promo_slides])

        db.query(Review).delete()
        db.add_all([Review(**review) for review in reviews])

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()

