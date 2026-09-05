import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

import { authenticate } from "./middleware/authenticate.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

/* =========================================================
   CORS CONFIGURATION
   ========================================================= */

const allowedOrigins = [
  "http://localhost:5173",
  "https://aura-sasa-trail.netlify.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without an Origin header
    // (Postman, server-to-server requests, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("Blocked CORS origin:", origin);

    return callback(
      new Error("Not allowed by CORS")
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  optionsSuccessStatus: 204,
};

/* =========================================================
   MIDDLEWARE
   ========================================================= */

app.use(
  cors(corsOptions)
);

app.options(
  "*",
  cors(corsOptions)
);

app.use(
  helmet()
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  cookieParser()
);

app.use(
  morgan("dev")
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
  })
);

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,
      message: "AURA Gym API is running",
    });
  }
);

/* =========================================================
   AUTH ROUTES
   ========================================================= */

app.use(
  "/api/auth",
  authRoutes
);

/* =========================================================
   PROTECTED ROUTES
   ========================================================= */

app.use(
  "/api/members",
  authenticate,
  memberRoutes
);

app.use(
  "/api/payments",
  authenticate,
  paymentRoutes
);

app.use(
  "/api/attendance",
  authenticate,
  attendanceRoutes
);

app.use(
  "/api/settings",
  authenticate,
  settingsRoutes
);

app.use(
  "/api/reports",
  authenticate,
  reportRoutes
);

/* =========================================================
   ERROR HANDLING
   ========================================================= */

app.use(
  notFound
);

app.use(
  errorHandler
);

export default app;