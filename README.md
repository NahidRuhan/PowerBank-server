# PowerBank ⚡

**"Digitize and Automate Load Shedding & Power Outage Management"**

🚀 **Live Demo:** [https://power-bank-server.vercel.app](https://power-bank-server.vercel.app) *(Example Deployment)*

PowerBank is a comprehensive backend API for electricity distribution utilities. It bridges the gap between grid operators managing the infrastructure and everyday consumers. Operators can schedule load shedding, manage grid hierarchies, and respond to incidents. Customers can report outages, track schedules, and pay their electricity bills. Admins oversee the entire platform, setting quotas and monitoring grid fairness.

## Features

### 👤 Customer Features

- Register and login securely using email or Google OAuth.
- View real-time load shedding schedules for your specific area.
- Report sudden power outages (incidents) and upload photos of the fault.
- Receive SMS and Email notifications regarding power cuts and restorations.
- **Make secure payments via Stripe** for monthly electricity bills.
- Track billing history and payment statuses.

### 👷 Operator Features

- Manage grid infrastructure (Zones, Substations, Feeders, Areas).
- Create and activate scheduled load shedding on specific feeders.
- Automatically sync feeder statuses (`ENERGIZED`, `LOAD_SHED`, `FAULT`).
- Acknowledge and resolve outage incidents reported by customers.
- Receive fairness warnings if a neighborhood is being disproportionately shed.

### 🛡️ Admin Features

- View and manage all system users and assign roles.
- Set MW (Megawatt) shedding quotas for operators to fulfill.
- Generate monthly electricity bills for customers.
- View system-wide analytics, including revenue and grid fairness statistics.
- Access detailed audit logs tracking every change made in the system.

## 🛠️ Tech Stack

- **Framework**: Node.js + Express
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (Access & Refresh tokens) & Google OAuth
- **Caching & Rate Limiting**: Redis (ioredis)
- **Payment Gateway**: Stripe Checkout & Webhooks
- **Media Storage**: Cloudinary
- **Notifications**: Resend (Emails) & Twilio (SMS)

## 🗄️ Database Models

- **Users**: Stores user information, avatars, and role (`ADMIN`, `OPERATOR`, `CUSTOMER`).
- **Infrastructure**: Hierarchical grid models including `DistributionZone`, `Substation`, `Feeder`, and `Area`.
- **Meters**: Represents physical customer electric meters linked to areas.
- **SheddingQuotas**: MW reduction targets set by admins.
- **ScheduledOutages**: Planned power cuts linked to specific feeders.
- **OutageIncidents & Reports**: Tracks unexpected faults, repairs, and customer reports.
- **Bills & Payments**: Tracks monthly electricity bills and secure Stripe transactions.
- **AuditLogs**: Automatically tracks creates, updates, and deletes across the system.

## 📦 Dependencies

The backend server relies on a robust ecosystem of Node.js libraries, TypeScript, and Prisma ORM.

### Core Dependencies
- **Core Framework & Utils:** `express` (^4.18.2), `dotenv` (^16.3.1), `zod` (^3.22.4)
- **Database & ORM:** `@prisma/client` (^7.10.0), `@prisma/adapter-pg` (^7.10.0), `pg` (^8.23.0)
- **Security & Middleware:** `cors` (^2.8.5), `helmet` (^7.1.0), `bcryptjs` (^2.4.3), `jsonwebtoken` (^9.0.2), `express-rate-limit` (^7.1.5)
- **Payments & Media:** `stripe` (^14.19.0), `cloudinary` (^2.11.0), `multer` (^2.3.0)
- **Caching:** `ioredis` (^5.3.2)
- **Authentication:** `passport` (^0.7.0), `passport-google-oauth20` (^2.0.0)

### Development Dependencies
- **TypeScript & Execution:** `typescript` (^5.3.3), `tsx` (^4.7.1)
- **Database Tooling:** `prisma` (^7.10.0)
- **Linting & Formatting:** `@biomejs/biome` (^1.5.0)

## 📚 API Documentation

Below is a summary of the available endpoints. For full documentation, please import the included **Postman Collection** (`powerbank_collection.json`).

### 🔐 Authentication & Users
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Login user, get tokens |
| `POST` | `/api/v1/auth/refresh-token` | Refresh access token |
| `POST` | `/api/v1/auth/forgot-password`| Initiate password reset |
| `POST` | `/api/v1/auth/reset-password` | Reset password using OTP |
| `GET`  | `/api/v1/auth/google` | Google OAuth Login |
| `GET`  | `/api/v1/users/me` | Get current user profile |
| `PATCH`| `/api/v1/users/me` | Update user profile |

### ⚡ Infrastructure Management
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/zones` | Create a distribution zone |
| `GET`  | `/api/v1/zones` | Get all zones |
| `POST` | `/api/v1/substations` | Create a substation |
| `POST` | `/api/v1/feeders` | Create a feeder |
| `POST` | `/api/v1/areas` | Create a residential/commercial area |

### 📅 Load Shedding & Schedules
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/quotas` | Admin sets a shedding quota |
| `POST` | `/api/v1/schedules` | Operator creates a planned outage |
| `GET`  | `/api/v1/schedules` | Get all scheduled outages |
| `PATCH`| `/api/v1/schedules/:id/status`| Update schedule status (`ACTIVE`, `COMPLETED`) |
| `GET`  | `/api/v1/schedules/fairness` | Get grid fairness analytics |

### 🚨 Incident Management
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/incidents/report` | Customer reports a blackout |
| `GET`  | `/api/v1/incidents` | Get all incidents |
| `PATCH`| `/api/v1/incidents/:id/status`| Operator updates repair status |

### 💳 Billing & Payments (Stripe)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/bills/generate` | Admin generates monthly bills |
| `GET`  | `/api/v1/bills/my-bills` | Customer views their bills |
| `POST` | `/api/v1/payments/initiate` | Create a Stripe checkout session |
| `POST` | `/api/v1/payments/webhook` | Stripe webhook for payment confirmation |

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/PowerBank.git
   cd PowerBank/powerbank-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and add your database, Redis, and secret keys:
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL="postgresql://user:password@localhost:5432/powerbank"
   REDIS_URL="redis://localhost:6379"
   JWT_SECRET="your_access_secret"
   JWT_REFRESH_SECRET="your_refresh_secret"
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   CLOUDINARY_CLOUD_NAME="..."
   RESEND_API_KEY="..."
   TWILIO_ACCOUNT_SID="..."
   ```

4. **Run Prisma Migrations & Seed Data**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Testing with Postman**
   A complete Postman collection is included: `powerbank_collection.json`. Import this file into Postman to easily test all available endpoints.

## 🌍 Deployment

This backend is designed as a Serverless application and includes a `vercel.json` configuration file, making it ready for 1-click deployment on **Vercel** or traditional deployment on **Render**.
