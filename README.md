# EmpowerHer

### A Multi-Role Digital Platform for Women Entrepreneurs

EmpowerHer is a full-stack-style React application designed to create a connected ecosystem for **women founders, mentors, investors, and administrators**.

The platform brings together startup discovery, mentorship, funding opportunities, pitch evaluation, communication, analytics, and administrative management into a single role-based application.

> **Built with React, TypeScript, Vite, Firebase, Tailwind CSS, and modern UI libraries.**

---

## 🚀 Overview

Building and growing a startup often requires access to the right mentors, funding opportunities, communities, and resources.

**EmpowerHer addresses this by connecting the major participants in the startup ecosystem through dedicated experiences:**

* 👩‍💼 **Founders** can manage their startup journey, submit pitches, connect with mentors and investors, and track progress.
* 🧑‍🏫 **Mentors** can discover founders, review pitches, evaluate readiness, manage sessions, and communicate with founders.
* 💼 **Investors** can explore startups, review startup information, manage funding requests, connect with founders, and participate in deal rooms.
* 🛡️ **Administrators** can manage the platform, monitor applications, founders, mentors, investors, pitches, reports, revenue, and community activity.

---

## ✨ Key Features

### 👩‍💼 Founder Experience

* Founder dashboard
* Founder profile management
* Startup pitch submission
* Mentor matching
* Funding discovery
* Investor communication
* Founder–investor deal room
* Chat and messaging
* Training resources
* Startup progress tracking
* Readiness evaluation
* Funding opportunities

### 🧑‍🏫 Mentor Experience

* Mentor dashboard
* Founder discovery
* My Founders workspace
* Founder profiles and details
* Session requests
* Session tracking
* Pitch review
* Founder readiness evaluation
* Founder progress tracking
* Funding matching
* Mentor workspace
* Chat and messaging
* Reviews and feedback
* Analytics
* Profile management

### 💼 Investor Experience

* Investor dashboard
* Explore startups
* Startup details
* Interested startups
* Funding requests
* Mentor recommendations
* Meetings
* Analytics
* Messaging
* Investor deal room

### 🛡️ Admin Experience

The administrative dashboard provides centralized platform management, including:

* Dashboard overview
* Founder management
* Mentor management
* Investor management
* Application management
* Pitch review
* Community management
* Messages
* Reports
* Revenue
* Platform settings
* Statistics and analytics

---

## 🔐 Authentication & Authorization

EmpowerHer uses **Firebase Authentication** for user authentication and a protected routing architecture for application access.

The application includes:

* Sign in
* Sign up
* Authentication state management
* Protected routes
* Role-specific application areas
* Firebase Auth integration
* Firestore integration
* Firebase Storage integration

The application uses a reusable `AuthContext` and `ProtectedRoute` to control access to authenticated areas.

### Role-based application areas

```text
/admin/*
/founder/*
/mentor/*
/investor/*
```

---

## 🏗️ Application Architecture

The application follows a modular React architecture with separate experiences for each major user role.

