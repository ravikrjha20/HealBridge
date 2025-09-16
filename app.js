require("dotenv").config();
require("express-async-errors");

const cors = require("cors");
const express = require("express");
const connectDB = require("./db/connect");
const { connectRedis } = require("./utils/redisClient");
const fileUpload = require("express-fileupload");
// const cloudinary = require("cloudinary").v2;
// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.CLOUD_API_KEY,
//   api_secret: process.env.CLOUD_API_SECRET,
// });

const app = express(); 

const allowedOrigins = process.env.CLIENT_URLS.split(",");

// If you want to allow multiple frontend URLs:
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Or, if you only want a single origin for now, just use:
// app.use(
//   cors({
//     origin: process.env.CLIENT_URLS1,
//     credentials: true,
//   })
// );

const errorHandlerMiddleware = require("./middleware/error-handler");
const notFoundMiddleware = require("./middleware/not-found");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

// Routes
const authRoutes = require("./routes/authRoutes");

// Middlewares
app.use(express.json());
// app.use(fileUpload({ useTempFiles: true }));
app.use(cookieParser(process.env.JWT_SECRET));
app.use(morgan("tiny"));

// API routes
app.use("/api/v1/auth", authRoutes);

// Not found + error handler
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    await connectRedis();
    console.log("🚀 Connection established ✅");

    app.listen(port, "0.0.0.0", () =>
      console.log(`🚀 Server listening on port ${port} ✅`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
