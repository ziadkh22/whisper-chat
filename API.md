# Whisper API guide

This guide describes the HTTP and Socket.IO interfaces used by the Whisper frontend.

## Local connection details

- API and Socket.IO origin: `http://localhost:3000`
- API prefix: `/api`
- JSON request body limit: 2 MB
- The server allows cross-origin frontend requests.

When deploying, replace the local origin in the frontend with the deployed API origin. The frontend pages currently use `http://localhost:3000` directly.

## Authentication

Register and login do not require a token. All room HTTP routes and `GET /api/auth/me` require:

```http
Authorization: Bearer <JWT>
```

The login response returns the token in the `Token` property. The current frontend stores it as `localStorage.whisperToken`. On logout, remove that key.

### Register

`POST /api/auth/register`

```json
{
  "username": "sam",
  "email": "sam@example.com",
  "password": "password123",
  "avatar": "data:image/png;base64,..."
}
```

`avatar` is optional. When supplied, send a base64 data URL for a PNG, JPEG, WebP, or GIF image no larger than 1 MB. The signup page reads the selected file and sends this value as JSON. Username must have at least 3 characters; password must have at least 8 characters.

Success (`201`):

```json
{
  "success": true,
  "message": "Account Registration done",
  "user": {
    "_id": "USER_ID",
    "username": "sam",
    "email": "sam@example.com",
    "avatar": "data:image/png;base64,..."
  }
}
```

### Login

`POST /api/auth/login`

```json
{ "email": "sam@example.com", "password": "password123" }
```

Success (`201`) includes `Token` and the public user object:

```json
{
  "success": true,
  "message": "Account Login done",
  "user": { "_id": "USER_ID", "username": "sam", "avatar": "" },
  "Token": "JWT"
}
```

### Current user

`GET /api/auth/me` (authenticated)

```json
{
  "user": {
    "_id": "USER_ID",
    "username": "sam",
    "displayname": "",
    "avatar": ""
  }
}
```

## Rooms

All routes below require a bearer token.

### Create a room

`POST /api/room/create`

```json
{
  "name": "Weekend plans",
  "description": "Plan the trip",
  "isprivate": false
}
```

`name` must be at least 3 characters. `isprivate` must be a JSON boolean. Send `description` as an empty string when there is no description.

Success (`201`) returns a `room` object containing `_id`, `name`, `description`, `isprivate`, `createdby`, and `members`. The creator is automatically added as a member. Use `room._id` as the room ID.

### List my rooms

`GET /api/room/myRooms`

Returns rooms created by or joined by the signed-in user, newest first:

```json
{
  "rooms": [
    {
      "_id": "ROOM_ID",
      "name": "Weekend plans",
      "createdby": { "_id": "USER_ID", "username": "sam", "displayname": "" }
    }
  ]
}
```

Use `_id` for the room link and `name` for the visible label. The current frontend opens a room at `Frontend/pages/chat-room.html?roomid=ROOM_ID`.

### Other room routes

| Method | Route | Response notes |
| --- | --- | --- |
| `GET` | `/api/room/get` | `{ message, rooms }` with room list |
| `GET` | `/api/room/getById/:id` | `{ message, room }`; creator is populated |
| `GET` | `/api/room/roomMessages/:id?limit=50&skip=0` | Array of messages, newest first |

Message history defaults to 50 messages and caps `limit` at 100. `skip` defaults to 0 and is clamped to a minimum of 0. The chat page reverses the returned array to display it oldest-to-newest.

### Private rooms

Only the creator or a user already listed in the room's `members` can join a private room. Users are added to `members` after a successful join. There is not currently an API or UI for inviting a new user to a private room.

## Socket.IO real-time chat

Connect using the token as a query value:

```js
const socket = io("http://localhost:3000", {
  query: { token }
});
```

Wait for `authenticated` before emitting `join-room`; the server sends it after token verification and handler setup.

### Join a room

Client emits:

```js
socket.emit("join-room", { roomid });
```

Server events:

- `joined-room`: `{ roomid }` after a successful join
- `room-users`: array of room members, updated on join, leave, and typing changes
- `error`: string describing an authentication or room error

Each `room-users` entry has this shape:

```json
{
  "userid": "USER_ID",
  "username": "sam",
  "displayname": "Sam",
  "avatar": "data:image/png;base64,...",
  "isOnline": true,
  "isTyping": false
}
```

### Send and receive messages

Client emits:

```js
socket.emit("send-message", { roomid, text });
```

Every client in the room receives `new-message` with the saved message:

```json
{
  "_id": "MESSAGE_ID",
  "room": "ROOM_ID",
  "text": "Hello!",
  "createdAt": "2026-01-01T12:00:00.000Z",
  "user": {
    "_id": "USER_ID",
    "username": "sam",
    "displayname": "Sam",
    "avatar": ""
  }
}
```

Use `textContent` when inserting message text into the page.

### Typing status

Emit `typing-start` when the user starts typing and `typing-stop` after a short idle period, on blur, or after sending:

```js
socket.emit("typing-start", { roomid });
socket.emit("typing-stop", { roomid });
```

Peers also receive `user-typing` and `user-stopped-typing`. The `room-users` event includes each member's current `isTyping` value and is what the current frontend uses to render labels.

## Errors and statuses

- Validation errors: `422` with `{ "errors": [...] }`
- Duplicate registration: `409` with `{ "message": "..." }`
- Invalid login: `400` with `{ "message": "..." }`
- Missing bearer token on protected HTTP routes: `400`
- Missing room: `404` from the room details endpoint
- Other server errors: `{ "message": "..." }`

For Socket.IO, listen to `error` and show its string in the UI. Do not assume a socket connection means the user has joined a room; wait for `joined-room`.
