import logger from "@config/winston";
import Redis from "ioredis";
import env from "./env";

const redisClient = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  username : env.REDIS_USER,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
})

redisClient.on("connect", () => {
  logger.info("Connected to Redis")
})

redisClient.on("error", (err) => {
  logger.error("Redis connection error:", err)
})

export default redisClient
