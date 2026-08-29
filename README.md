# SewFlow

> A modern tailoring business operating system for managing customers, measurements, orders, production, fittings, payments, and business workflows.

SewFlow is a full-stack SaaS platform designed for tailors and fashion designers to manage their day-to-day operations from one place.

Instead of relying on notebooks, spreadsheets, WhatsApp messages, and scattered records, SewFlow brings the tailoring workflow into a single organized workspace.

---

## Overview

Running a tailoring business involves much more than sewing clothes.

A tailor needs to remember:

* Customer information
* Accurate measurements
* Previous measurements
* Clothing orders
* Production stages
* Deadlines
* Fittings
* Payments and outstanding balances
* Customer notes
* Which orders need attention

SewFlow is designed to solve this operational complexity.

The core workflow is:

```text
Customer
   ↓
Measurements
   ↓
Order
   ↓
Production
   ↓
Fitting
   ↓
Payment
   ↓
Ready
   ↓
Delivered
```

The long-term goal is to make SewFlow the operating system for modern tailoring businesses.

---

# Core Features

## Customer Management

Create and manage customer profiles containing:

* Full name
* Phone number
* Email
* Notes
* Order history
* Payment history
* Measurement history

---

## Measurement Management

Store structured tailoring measurements for each customer.

Example:

```text
Chest
Waist
Hip
Shoulder
Sleeve Length
Neck
Trouser Length
```

SewFlow preserves measurement history rather than overwriting previous records.

Example:

```text
August 2026
Chest: 39
Waist: 33

July 2026
Chest: 38
Waist: 32
```

This creates a reliable historical record that can later support intelligent measurement features.

---

## Order Management

Create and manage clothing orders with:

* Customer
* Garment type
* Fabric
* Price
* Amount paid
* Outstanding balance
* Deadline
* Production status
* Notes

Each order receives a unique identifier.

Example:

```text
Order #SF-1024
```

---

## Production Pipeline

Track every order through its production lifecycle:

```text
Design
   ↓
Cutting
   ↓
Sewing
   ↓
Fitting
   ↓
Ready
   ↓
Delivered
```

The goal is to give the tailor a clear answer to:

> What needs to be done next?

---

## Payment Tracking

Track the financial state of each order:

```text
Order Total
Amount Paid
Outstanding Balance
Payment Status
Payment Date
```

Example:

```text
Order: ₦45,000
Paid: ₦20,000
Balance: ₦25,000
```

Payment integrations such as Paystack are planned for a future phase.

---

## Dashboard

The dashboard gives the tailor a quick overview of business operations.

Key metrics include:

* Active orders
* Orders due soon
* Outstanding balances
* Revenue
* Production activity
* Upcoming fittings
* Orders requiring attention

---

## Deadline Intelligence

SewFlow is designed to eventually identify orders that may be at risk of missing their deadlines.

Example:

```text
HIGH RISK

This order is due in 2 days
and is currently in Cutting.
```

The goal is to move from passive record keeping to proactive workflow management.

---

# Product Architecture

SewFlow uses a separated frontend and backend architecture.

```text
┌──────────────────────┐
│      Next.js         │
│      Frontend        │
└──────────┬───────────┘
           │
           │ HTTP / REST API
           ▼
┌──────────────────────┐
│      Express.js      │
│       Backend        │
└──────────┬───────────┘
           │
           │ Prisma ORM
           ▼
┌──────────────────────┐
│     PostgreSQL       │
│      Database        │
└──────────────────────┘
```

The system is designed as a multi-tenant SaaS application.

Each business must only be able to access its own:

```text
Customers
Measurements
Orders
Payments
Business data
```

Cross-business data access must never be possible.

---

# Technology Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* React Hook Form
* Zod
* TanStack Query
* Axios
* Lucide React
* date-fns

## Backend

* Node.js
* Express.js
* TypeScript
* Prisma ORM
* Zod
* JWT
* bcryptjs
* Helmet
* CORS
* Morgan
* dotenv

## Database

* PostgreSQL

## Planned Integrations

* Paystack
* AI services
* Email notifications
* WhatsApp integrations
* Cloud storage

---

# Project Structure

```text
sewflow/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── customers/
│   │   ├── measurements/
│   │   ├── orders/
│   │   ├── dashboard/
│   │   └── payments/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── public/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── server.ts
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   └── package.json
│
├── .gitignore
├── README.md
└── package.json
```

---

# Getting Started

## Prerequisites

Make sure you have installed:

* Node.js 20+
* npm
* PostgreSQL
* Git

Verify your installation:

```bash
node --version
npm --version
git --version
```

---

# Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/sewflow.git

cd sewflow
```

## Frontend

```bash
cd frontend

npm install
```

Start the development server:

```bash
npm run dev
```

The frontend should be available at:

```text
http://localhost:3000
```

---

## Backend

Open another terminal:

```bash
cd backend

npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Configure your environment variables.

Example:

