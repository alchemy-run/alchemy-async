import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return Response.json({
    message: "Hello from Next.js on Cloudflare Workers!",
    timestamp: new Date().toISOString(),
    url: request.url,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  return Response.json({
    message: "POST received",
    data: body,
    timestamp: new Date().toISOString(),
  });
}
