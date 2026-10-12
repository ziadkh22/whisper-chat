# Whisper

Whisper is a real-time chat application built with Node.js, Express, MongoDB, Mongoose, and Socket.IO. Users can create accounts with optional avatars, create or join rooms, and chat with live messages, typing indicators, and room member presence.

## Features

- JWT-based registration and login
- Optional profile avatars
- Create rooms and view rooms you created or joined
- Create private rooms and invite existing users by username
- Restrict private-room access to the creator and invited members
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

4. Open `http://localhost:3000` after starting the server. Express serves `Frontend/` and the frontend connects to the API and Socket.IO on the same origin.

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

### Creating a room

`POST /api/room/create` accepts the room name, description, privacy setting, and an optional array of usernames to invite:

```json
{
  "name": "Weekend plans",
  "description": "Planning the trip",
  "isprivate": true,
  "members": ["alex", "sam"]
}
```

The frontend's invite field accepts usernames separated by commas, semicolons, or new lines. Usernames must match existing accounts exactly. If a username is not found, room creation fails and the response identifies the unknown username(s).

The server resolves usernames to user IDs and stores those IDs as room members. The creator is also added automatically. When a user tries to join a private room through Socket.IO, the server allows the creator and invited members; other users are rejected. Joining adds the user's ID to the room's member list, so the room appears under **Your joined rooms**.

Rooms created before username invitations were fixed may contain usernames in their member list. Create a new room to use the corrected ID-based membership.

## Socket.IO events

Connect to the server with the JWT in the Socket.IO query:

```js
const socket = io(window.location.origin, {
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
