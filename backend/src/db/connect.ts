import mongoose from "mongoose";
import { getEnv } from "../config/env";
import { HttpError } from "../middleware/error";

const globalForMongoose = globalThis as typeof globalThis & {
  _mongooseConn?: Promise<typeof mongoose>;
};

export async function connectDB(): Promise<typeof mongoose> {
  const { MONGODB_URI } = getEnv();

  if (!globalForMongoose._mongooseConn) {
    globalForMongoose._mongooseConn = (async () => {
      let lastError: unknown;
      // Retry to reduce transient DNS/network startup failures.
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          return await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 8000,
          });
        } catch (error) {
          lastError = error;
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      throw lastError;
    })().catch((error) => {
      globalForMongoose._mongooseConn = undefined;
      const message = error instanceof Error ? error.message : "Database connection failed";
      throw new HttpError(message, 503);
    });
  }
  return globalForMongoose._mongooseConn;
}

