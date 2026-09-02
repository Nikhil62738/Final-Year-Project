# FDA SafeWatch

Public food-safety complaint reporting and action tracking platform built with React, Node.js/Express, MongoDB, JWT auth, and Multer uploads.

## Run locally

1. Install dependencies:

   ```bash
   npm install
   npm run install:all
   ```

2. Create `server/.env` from `server/.env.example`.

3. Start MongoDB locally, or set `MONGO_URI` to an Atlas connection string.

4. Seed an officer account:

   ```bash
   npm run seed
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

Default URLs:

- Client: `http://localhost:5173`
- API: `http://localhost:5000`

Seeded admin:

- Phone: `9999999999`
- Password: `Admin@12345`
"# Final-Year-Project" 
