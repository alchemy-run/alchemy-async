import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  // Access Cloudflare runtime context
  const runtime = request.cf;

  return new Response(
    JSON.stringify({
      message: "Hello from Astro API on Cloudflare!",
      timestamp: new Date().toISOString(),
      colo: runtime?.colo || "unknown",
      country: runtime?.country || "unknown",
      city: runtime?.city || "unknown",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};
