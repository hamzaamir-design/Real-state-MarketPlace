import dotenv from "dotenv";
dotenv.config(); // ✅ Load environment variables first

import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.route.js";
import listingRouter from "./routes/listing.route.js";

const app = express();
app.use(express.json());
app.use(cookieParser());

// ✅ Connect MongoDB
mongoose
  .connect(process.env.MONGO)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Dynamically import Cloudinary route AFTER envs are loaded
import("./routes/cloudinary.route.js")
  .then((mod) => {
    const cloudinaryRouter = mod.default;
    app.use("/api/cloudinary", cloudinaryRouter);
    console.log("☁️ Cloudinary route loaded successfully");
  })
  .catch((err) => console.error("❌ Failed to load Cloudinary route:", err));

app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/listing", listingRouter);

app.listen(3000, () => {
  console.log("🚀 Server is running on port 3000");
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
