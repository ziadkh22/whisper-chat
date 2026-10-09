# Whisper

Whisper is a real-time chat application built with Node.js, Express, MongoDB, Mongoose, and Socket.IO. Users can create accounts with optional avatars, create or join rooms, and chat with live messages, typing indicators, and room member presence.

## Features

- JWT-based registration and login
- Optional profile avatars
- Create rooms and view rooms you created or joined
- Real-time room messages and recent message history
- Room member list with online/offline status and typing indicators
- Responsive frontend with an emoji picker

## Requirements

- Node.js and npm
- A MongoDB connection string

## Setup

1. Install dependencies from this directory:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=replace_with_a_long_random_secret
   ```

   `PORT` is optional and defaults to `3000`. The app uses the MongoDB database named `whisper`.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Serve `Frontend/index.html` with a local web server such as VS Code Live Server. The frontend currently connects to the API and Socket.IO at `http://localhost:3000`.

The health endpoint is `GET http://localhost:3000/health` and returns `{ "status": "ok" }` when the server responds.

## API routes

Authentication routes:

| Method | Route | Description | Auth required |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account | No |
| `POST` | `/api/auth/login` | Log in and receive a JWT in `Token` | No |
| `GET` | `/api/auth/me` | Get the signed-in user's profile | Yes |

Room routes:

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/room/create` | Create a room |
| `GET` | `/api/room/myRooms` | List rooms created or joined by the signed-in user |
| `GET` | `/api/room/get` | List rooms |
| `GET` | `/api/room/getById/:id` | Get room details |
| `GET` | `/api/room/roomMessages/:id` | Get room messages; accepts `limit` and `skip` query parameters |

Room routes require an `Authorization: Bearer <token>` header.

## Socket.IO events

Connect to the server with the JWT in the Socket.IO query:

```js
const socket = io("http://localhost:3000", {
  query: { token: "YOUR_JWT" }
});
```

| Direction | Event | Payload |
| --- | --- | --- |
| Client → server | `join-room` | `{ roomid }` |
| Server → client | `joined-room` | `{ roomid }` |
| Client → server | `send-message` | `{ roomid, text }` |
| Server → room | `new-message` | Saved message with sender details and avatar |
| Server → room | `room-users` | Current room member list and presence/typing status |
| Client → server | `typing-start` / `typing-stop` | `{ roomid }` |

## Frontend pages

- `Frontend/index.html` — landing page
- `Frontend/pages/signup.html` — account registration and optional avatar upload
- `Frontend/pages/login.html` — login
- `Frontend/pages/rooms.html` — create rooms, join by ID, and open your rooms
- `Frontend/pages/chat-room.html` — room details, member list, history, and live chat
- `Frontend/assets/css/site.css` — shared styles
- `Frontend/assets/images/whisper-mark.svg` — logo and favicon

The chat pages load the Socket.IO client from a CDN, so the browser needs internet access for that script.
