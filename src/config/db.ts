import logger from "@config/winston";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/employee_scheduler";

mongoose.connect(MONGODB_URI);

const db = mongoose.connection;
db.on("error", (err) => logger.error(`MongoDB Error: ${err}`));
db.once("open", () => logger.info("MongoDB connected"));

export default mongoose;
