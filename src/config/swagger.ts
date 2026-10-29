import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [
    "./src/routes/**/*.ts",
    "./src/routes/*.ts",
    "./src/controllers/**/*.ts",
    "./src/app.ts",
  ],
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
