import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import { ApiError } from "./utils/ApiError.js"
import cron from "node-cron"
import { checkAndNotifyExpiringLicenses } from "./controllers/license.controllers.js"

// Load environment variables
dotenv.config()

const app = express()
let corsOrigin = process.env.CORS_ORIGIN

// Increase payload size limit for file uploads
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "OPTIONS"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'device-remember-token', 'Access-Control-Allow-Origin', 'Origin', 'Accept']
  })
);


app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js'
import licenseRouter from './routes/license.routes.js'

//routes declaration
app.use("/api/v1", userRouter)
app.use("/api/v1/licenses", licenseRouter)

// Setup cron job to check for expiring licenses every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily check for expiring licenses...');
  await checkAndNotifyExpiringLicenses();
});

// Global error handler
app.use((err, req, res, next) => {
  // If it's already an ApiError instance, use it directly
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(err.toJSON());
  }
  
  // Convert other errors to ApiError
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";
  const apiError = new ApiError(statusCode, message, err.errors || []);
  
  // Return a formatted error response
  return res.status(statusCode).json(apiError.toJSON());
});

// 404 handler for undefined routes
app.use("*", (req, res) => {
  return res.status(404).json(
    new ApiError(404, "Route not found").toJSON()
  );
});

export { app }