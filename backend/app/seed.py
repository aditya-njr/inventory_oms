"""Optional demo seed data for local development."""

from app.database import SessionLocal
from app.models import Customer, Product


def seed_demo_data():
    db = SessionLocal()
    try:
        if db.query(Product).count() > 0:
            return

        products = [
            Product(name="Wireless Mouse", sku="WM-001", price=2499.00, quantity_in_stock=50),
            Product(name="Mechanical Keyboard", sku="KB-002", price=7499.00, quantity_in_stock=8),
            Product(name="USB-C Hub", sku="HUB-003", price=3750.00, quantity_in_stock=25),
            Product(name="Monitor Stand", sku="MS-004", price=2950.00, quantity_in_stock=5),
        ]
        customers = [
            Customer(
                full_name="Jane Doe",
                email="jane.doe@example.com",
                phone="+1-555-0101",
            ),
            Customer(
                full_name="John Smith",
                email="john.smith@example.com",
                phone="+1-555-0102",
            ),
        ]
        db.add_all(products + customers)
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
    print("Demo data seeded successfully.")