```text
src/
├── components/
│   └── ProtectedRoute.tsx
│
├── context/
│   └── AuthContext.tsx
│
├── pages/
│   ├── Auth/
│   │   ├── SignIn.tsx
│   │   └── SignUp.tsx
│   │
│   ├── Admin/
│   │   ├── Dashboard
│   │   ├── Founders
│   │   ├── Mentors
│   │   ├── Investors
│   │   ├── Applications
│   │   ├── ReviewPitch
│   │   ├── Community
│   │   ├── Messages
│   │   ├── Reports
│   │   ├── Revenue
│   │   └── Settings
│   │
│   ├── Founder/
│   │   ├── Dashboard
│   │   ├── FounderProfile
│   │   ├── MentorMatching
│   │   ├── PitchSubmission
│   │   ├── Funding
│   │   ├── Training
│   │   ├── Chat
│   │   └── DealRoom
│   │
│   ├── Mentor/
│   │   ├── Dashboard
│   │   ├── MyFounders
│   │   ├── SessionRequests
│   │   ├── SessionTracking
│   │   ├── ReviewPitch
│   │   ├── ReadinessEvaluation
│   │   ├── FounderProgress
│   │   ├── FundingMatch
│   │   ├── Analytics
│   │   ├── Messages
│   │   └── Workspace
│   │
│   └── Investors/
│       ├── Dashboard
│       ├── ExploreStartups
│       ├── StartupDetails
│       ├── FundingRequests
│       ├── MentorRecommendations
│       ├── Meetings
│       ├── Analytics
│       ├── Messages
│       └── DealRoom
│
├── firebase.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## 🛠️ Tech Stack

### Frontend

* **React 18**
* **TypeScript**
* **Vite**
* **React Router**
* **Tailwind CSS**

### Backend / Cloud Services

* **Firebase Authentication**
* **Cloud Firestore**
* **Firebase Storage**

### UI & Experience

* **Radix UI**
* **Framer Motion**
* **Lucide React**
* **Recharts**
* **React Hook Form**
* **Sonner**
* **Embla Carousel**
* **CMDK**

### Development Tools

* **ESLint**
* **TypeScript ESLint**
* **PostCSS**
* **Autoprefixer**

---

## 📊 Dashboard & Analytics

The platform includes dedicated dashboards for different roles instead of using a single generic interface.

This allows each user type to access workflows relevant to their responsibilities.

Examples include:

* Founder progress
* Startup discovery
* Funding activity
* Mentor–founder relationships
* Pitch evaluation
* Platform statistics
* Investor analytics
* Administrative reporting

---

## 🤝 Platform Workflow

A typical platform workflow looks like:

```text
                ┌───────────────┐
                │    Founder    │
                └───────┬───────┘
                        │
             Submit Startup / Pitch
                        │
                        ▼
                ┌───────────────┐
                │    Mentor     │
                └───────┬───────┘
                        │
              Evaluation & Guidance
                        │
                        ▼
                ┌───────────────┐
                │    Investor   │
                └───────┬───────┘
                        │
              Funding / Deal Room
                        │
                        ▼
                ┌───────────────┐
                │    Startup    │
                │    Growth     │
                └───────────────┘
```

Administrators provide centralized oversight across the ecosystem.

---

## 📱 User Experience

EmpowerHer is designed as a responsive, dashboard-oriented web application with:

* Role-specific navigation
* Reusable UI components
* Interactive dashboards
* Cards and data visualizations
* Forms and dialogs
* Notifications
* Responsive layouts
* Modern visual design
* Dedicated workflows for each user role

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* Git

### 1. Clone the repository

```bash
git clone https://gitlab.com/kotiansanjana/empowerher.git
cd empowerher
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Create your Firebase project and configure the required Firebase services:

* Authentication
* Firestore
* Storage

For production deployments, Firebase configuration should be supplied through environment variables rather than committed directly to the repository.

Example:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Start the development server

```bash
npm run dev
```

The application will be available at the local Vite development URL.

---

## 📦 Production Build

Create a production build with:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Run ESLint:

```bash
npm run lint
```

---

## 🔑 Main Routes

| Route         | Purpose                 |
| ------------- | ----------------------- |
| `/`           | EmpowerHer landing page |
| `/signin`     | User authentication     |
| `/signup`     | User registration       |
| `/admin/*`    | Administration portal   |
| `/founder/*`  | Founder experience      |
| `/mentor/*`   | Mentor experience       |
| `/investor/*` | Investor experience     |

---

## 🎯 What This Project Demonstrates

This project demonstrates practical experience with:

* Component-based React development
* TypeScript application development
* SPA routing with React Router
* Authentication state management
* Protected routes
* Role-based application architecture
* Firebase integration
* Cloud data services
* Responsive dashboard design
* Reusable UI components
* Form handling
* Data visualization
* Modular frontend architecture
* Multi-user product design

---

## 📌 Project Status

**Completed**

EmpowerHer is a completed project implementing a multi-role startup ecosystem platform for founders, mentors, investors, and administrators.

---

## 👩‍💻 Project

**EmpowerHer — Women Entrepreneurship Platform**

Repository:
https://gitlab.com/kotiansanjana/empowerher

---

## 📄 License

This project was developed as a project implementation and is intended primarily for educational and portfolio purposes.
