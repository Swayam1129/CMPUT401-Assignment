Your full name: Swayam Sagar
Your CCID: swayam2
Your github username: Swayam1129
Did you have extra credit frontend: Yes
Did you have extra credit tests: Yes

I have 1. Frontend and 2. API Tests.

## About

REST API for campus news items, built with Node.js, Express and SQLite.

- API: `/api/v1/items` (GET list with `limit`/`offset`, GET by id, POST, PATCH, DELETE)
- Health check: `/health`
- API docs: `/docs` (Swagger UI) and `/openapi.json`
- Frontend: `/`

## Run locally

    npm install
    npm start

The server listens on port 8080. On first start it creates `data/app.db` and loads the 20 items from `seed.json`.

## Run with Docker

    docker build -t a1 .
    docker run --rm -p 8080:8080 a1

## Tests

    npm test

Tests cover `GET /api/v1/items` (default page size, item shape, limit, limit cap, offset, and invalid parameters). They use a temporary database, so they don't affect `data/app.db`.