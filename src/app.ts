
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { setupSwagger } from "./config/swagger.js";

import authRoutes from "./routes/auth.routes.js";
import groupRoutes from "./routes/group.routes.js";
import issueRoutes from "./routes/issue.routes.js";
import platformAdminRoutes from "./routes/platformAdmin.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import ledgerRoutes from "./routes/ledger.routes.js";

import {
  errorHandler,
  notFound
} from "./middleware/errorHandler.js";

const app = express();

// Security and request middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Swagger API documentation
setupSwagger(app);

// Register feature routes 
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/platform-admin", platformAdminRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/ledger", ledgerRoutes);


// Handle unknown routes
app.use(notFound);

// Central error handling middleware
app.use(errorHandler);

export default app;
