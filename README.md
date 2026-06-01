# Inventory & Order Management System

A full-stack application for managing products, customers, orders, and inventory tracking.

**Stack:** React · FastAPI · PostgreSQL · Docker · Docker Compose

## Features

- **Product Management** — CRUD with unique SKU validation and stock tracking
- **Customer Management** — Create, list, view, and delete customers (unique email)
- **Order Management** — Multi-item orders with automatic total calculation and stock deduction
- **Dashboard** — Summary stats and low-stock alerts
- **Fully containerized** — Docker Compose runs frontend, backend, and PostgreSQL

## Project Structure

```
inventory_oms/
├── backend/          # FastAPI API
├── frontend/         # React SPA
├── docker-compose.yml
├── render.yaml       # Render deployment blueprint
└── README.md
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [Git](https://git-scm.com/)

## Quick Start (Local)

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd inventory_oms
cp .env.example .env
```

### 2. Start all services

```bash
docker compose up --build
```

### 3. Access the application

| Service  | URL                        |
| -------- | -------------------------- |
| Frontend | http://localhost:3000      |
| Backend  | http://localhost:8000      |
| API Docs | http://localhost:8000/docs |

### 4. (Optional) Seed demo data

```bash
docker compose exec backend python -m app.seed
```

## API Endpoints

### Products

| Method | Endpoint         | Description       |
| ------ | ---------------- | ----------------- |
| POST   | `/products`      | Create product    |
| GET    | `/products`      | List all products |
| GET    | `/products/{id}` | Get product by ID |
| PUT    | `/products/{id}` | Update product    |
| DELETE | `/products/{id}` | Delete product    |

### Customers

| Method | Endpoint          | Description        |
| ------ | ----------------- | ------------------ |
| POST   | `/customers`      | Create customer    |
| GET    | `/customers`      | List all customers |
| GET    | `/customers/{id}` | Get customer by ID |
| DELETE | `/customers/{id}` | Delete customer    |

### Orders

| Method | Endpoint       | Description                   |
| ------ | -------------- | ----------------------------- |
| POST   | `/orders`      | Create order (deducts stock)  |
| GET    | `/orders`      | List all orders               |
| GET    | `/orders/{id}` | Get order details             |
| DELETE | `/orders/{id}` | Cancel order (restores stock) |

### Dashboard

| Method | Endpoint             | Description            |
| ------ | -------------------- | ---------------------- |
| GET    | `/dashboard/summary` | Stats + low-stock list |

### Health

| Method | Endpoint  | Description  |
| ------ | --------- | ------------ |
| GET    | `/health` | Health check |

## Environment Variables

| Variable              | Description                             | Default (local)                                                   |
| --------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| `POSTGRES_USER`       | Database username                       | `inventory_user`                                                  |
| `POSTGRES_PASSWORD`   | Database password                       | `inventory_pass`                                                  |
| `POSTGRES_DB`         | Database name                           | `inventory_db`                                                    |
| `DATABASE_URL`        | SQLAlchemy connection string            | `postgresql://inventory_user:inventory_pass@db:5432/inventory_db` |
| `FRONTEND_ORIGIN`     | Allowed CORS origin(s), comma-separated | `http://localhost:3000`                                           |
| `REACT_APP_API_URL`   | Backend URL for React frontend          | `http://localhost:8000`                                           |
| `LOW_STOCK_THRESHOLD` | Stock level for low-stock alerts        | `5`                                                               |

---

## License

MIT
