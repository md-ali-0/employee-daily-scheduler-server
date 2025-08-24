import logger from "@config/winston";
import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/employee_scheduler";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: "employee_scheduler",
    });
    logger.info("Database connected successfully");
  } catch (err) {
    logger.error("Database connection error:", err);
    process.exit(1); // Exit if DB connection fails
  }
};

export default mongoose;
