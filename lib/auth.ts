import prisma from "@/lib/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql"
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },
    account: {
        accountLinking: {
            enabled: true,
            // A user may sign in to Clock Work with one address and send mail
            // from a different Google address they explicitly connect in the Gmail node.
            allowDifferentEmails: true,
            // Email/password accounts are not locally verified in this app.
            // Require Google's verified-email claim but allow it to verify the local account.
            requireLocalEmailVerified: false,
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // Keep normal Google sign-in limited to identity scopes. Gmail permission
            // is requested only by the Gmail node's authenticated linkSocial flow.
            scope: ["openid", "email", "profile"],
            accessType: "offline",
            // Google can otherwise return prompt=none after the user has granted
            // gmail.send once, which may omit the refresh token required by workflows.
            prompt: "consent",
        },
    },

})

