# Exist AI Recruiter

AI-powered recruitment platform by Exist Software Labs.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **API Server**: Express.js + node-postgres
- **Database**: Azure PostgreSQL 17

## Local Setup

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Install server dependencies

```bash
cd server && npm install
```

### 3. Configure environment

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3001

PGHOST=your-azure-pg-host
PGUSER=your-username
PGPORT=5432
PGDATABASE=postgres
PGPASSWORD=your-password
```

### 4. Start the API server

```bash
cd server && npm run dev
```

### 5. Start the frontend

```bash
npm run dev
```

The frontend runs at `http://localhost:8080` and the API at `http://localhost:3001`.
