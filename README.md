# AURA Gym SaaS

A MERN conversion of the supplied AURA Gym Basic V1 UI.

## Included
- React + Vite client
- Node + Express API
- MongoDB + Mongoose models
- Tenant-isolated members, payments, attendance and settings
- JWT authentication using an HttpOnly cookie
- Register / login / logout
- Dashboard, Members, Attendance, Payments, Reports, Settings
- SaaS admin starter panel
- CSV member export
- Responsive UI matching the supplied Basic V1 styling

## Run
1. Start MongoDB (local or Atlas).
2. Copy `server/.env.example` to `server/.env`.
3. Fill in `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL`.
4. From the root:
   `npm install`
   `npm run install:all`
   `npm run dev`

Client: http://localhost:5173
API: http://localhost:5000
Admin: http://localhost:5174

## Security architecture
Tenant identity is derived on the server from the authenticated user. Client requests do not accept a trusted tenantId. All tenant-owned queries are scoped by `req.user.tenantId`.
