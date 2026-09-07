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

Below is the complete list of available endpoints. For full documentation including headers and request bodies, please import the included **Postman Collection** (`powerbank_collection.json`).

### 1. Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register |
| `POST` | `/api/v1/auth/login` | Login |
| `POST` | `/api/v1/auth/refresh-token` | Refresh Token |
| `POST` | `/api/v1/auth/logout` | Logout |
| `POST` | `/api/v1/auth/forgot-password` | Forgot Password |
| `POST` | `/api/v1/auth/reset-password` | Reset Password |
| `GET` | `/api/v1/auth/google` | Google OAuth Login |
| `GET` | `/api/v1/auth/google/callback` | Google OAuth Callback |

### 2. Users
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/users/me` | Get Profile |
| `PATCH` | `/api/v1/users/me` | Update Profile |
| `PATCH` | `/api/v1/users/me/password` | Change Password |

### 3. Infrastructure (Zones)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/zones` | Create Zone |
| `GET` | `/api/v1/zones` | Get All Zones |
| `GET` | `/api/v1/zones/:id` | Get Zone By ID |
| `PATCH` | `/api/v1/zones/:id` | Update Zone |
| `DELETE` | `/api/v1/zones/:id` | Delete Zone |

### 4. Infrastructure (Substations)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/substations` | Create Substation |
| `GET` | `/api/v1/substations` | Get All Substations |
| `PATCH` | `/api/v1/substations/:id` | Update Substation |
| `DELETE` | `/api/v1/substations/:id` | Delete Substation |
| `GET` | `/api/v1/substations/:id` | Get Substation By ID |

### 5. Infrastructure (Feeders)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/feeders` | Create Feeder |
| `GET` | `/api/v1/feeders` | Get All Feeders |
| `PATCH` | `/api/v1/feeders/:id/status` | Update Feeder Status |
| `DELETE` | `/api/v1/feeders/:id` | Delete Feeder |
| `GET` | `/api/v1/feeders/:id` | Get Feeder By ID |
| `PATCH` | `/api/v1/feeders/:id` | Update Feeder Details |

### 6. Infrastructure (Areas)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/areas` | Create Area |
| `GET` | `/api/v1/areas` | Get All Areas |
| `GET` | `/api/v1/areas/search?q=Mirpur` | Search Areas |
| `PATCH` | `/api/v1/areas/:id` | Update Area |
| `DELETE` | `/api/v1/areas/:id` | Delete Area |
| `GET` | `/api/v1/areas/:id` | Get Area By ID |

### 7. Quotas
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/quotas` | Create Quota |
| `GET` | `/api/v1/quotas` | Get All Quotas |
| `GET` | `/api/v1/quotas/:id` | Get Quota By ID |

### 8. Schedules
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/schedules` | Create Schedule |
| `GET` | `/api/v1/schedules` | Get All Schedules |
| `PATCH` | `/api/v1/schedules/:id/status` | Update Schedule Status |
| `GET` | `/api/v1/schedules/fairness` | Get Fairness Stats |
| `GET` | `/api/v1/schedules/:id` | Get Schedule By ID |
| `DELETE` | `/api/v1/schedules/:id` | Delete Schedule |

### 9. Incidents
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/incidents` | Create Incident |
| `GET` | `/api/v1/incidents` | Get All Incidents |
| `PATCH` | `/api/v1/incidents/:id` | Update Incident |
| `PATCH` | `/api/v1/incidents/:id` | Resolve Incident |
| `GET` | `/api/v1/incidents/:id` | Get Incident By ID |

### 10. Bills
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/bills/generate` | Generate Bills |
| `GET` | `/api/v1/bills` | Get All Bills (Admin) |
| `GET` | `/api/v1/bills/my-bills` | Get My Bills (Customer) |
| `POST` | `/api/v1/bills/process-overdue` | Process Overdue Bills |
| `GET` | `/api/v1/bills/:id` | Get Bill By ID |

### 11. Payments
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/payments/initiate` | Initiate Payment |
| `GET` | `/api/v1/payments/my-payments` | Get My Payments |
| `POST` | `/api/v1/payments/:id/refund` | Refund Payment (Admin) |

### 12. Admin
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/admin/dashboard` | Get Dashboard Stats |
| `GET` | `/api/v1/admin/users` | Get All Users |
| `PATCH` | `/api/v1/admin/users/:id/role` | Update User Role |
| `DELETE` | `/api/v1/admin/users/:id` | Delete User |
| `GET` | `/api/v1/admin/audit-logs` | Get Audit Logs |

### 13. Meters
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/meters` | Create Meter |
| `GET` | `/api/v1/meters` | Get All Meters |
| `DELETE` | `/api/v1/meters/:id` | Delete Meter |

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
   Create a `.env` file in the root directory and add all the required API keys (matching `.env.example`):
   ```env
   NODE_ENV="development"
   PORT="5000"
   BASE_URL="http://localhost:5000"
   DATABASE_URL=""
   REDIS_URL=""
   JWT_SECRET=""
   JWT_REFRESH_SECRET=""
   
   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""
   GOOGLE_CALLBACK_URL=""
   
   # Notification Service
   RESEND_API_KEY=""
   RESEND_FROM_EMAIL=""
   
   TWILIO_ACCOUNT_SID=""
   TWILIO_AUTH_TOKEN=""
   TWILIO_PHONE_NUMBER=""
   
   # Payment Service (Stripe)
   STRIPE_SECRET_KEY=""
   STRIPE_WEBHOOK_SECRET=""
   
   # File Upload (Cloudinary)
   CLOUDINARY_CLOUD_NAME=""
   CLOUDINARY_API_KEY=""
   CLOUDINARY_API_SECRET=""
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
