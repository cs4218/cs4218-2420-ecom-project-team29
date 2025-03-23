import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cors from "cors";

// configure env
dotenv.config();

//database config
connectDB();

const app = express();

//middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(morgan("dev"));

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);

// rest api

app.get("/", (req, res) => {
  res.send("<h1>Welcome to ecommerce app</h1>");
});

const PORT = process.env.PORT || 6060;

app.listen(PORT, () => {
  console.log(
    `Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white
  );
});

// Only start the server if this file is executed directly (not imported in tests)
// Using a named function so we can export it for testing purposes
const startServer = () => {
  return app.listen(PORT, () => {
    console.log(
      `Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white
    );
  });
};

// Start the server if we're in development mode, not when imported for testing
if (process.env.DEV_MODE !== "integration-test") {
  startServer();
}

// Export both the app and the startServer function
export { startServer };

export default app;
