
import { createPolar } from "@polar-sh/sdk/2026-10";

const accessToken = process.env.POLAR_ACCESS_TOKEN;

if (!accessToken) {
    throw new Error("POLAR_ACCESS_TOKEN is missing");
}

export const polarClient = createPolar({
    accessToken,
    environment:
        process.env.NODE_ENV === "production"
            ? "production"
            : "sandbox",
});
