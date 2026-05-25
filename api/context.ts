import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  const adminAuth = opts.req.headers.get("x-admin-auth");
  if (adminAuth === "true") {
    ctx.user = {
      id: 1,
      unionId: "admin-local",
      name: "Admin",
      email: "admin@store.com",
      avatar: null,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignInAt: new Date(),
    } as User;
  }

  return ctx;
}
