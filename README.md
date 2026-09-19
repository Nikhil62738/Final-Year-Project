# FDA SafeWatch

Public food-safety complaint reporting and action tracking platform built with **React**, **Node.js/Express**, **MongoDB**, JWT auth, and Multer uploads.

## Public site behavior

- **Frontend** runs at `http://localhost:5173`
- **API** runs at `http://localhost:5000`
- **Report an Issue** requires citizen login/registration first
- **Track Issue** is public — anyone with a tracking code can check status
- **Admin panel is not linked** on the public site. Officers use the hidden URL: `http://localhost:5173/#admin`

## Run locally

1. Install dependencies:

   ```bash
   npm install
   npm run install:all
   ```

2. Create `server/.env` from `.env.example`. Set `CLIENT_ORIGIN=http://localhost:5173` for local development.

3. Start MongoDB locally, or set `MONGO_URI` to an Atlas connection string.

4. Seed officer accounts:

   ```bash
   npm run seed
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

Open `http://localhost:5173`. The backend is available separately at `http://localhost:5000`.

## Deploy separately

1. Deploy the `server` folder as a Node service. Set its `MONGO_URI`, `JWT_SECRET`, other server variables, and `CLIENT_ORIGIN` to the deployed frontend URL.
2. Deploy the `client` folder as a static site with build command `npm run build` and publish directory `dist`.
3. Before the frontend build, set `SAFEWATCH_API_BASE_URL` in `client/public/config.js` to the deployed API URL. Set the public Carto and Google client values there too if used.

The client has no server secrets. Do not copy the backend `.env` file into it.

## Demo credentials

**Super admin**

- Phone: `9999999999`
- Password: `Admin@12345`
- Admin URL: `http://localhost:5173/#admin`

**Citizens**

- Register at `http://localhost:5000/#login` before submitting a complaint

## Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18 (CDN, no build step)       |
| Backend  | Node.js + Express                   |
| Database | MongoDB + Mongoose                  |
| Auth     | JWT (citizens + officers)           |
| Uploads  | Multer (evidence photos/videos)     |

## API routes

| Method | Route                              | Access   |
|--------|------------------------------------|----------|
| POST   | `/api/auth/users/register`         | Public   |
| POST   | `/api/auth/users/login`            | Public   |
| POST   | `/api/auth/login`                  | Officer  |
| POST   | `/api/complaints/check-duplicates` | Citizen  |
| POST   | `/api/complaints`                  | Citizen  |
| GET    | `/api/complaints/track/:code`      | Public   |
| GET    | `/api/complaints`                  | Officer  |
| GET    | `/api/complaints/:id`              | Officer  |
| PATCH  | `/api/complaints/:id/status`       | Officer  |
