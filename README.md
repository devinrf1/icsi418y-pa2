# Project Manager

A React, Express, and MongoDB app for accounts, projects, members, and user stories.

## Run locally

Use Node.js and npm. From the repository root, install dependencies once:

```sh
cd server
npm ci
cd ../client
npm ci
```

Set `MONGO_URI=YOUR_MONGODB_CONNECTION_STRING` in `server/.env`. Use the same
MongoDB connection as before. The database is `pa2`; collections are `Users`,
`Projects`, `ProjectMemberships`, and `UserStories`.

Open two terminals at the repository root. In the first:

```sh
cd server
node server.js
```

In the second:

```sh
cd client
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173). Express runs on port 9000.
Keep `.env` and `node_modules` out of Git.

## Prepare test data

1. Sign up three users, for example `alex`, `blair`, and `casey`. Click **Load users and projects**.
2. Create **Campus Planner** with Alex as lead and **Study Tracker** with Blair as lead.
   Enter a description for each and choose a project status. Select Campus Planner
   under **Project members and backlog** and add Casey. Leave Casey out of Study Tracker.
3. Select the appropriate project, click **New story**, fill in the fields, and click
   **Create story** for each row below. Use “As a [user], I want [goal], so that [benefit].”
   for each description. All stories start in To Do; use **Edit** and **Save changes**
   to set the other statuses.

| Project | Title | Priority | Final status | Assigned member |
| --- | --- | --- | --- | --- |
| Campus Planner | Find events | High | To Do | alex |
| Campus Planner | Save an event | Medium | Done | casey |
| Campus Planner | Share an event | Low | In Progress | Unassigned |
| Study Tracker | Log a session | High | In Progress | blair |
| Study Tracker | View weekly totals | Low | To Do | Unassigned |

4. Switch projects to check their separate backlogs and member choices. Try removing
   Casey from Campus Planner while the Done story is still theirs; the request
   should be rejected. Refresh the page, load users and projects, and select a project
   again to see its saved stories.
