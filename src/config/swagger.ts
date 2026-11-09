import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import fs from "fs";
import path from "path";

const isSrcAvailable = fs.existsSync(path.resolve(process.cwd(), "src/routes"));

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ikimina (Saving Group) API",
      version: "1.0.0",
      description: "API documentation for the Ikimina Saving Group Backend",
      contact: {
        name: "Support",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "User authentication, registration, and profile endpoints",
      },
      {
        name: "Groups",
        description: "Saving group creation, membership management, and rules",
      },
      {
        name: "Issues",
        description: "Issue and dispute reporting for group members",
      },
      {
        name: "Platform Admin",
        description: "Platform-level administrative operations and oversight",
      },
      {
        name: "Wallet",
        description: "Member wallet summary, simulated top-up, withdrawal, and transaction history",
      },
      {
        name: "Ledger",
        description: "Financial ledger movements, group pool records, reversals, and audit logs",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token as: Bearer <token>",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message details",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "6627c2f1f3e74c001c9a1234" },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            platformRole: { type: "string", enum: ["user", "platform-admin"], example: "user" },
            status: { type: "string", enum: ["active", "blocked"], example: "active" },
            blockReason: { type: "string", nullable: true, example: null },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Group: {
          type: "object",
          properties: {
            _id: { type: "string", example: "6627c2f1f3e74c001c9a5678" },
            name: { type: "string", example: "Kigali Investors" },
            description: { type: "string", example: "Community savings group" },
            inviteCode: { type: "string", example: "A1B2C3D4E5" },
            createdBy: { type: "string", example: "6627c2f1f3e74c001c9a1234" },
            contributionAmount: { type: "number", example: 50000 },
            contributionFrequency: { type: "string", enum: ["weekly", "monthly"], example: "monthly" },
            loanInterestRate: { type: "number", example: 5 },
            maxLoanAmount: { type: "number", example: 200000 },
            poolBalance: { type: "number", example: 240000 },
            status: { type: "string", enum: ["active", "frozen"], example: "active" },
            freezeReason: { type: "string", nullable: true, example: null },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Membership: {
          type: "object",
          properties: {
            _id: { type: "string", example: "6627c2f1f3e74c001c9a9999" },
            user: { type: "string", example: "6627c2f1f3e74c001c9a1234" },
            group: { type: "string", example: "6627c2f1f3e74c001c9a5678" },
            role: { type: "string", enum: ["member", "group-admin"], example: "group-admin" },
            status: { type: "string", enum: ["active", "removed"], example: "active" },
            joinedAt: { type: "string", format: "date-time" },
          },
        },
        Issue: {
          type: "object",
          properties: {
            _id: { type: "string", example: "6627c2f1f3e74c001c9a8888" },
            reportedBy: { type: "string", example: "6627c2f1f3e74c001c9a1234" },
            group: { type: "string", example: "6627c2f1f3e74c001c9a5678" },
            subject: { type: "string", example: "Contribution not recorded" },
            description: { type: "string", example: "Detailed explanation of the problem encountered" },
            status: { type: "string", enum: ["open", "in-review", "resolved", "dismissed"], example: "open" },
            adminNote: { type: "string", nullable: true, example: "Under review by admin" },
            resolvedBy: { type: "string", nullable: true, example: null },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        LedgerEntry: {
          type: "object",
          properties: {
            _id: { type: "string", example: "6627c2f1f3e74c001c9a7777" },
            reference: { type: "string", example: "TXN-20261109-A1B2C3D4" },
            type: {
              type: "string",
              enum: [
                "top-up",
                "withdrawal",
                "contribution",
                "loan-payout",
                "loan-repayment",
                "reversal",
              ],
              example: "top-up",
            },
            from: { type: "string", example: "external" },
            to: { type: "string", example: "wallet:6627c2f1f3e74c001c9a1234" },
            amount: { type: "number", example: 50000 },
            currency: { type: "string", example: "RWF" },
            description: { type: "string", example: "Simulated MTN top-up" },
            performedBy: { type: "string", example: "6627c2f1f3e74c001c9a1234" },
            reversalOf: { type: "string", nullable: true, example: null },
            reversalReason: { type: "string", nullable: true, example: null },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: isSrcAvailable
    ? ["./src/routes/*.ts", "./src/routes/**/*.ts"]
    : ["./dist/routes/*.js", "./dist/routes/**/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Serve Swagger UI documentation
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Serve swagger spec in JSON format
  app.get("/api/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};