```env
PORT=5000

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/sewflow"

JWT_SECRET="replace-with-a-secure-secret"

FRONTEND_URL="http://localhost:3000"
```

Run the backend:

```bash
npm run dev
```

The API should be available at:

```text
http://localhost:5000
```

---

# Database Setup

From the `backend` directory:

Initialize Prisma:

```bash
npx prisma init
```

Create your database migration:

```bash
npx prisma migrate dev --name init
```

Generate Prisma Client:

```bash
npx prisma generate
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

# Environment Variables

Never commit secrets to Git.

Use `.env` for local development.

Example:

```env
# Application
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/sewflow"

# Authentication
JWT_SECRET="your-secret"

# Frontend
FRONTEND_URL="http://localhost:3000"
```

Production secrets should be managed through the deployment platform's environment-variable system.

---

# Development Principles

SewFlow follows several engineering principles.

### Separation of concerns

The frontend handles presentation and user interaction.

The backend handles:

* Business logic
* Authentication
* Authorization
* Validation
* Database operations

---

### Validation at the boundary

Incoming API data must be validated before reaching business logic.

Zod is used for request validation.

---

### Multi-tenant isolation

Every business-owned resource must be associated with its business.

Example:

```text
Business
 ├── Users
 ├── Customers
 ├── Measurements
 ├── Orders
 └── Payments
```

Queries must always enforce tenant ownership.

---

### Business logic belongs in services

Controllers should remain thin.

Preferred flow:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Prisma
  ↓
Database
```

---

### Do not duplicate business logic

Business rules should live in one place and be reused by the API wherever possible.

---

# Authentication

SewFlow will use authenticated business accounts.

The authentication system will eventually support:

```text
Business
   ↓
Users
   ↓
Roles
```

Potential roles include:

* Owner
* Manager
* Staff

Authorization must be enforced on the backend, not only in the frontend.

---

# Security

Security is a core part of the architecture.

The backend should implement:

* Password hashing
* Authentication
* Authorization
* Input validation
* HTTP security headers
* CORS restrictions
* Secure cookies/tokens
* Environment-based secrets
* Tenant-level data isolation
* Protection against unauthorized resource access

Sensitive information must never be exposed to the frontend unnecessarily.

---

# API Design

The backend will expose REST APIs.

Example endpoints:

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PATCH  /api/customers/:id
DELETE /api/customers/:id

GET    /api/customers/:id/measurements
POST   /api/customers/:id/measurements

GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id
DELETE /api/orders/:id

GET    /api/payments
POST   /api/payments
```

The exact API contract will evolve as development progresses.

---

# Roadmap

## Phase 1 — Foundation

* [x] Project structure
* [x] Frontend setup
* [x] Backend setup
* [x] Database setup
* [ ] Prisma schema
* [ ] Authentication
* [ ] Business/tenant architecture

## Phase 2 — Core Operations

* [ ] Customer management
* [ ] Measurement management
* [ ] Measurement history
* [ ] Order management
* [ ] Production pipeline
* [ ] Payment tracking

## Phase 3 — Business Intelligence

* [ ] Dashboard
* [ ] Deadline tracking
* [ ] Order risk detection
* [ ] Revenue insights
* [ ] Upcoming fittings

## Phase 4 — Communication

* [ ] Customer notifications
* [ ] Email notifications
* [ ] WhatsApp integration
* [ ] Automated reminders

## Phase 5 — Payments

* [ ] Paystack integration
* [ ] Payment verification
* [ ] Payment history
* [ ] Receipts

## Phase 6 — AI

* [ ] AI-assisted workflow insights
* [ ] Measurement assistance
* [ ] Intelligent deadline prediction
* [ ] Customer insights
* [ ] Design assistance

AI will be introduced where it provides measurable value rather than being added as a superficial feature.

---

# Design Philosophy

SewFlow should feel like a premium business tool.

The interface prioritizes:

* Clarity
* Speed
* Consistency
* Accessibility
* Excellent information hierarchy
* Minimal cognitive load
* Professional typography
* Strong responsive design

The product should feel closer to a modern professional SaaS platform than a traditional business-management dashboard.

---

# Contributing

This project is currently under active development.

Before submitting changes:

1. Keep frontend and backend responsibilities separate.
2. Follow the existing TypeScript conventions.
3. Validate external input.
4. Avoid unnecessary dependencies.
5. Keep components focused and reusable.
6. Do not commit secrets or `.env` files.
7. Test changes before opening a pull request.

---

# License

This project is currently proprietary.

All rights reserved.

The source code, product design, business logic, and associated intellectual property may not be redistributed, copied, or commercially reused without permission.

---

# Vision

SewFlow aims to become the digital operating system for modern tailoring businesses.

The vision is simple:

> **Make running a tailoring business as organized as running a modern software company.**

From the first customer measurement to the final delivery, SewFlow should make every step visible, organized, and easier to manage.

---

Built with ❤️ and engineering discipline.
