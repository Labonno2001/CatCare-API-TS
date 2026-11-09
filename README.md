# CatCare API — TypeScript

A RESTful API for managing cat profiles, feeding records, water intake, and daily wellness summaries.

Built with TypeScript, Node.js, Express.js, and SQLite.

## Features

- Cat profile management (GET and PATCH)
- Feeding records CRUD operations
- Feeding summaries
- Water records CRUD operations
- Water consumption summaries
- Daily wellness reports
- SQLite database integration
- TypeScript strict type checking
- Request validation
- Centralized error handling
- JSON error responses

## Technology Stack

| Technology | Purpose |
|---|---|
| TypeScript | Programming language |
| Node.js | Runtime environment |
| Express.js | REST API framework |
| SQLite | Database |
| better-sqlite3 | Database integration |
| CORS | Cross-origin resource sharing |
| dotenv | Environment configuration |

## Project Structure

```text
CatCare-API-TS/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── database/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── wellness/
│   └── server.ts
├── data/
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Labonno2001/CatCare-API-TS.git
```

### 2. Navigate to the project

```bash
cd CatCare-API-TS
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start development server

```bash
npm run dev
```

The API runs at:

```text
http://127.0.0.1:3000
```

### 5. Build the project

```bash
npm run build
```

### 6. Start the compiled application

```bash
npm start
```

## API Documentation

All endpoints use the base URL:

`http://127.0.0.1:3000`

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check API and database status |

### Cat Profile

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cat` | Retrieve cat profile |
| PATCH | `/api/cat` | Update cat profile |

### Feeding Records

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/feeding` | Retrieve all feeding records |
| POST | `/api/feeding` | Create a feeding record |
| GET | `/api/feeding/summary` | Retrieve feeding summary |
| GET | `/api/feeding/:id` | Retrieve a record by ID |
| PATCH | `/api/feeding/:id` | Update a feeding record |
| DELETE | `/api/feeding/:id` | Delete a feeding record |

### Water Records

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/water` | Retrieve all water records |
| POST | `/api/water` | Create a water record |
| GET | `/api/water/summary` | Retrieve water summary |
| GET | `/api/water/:id` | Retrieve a record by ID |
| PATCH | `/api/water/:id` | Update a water record |
| DELETE | `/api/water/:id` | Delete a water record |

### Daily Wellness

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/wellness/daily?date=YYYY-MM-DD` | Retrieve daily wellness summary |

## Example Requests

### Create a feeding record

**POST** `/api/feeding`

```json
{
  "foodName": "Reflex Chicken",
  "quantityGrams": 50,
  "mealTime": "Morning",
  "notes": "Breakfast"
}
```

### Create a water record

**POST** `/api/water`

```json
{
  "offeredMl": 100,
  "consumedMl": 75,
  "measured": true,
  "notes": "Morning water intake"
}
```

### Update cat profile

**PATCH** `/api/cat`

```json
{
  "weightKg": 6.5
}
```

### Retrieve daily wellness

```text
GET /api/wellness/daily?date=2026-11-09
```

## Error Handling

The API provides structured JSON responses for:

- Invalid request data
- Malformed JSON
- Missing resources
- Unknown routes
- Unexpected server errors

## Database

The application uses SQLite through better-sqlite3.

The database is stored locally in the `data/` directory and is excluded from Git.

## GitHub Repository

https://github.com/Labonno2001/CatCare-API-TS

## Author

Developed as a TypeScript implementation of the original CatCare API project.
