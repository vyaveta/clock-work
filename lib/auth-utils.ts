import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

export const getSession = cache(async () =>
    auth.api.getSession({ headers: await headers() }),
);

export const requireAuth = async () => {
    const session = await getSession();
    if (!session) redirect("/signin");
    return session;
};

export const requireUnauth = async () => {
    const session = await getSession();
    if (session) redirect("/");
};

