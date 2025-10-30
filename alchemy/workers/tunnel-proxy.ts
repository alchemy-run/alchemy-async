/// <reference types="@cloudflare/workers-types" />

interface Env {
  WORKER_NAME: string;
  TUNNEL_HOST: string;
}

declare const ALCHEMY_VERSION: string; // injected during build

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    url.host = env.TUNNEL_HOST;
    const headers = new Headers(request.headers);
    headers.set("alchemy-worker-name", env.WORKER_NAME);
    const response = await fetch(url, {
      method: request.method,
      headers,
      body: request.body,
      redirect: "manual",
    });
    if (response.status === 530) {
      const error = await extractResponseError(response);
      const headers = new Headers(response.headers);
      headers.set("Content-Type", "text/html");
      return new Response(
        renderErrorHtml({
          name: env.WORKER_NAME,
          error,
          rayId: response.headers.get("cf-ray") ?? "Unknown",
        }),
        {
          status: 530,
          headers,
        },
      );
    }
    return response;
  },
} as ExportedHandler<Env>;

const extractResponseError = async (response: Response) => {
  const error = response.headers.get("Alchemy-Error");
  if (error) {
    return error;
  }
  let code: string | undefined;
  let message: string | undefined;
  const { promise, resolve } = Promise.withResolvers<string>();
  const rewriter = new HTMLRewriter();
  rewriter.on("h1", {
    text(text) {
      if (code) return;
      const match = text.text.match(/(\d+)/);
      if (match) {
        code = match[1];
      }
    },
  });
  rewriter.on("h2", {
    text(text) {
      if (message) return;
      message = text.text;
    },
  });
  rewriter.onDocument({
    end() {
      resolve([code, message].filter(Boolean).join(": ") || "Unknown");
    },
  });
  await rewriter.transform(response).text(); // consume response body so rewriter runs
  return promise;
};

const renderErrorHtml = (props: {
  name: string;
  error: string;
  rayId: string;
}) => `
  <!DOCTYPE html>
  <html lang="en">
  
  <head>
    <title>Alchemy | Tunnel Error</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="shortcut icon" href="https://alchemy.run/potion.png" type="image/png" />
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  </head>
  
  <body class="font-sans bg-slate-100 text-slate-950">
    <div class="flex flex-col items-center justify-center h-screen">
      <div class="border-t-3 border-red-600 px-5 py-7 bg-white gap-3 flex flex-col w-full max-w-lg">
        <h1 class="text-2xl font-semibold">530: Tunnel Error</h1>
        <p class="text-slate-800">The worker "${props.name}" could not be reached.</p>
        <p class="text-slate-800">Please ensure that <code
            class="bg-slate-100 text-slate-800 p-1 rounded-md text-sm">alchemy dev</code>
          is running and tunnel mode is enabled for the worker.</p>
        <div class="flex flex-col gap-2 border-l-2 border-slate-300 pl-3 my-1.5">
          <div class="text-sm flex flex-col gap-1">
            <div class="text-slate-500">Error:</div>
            <div class="text-slate-800 font-mono">${props.error}</div>
          </div>
          <div class="text-sm flex flex-col gap-1">
            <div class="text-slate-500">Ray ID:</div>
            <div class="text-slate-800 font-mono">${props.rayId}</div>
          </div>
        </div>
        <p class="text-slate-800"><a href="https://alchemy.run/docs/guides/cloudflare-tunnel"
            class="text-slate-800 underline underline-offset-2 hover:no-underline" target="_blank">Learn more about tunnel
            mode in
            Alchemy</a>.</p>
      </div>
      <div class="bg-slate-200 px-5 py-3 flex flex-col w-full max-w-lg">
        <p class="text-sm text-slate-500">Alchemy ${ALCHEMY_VERSION}</p>
      </div>
    </div>
  </body>
  
  </html>
  `;
