# PowerBank API

**PowerBank** is a comprehensive backend management system built for electricity distribution utilities. Its primary goal is to digitize and automate the management of **load shedding** (planned power cuts) and **unexpected outages** (faults/accidents) across a geographical power grid. 

It bridges the gap between grid operators managing the infrastructure and everyday consumers paying their bills and waiting for power restoration.

## 📖 Project Overview

The system is built around a strict electrical hierarchy:
**Zone** ➔ **Substation** ➔ **Feeder** ➔ **Area** ➔ **Customer**

If a feeder is tripped or scheduled for an outage, all areas and customers connected to that feeder lose power simultaneously. The entire backend logic revolves around this rule.

For a deeper dive into the architecture, roles, and workflows, please read the [Project Overview](./docs/project_overview.md).

## ✨ Key Features

- **Strict Role-Based Access Control (RBAC)**: Supports three distinct user roles (`Customer`, `Operator`, `Admin`) with fine-grained permissions.
- **Infrastructure Management**: Define and manage the grid hierarchy. Built-in safeguards prevent scheduling outages on `CRITICAL` areas (e.g., hospitals).
- **Automated Load Shedding**: Admins set targets (MW quotas), operators schedule outages, and the system automatically syncs feeder statuses when schedules become active.
- **Incident Management**: Customers report blackouts. The system maps the report to the corresponding feeder and tracks the repair through a strict state machine (`INVESTIGATING` ➔ `REPAIRING` ➔ `RESOLVED`).
- **Billing & Payments**: Admins trigger monthly bill generation. Customers can view their bills and pay securely via **Stripe Integration**.
- **Comprehensive Analytics & Auditing**: Admins have access to dashboards tracking revenue, outages, and grid fairness. A Prisma middleware automatically logs all creates, updates, and deletes (Audit Logging).
- **Security & Authentication**: Uses JWT (Access & Refresh tokens) and includes support for Google OAuth.
- **Media Uploads**: Avatars and incident photos are directly uploaded to **Cloudinary** using Multer middleware.

## 🛠️ Tech Stack

- **Framework**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod (for strict incoming request validation)
- **Caching & Rate Limiting**: Redis (ioredis)
- **Payments**: Stripe Checkout Sessions & Webhooks
- **Authentication**: JWT, Passport.js (Google OAuth)
- **File Storage**: Cloudinary (via Multer)
- **Deployment**: Configured for Vercel Serverless deployment (`vercel.json` included)

## 📁 Repository Structure

```
.
├── docs/                   # Detailed documentation, specs, and testing guides
├── powerbank-server/       # The core Express/TypeScript backend server
│   ├── prisma/             # Prisma schema and migrations
│   ├── src/                # Application source code
│   └── powerbank_collection.json # Complete Postman API collection
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL
- Redis
- API Keys for Stripe, Cloudinary, and Google OAuth (optional, depending on the features you're testing)

### Installation & Setup

1. **Clone and navigate to the server directory**:
   ```bash
   cd powerbank-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Copy the example environment file and fill in your actual credentials.
   ```bash
   cp .env.example .env
   ```

4. **Database Setup**:
   Apply migrations to your PostgreSQL database.
   ```bash
   npm run db:migrate
   ```
   *(Optional)* If you have a seed script, you can run `npm run db:seed`.

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The server will start running with `tsx watch`.

## 🧪 API Documentation

The complete API documentation is provided as a **Postman Collection**.

1. Open Postman or Thunder Client.
2. Import the file located at: `powerbank-server/powerbank_collection.json`
3. Set the `baseUrl` variable to your local server (e.g., `http://localhost:5000/api/v1`).
4. Most protected routes require authentication. Use the `1. Auth` folder endpoints to login and obtain an access token, which will automatically be stored in your Postman variables.
