# 💍 Wedding Planner — Tasks & Expense Tracker

A beautiful, responsive Next.js wedding planning app with task management, payment tracking, and data persistence.

## Features

- **Task Management** — Add, edit, delete, and mark tasks as completed
- **Payment Tracking** — Total cost, amount paid, remaining balance with visual indicators
- **Notes & Details** — Expandable notes and contact info per task
- **Dashboard** — Live stats: total tasks, completed, budget vs spent
- **Progress Bar** — Overall wedding readiness percentage
- **Filters & Search** — Filter by status/category, sort by date or payment
- **Data Persistence** — All data saved to `data/tasks.json` via Next.js API routes

## Tech Stack

- **Next.js 14** (Pages Router)
- **React 18** with hooks
- **CSS Modules** — No external UI frameworks
- **Next.js API Routes** — Local JSON file as database

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
wedding-planner/
├── pages/
│   ├── _app.js          # Global CSS loader
│   ├── index.js         # Main app UI
│   └── api/
│       └── tasks.js     # CRUD API routes
├── components/
│   └── TaskCard.js      # Reusable task card
├── styles/
│   ├── globals.css      # Design system & base styles
│   ├── Home.module.css  # Page layout styles
│   └── TaskCard.module.css  # Card component styles
├── data/
│   └── tasks.json       # Local JSON database
└── next.config.js
```

## API Routes

| Method | Path              | Description      |
|--------|-------------------|------------------|
| GET    | /api/tasks        | Fetch all tasks  |
| POST   | /api/tasks        | Create new task  |
| PUT    | /api/tasks?id=:id | Update task      |
| DELETE | /api/tasks?id=:id | Delete task      |

## Categories

venue · catering · decoration · photography · music · attire · stationery · transport · other
