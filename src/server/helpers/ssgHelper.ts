
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { type Session } from "next-auth";
import superjson from "superjson";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";


export const generateSSGHelper = (session: Session | null) => {
  return createProxySSGHelpers({
    router: appRouter,
    ctx: { prisma, session },
    transformer: superjson,
  })
};
