import "server-only";

import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
import mongoose from "mongoose";

type MongooseGlobal = typeof globalThis & {
  __clockWorkMongoosePromise?: Promise<typeof mongoose>;
};

const mongooseGlobal = globalThis as MongooseGlobal;

export async function connectMongoose() {
  if (mongoose.connection.readyState === 1) return mongoose;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");
  console.log(uri, "is uri ")

  if (!mongooseGlobal.__clockWorkMongoosePromise) {
    mongooseGlobal.__clockWorkMongoosePromise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DATABASE || "clock_work",
      serverSelectionTimeoutMS: 10_000,
    }).catch((error: unknown) => {
      mongooseGlobal.__clockWorkMongoosePromise = undefined;
      throw error;
    });
  }

  return mongooseGlobal.__clockWorkMongoosePromise;
}
