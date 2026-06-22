import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Gate the app + editor; the marketing site (/) and auth pages stay public.
const isProtected = createRouteMatcher(["/app(.*)", "/w(.*)"]);

const handler = clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect();
});

// Until Clerk keys are set, run a no-op so the site keeps working (app open).
export default process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? handler : function middleware() {};

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|mp4)).*)",
    "/(api|trpc)(.*)",
  ],
};
