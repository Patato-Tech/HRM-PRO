# HRMPro Enterprise 🏢

A full-stack, multi-tenant **HR Management System** built with modern technologies. Designed to manage multiple companies, employees, attendance, leaves, and payroll from a single platform.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | NestJS 11, TypeScript |
| Database | MySQL (via XAMPP) |
| ORM | Prisma 5.22.0 |
| Auth | JWT + bcryptjs |

---

## ✨ Features

### Platform Admin
- Register and manage multiple companies
- Create company admin accounts
- Activate / deactivate companies
- Assign subscription plans (Starter, Professional, Enterprise)
- Cross-company analytics (headcount, attendance rate, payroll)
- Inter-company employee transfer
- View all users across all companies
- Platform-wide stats dashboard

### Company Admin
- Full employee management (add, edit, deactivate, delete)
- Department management
- Role-based access control
- Company settings

### HR Manager
- Manage employee attendance (daily marking)
- Process and approve payroll
- Manage leave requests and balances
- View employee reports

### Department Manager
- View and manage own department employees
- Approve/reject leave requests
- Mark attendance

### Employee
- View own profile and details
- Apply for leaves
- View own attendance history
- View own payroll slips

---

## 🏗️ Project Structure

```
HRM PRO/
├── backend/          # NestJS API (Port 3000)
│   └── src/
│       ├── auth/
│       ├── employees/
│       ├── departments/
│       ├── attendance/
│       ├── leaves/
│       ├── payroll/
│       ├── platform/
│       └── prisma/
└── frontend/         # Next.js App (Port 3001)
    └── src/
        ├── app/
        │   ├── page.tsx           # Company login
        │   ├── admin/             # Platform admin
        │   └── dashboard/         # Company dashboard
        └── lib/
            ├── api.ts
            ├── auth.ts
            └── withAuth.tsx
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- XAMPP (MySQL)
- NestJS CLI (`npm i -g @nestjs/cli`)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/hrmpro-enterprise.git
cd hrmpro-enterprise
```

### 2. Setup Backend
```bash
cd backend
npm install
npx prisma db push
npx prisma generate
npm run start:dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev -- -p 3001
```

### 4. Access the App
| URL | Description |
|-----|-------------|
| http://localhost:3001 | Company User Login |
| http://localhost:3001/admin | Platform Admin Login |
| http://localhost:3000 | Backend API |

---

## 🔐 Role Hierarchy

```
SuperAdmin (Platform Admin)
  └── Manages all companies on the platform

Company Admin
  └── Full control inside their company

HR Manager
  └── Attendance, Leaves, Payroll

Department Manager
  └── Own department employees, Leave approvals

Employee
  └── Own data only
```

---

## 📡 API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | POST /auth/register, POST /auth/login |
| Employees | GET/POST/PUT/DELETE /employees |
| Departments | GET/POST/PUT/DELETE /departments |
| Attendance | GET/POST/PUT /attendance |
| Leaves | GET/POST/PUT /leaves |
| Payroll | GET/POST/PUT /payroll |
| Platform | GET/POST/PUT/DELETE /platform/companies |

---

## 🗄️ Database Schema

- **PlatformAdmin** — Super admin accounts
- **Company** — Registered companies
- **User** — All user accounts (linked to company)
- **Employee** — Employee profiles
- **Department** — Company departments
- **Attendance** — Daily attendance records
- **Leave** — Leave requests and balances
- **Payroll** — Monthly payroll records

---


