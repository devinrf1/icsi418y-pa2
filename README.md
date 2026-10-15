# Project Manager

A React, Express, and MongoDB application with signup, login, projects, and project memberships.

## Setup

Install Node.js and npm, and have a MongoDB connection available.

From the project root, install dependencies:

```sh
cd server
npm ci
cd ../client
npm ci
```

Create `server/.env`:

```env
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
```

The application uses the `pa2` database and the `Users`, `Projects`, and `ProjectMemberships` collections. If your existing accounts are in a lowercase `users` collection, rename it to `Users` before starting the server.

## Run

Open two terminals at the project root.

Start the backend:

```sh
cd server
node server.js
```

Start the frontend in the other terminal:

```sh
cd client
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. The backend runs on port `9000`.

## Use

- Sign up or log in with an existing account.
- Click **Load users and projects** to load data or refresh it after signup.
- Create a project with a name, description, status, and registered user as its lead.
- Select a project to view, add, or remove members. The lead is added automatically and cannot be removed. Duplicate memberships are rejected.

Keep `.env` and `node_modules` out of Git.
