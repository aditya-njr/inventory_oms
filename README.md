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

## Business Rules

- Product SKU must be unique (409 Conflict on duplicate)
- Customer email must be unique (409 Conflict on duplicate)
- Product quantity cannot be negative
- Orders rejected if insufficient inventory (400 Bad Request)
- Creating an order automatically reduces stock
- Order total is calculated server-side from product prices
- Cancelling an order restores product stock

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

## Deployment Guide

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Inventory OMS"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/inventory-oms.git
git push -u origin main
```

### Step 2: Build and push backend to Docker Hub

```bash
# Log in to Docker Hub
docker login

# Build the backend image
docker build -t YOUR_DOCKERHUB_USERNAME/inventory-oms-backend:latest ./backend

# Push to Docker Hub
docker push YOUR_DOCKERHUB_USERNAME/inventory-oms-backend:latest
```

**Submission deliverable:** `https://hub.docker.com/r/YOUR_DOCKERHUB_USERNAME/inventory-oms-backend`

### Step 3: Deploy backend on Render

1. Go to [render.com](https://render.com) and sign up / log in.
2. Click **New +** → **Blueprint** (or create services manually).
3. Connect your GitHub repo and select `render.yaml`, **or** create manually:
   - **PostgreSQL database** (free tier): note the Internal/External connection string.
   - **Web Service** (free tier):
     - Runtime: **Docker**
     - Image: `YOUR_DOCKERHUB_USERNAME/inventory-oms-backend:latest`
     - Health Check Path: `/health`
4. Set environment variables on the web service:

   | Key                   | Value                              |
   | --------------------- | ---------------------------------- |
   | `DATABASE_URL`        | Render Postgres connection string  |
   | `FRONTEND_ORIGIN`     | Your Vercel URL (set after Step 4) |
   | `LOW_STOCK_THRESHOLD` | `5`                                |

5. Deploy and note your backend URL, e.g. `https://inventory-oms-backend.onrender.com`.

**Submission deliverable:** Live backend API URL

> **Note:** Render free tier spins down after inactivity. First request may take ~30 seconds.

### Step 4: Deploy frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up / log in.
2. Click **Add New Project** → import your GitHub repo.
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Create React App
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
4. Add environment variable:

   | Key                 | Value                               |
   | ------------------- | ----------------------------------- |
   | `REACT_APP_API_URL` | `https://your-backend.onrender.com` |

5. Deploy and note your frontend URL, e.g. `https://inventory-oms.vercel.app`.

**Submission deliverable:** Live frontend URL

### Step 5: Final CORS configuration

After Vercel deploys, go back to Render and update:

```
FRONTEND_ORIGIN=https://your-frontend.vercel.app
```

Redeploy the backend service. Verify the frontend can load data from the API.

### Deployment Checklist

- [ ] GitHub repo is public/accessible
- [ ] Backend Docker image pushed to Docker Hub
- [ ] Render backend is live and `/health` returns `{"status":"healthy"}`
- [ ] Render Postgres is connected (`DATABASE_URL` set)
- [ ] Vercel frontend is live
- [ ] `REACT_APP_API_URL` points to Render backend
- [ ] `FRONTEND_ORIGIN` on Render matches Vercel URL
- [ ] Create product/customer/order flows work end-to-end on production

---

## Development (without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Update DATABASE_URL for local Postgres
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

## License

MIT
