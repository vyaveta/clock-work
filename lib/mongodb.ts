import "server-only";

import { MongoClient, type Db } from "mongodb";

type MongoGlobal = typeof globalThis & {
    __clockWorkMongoClient?: MongoClient;
    __clockWorkMongoConnectPromise?: Promise<MongoClient>;
    __clockWorkJobIndexesPromise?: Promise<void>;
};

const mongoGlobal = globalThis as MongoGlobal;

const getMongoClient = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI is not configured");
    }

    if (!mongoGlobal.__clockWorkMongoClient) {
        mongoGlobal.__clockWorkMongoClient = new MongoClient(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10_000,
        });
    }

    if (!mongoGlobal.__clockWorkMongoConnectPromise) {
        mongoGlobal.__clockWorkMongoConnectPromise = mongoGlobal.__clockWorkMongoClient.connect();
    }

    return mongoGlobal.__clockWorkMongoConnectPromise;
};

export const getMongoDatabase = async (): Promise<Db> => {
    const client = await getMongoClient();
    const databaseName = process.env.MONGODB_DATABASE || "clock_work";
    const database = client.db(databaseName);

    if (!mongoGlobal.__clockWorkJobIndexesPromise) {
        mongoGlobal.__clockWorkJobIndexesPromise = database.collection("matched_jobs").createIndexes([
            { key: { userId: 1, dedupeKey: 1 }, name: "unique_user_job", unique: true },
            { key: { userId: 1, matchScore: -1 }, name: "user_match_score" },
            { key: { userId: 1, "location.country": 1 }, name: "user_job_country" },
        ]).then(() => undefined);
    }
 
    await mongoGlobal.__clockWorkJobIndexesPromise;
    return database;
};
