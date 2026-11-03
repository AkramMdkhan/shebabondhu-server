# Shebabondhu Server

Express + MongoDB REST API for **Shebabondhu**, a community platform to create, join and track social service events in Dhaka.

## Tech stack

- Node.js, Express 5, TypeScript
- MongoDB (official driver)
- JWT verification with `jose`, against the public keys published by Better Auth in the client app

## Getting started

```bash
npm install
npm run dev
```

Create a `.env` file in the project root:

```
PORT=5000
CLIENT_URL=http://localhost:3000
AUTH_URL=http://localhost:3000
MONGODB_URI=your_mongodb_connection_string
DB_NAME=shebabondhu
```

`AUTH_URL` is the address of the Next.js client, where Better Auth runs. The server reads its public keys from `AUTH_URL/api/auth/jwks` to verify tokens.

## Scripts

| Script          | What it does                    |
| --------------- | ------------------------------- |
| `npm run dev`   | Start the server with hot reload |
| `npm run build` | Compile TypeScript to `dist`    |
| `npm start`     | Run the compiled server         |

## API

Routes marked **JWT** need an `Authorization: Bearer <token>` header.

| Method | Route                         | Access     | Description                                      |
| ------ | ----------------------------- | ---------- | ------------------------------------------------ |
| GET    | `/`                           | Public     | Health check                                     |
| GET    | `/api/events`                 | Public     | Upcoming events, nearest first (`limit`, `type`, `search`) |
| GET    | `/api/events/:id`             | Public     | One event                                        |
| GET    | `/api/events/mine`            | JWT        | Events created by the logged-in user             |
| POST   | `/api/events`                 | JWT        | Create an event (date must be in the future)     |
| PATCH  | `/api/events/:id`             | JWT, owner | Update your own event                            |
| DELETE | `/api/events/:id`             | JWT, owner | Delete your own event and its joins              |
| POST   | `/api/joins`                  | JWT        | Join an event                                    |
| GET    | `/api/joins/status/:eventId`  | JWT        | Has the logged-in user joined this event?        |
| GET    | `/api/joins/mine`             | JWT        | Joined events, sorted by event date              |

## Security notes

- The creator's email is taken from the verified token, never from the request body.
- Only the creator can update or delete an event.
- Secrets live in `.env`, which is not committed.