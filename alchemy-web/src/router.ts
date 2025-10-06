interface Env {
  WEBSITE: Fetcher;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (prefersMarkdown(request) && !url.pathname.endsWith(".md")) {
      const markdownResponse = await env.WEBSITE.fetch(
        new URL(url.pathname.replace(/\/?$/, ".md"), url.origin),
      );
      if (markdownResponse.ok) {
        return markdownResponse;
      }
    }

    const assetResponse = await env.WEBSITE.fetch(url);
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    const notFoundResponse = await env.WEBSITE.fetch(
      new URL("/404.html", url.origin),
    );
    return new Response(notFoundResponse.body, {
      ...notFoundResponse,
      status: 404,
    });
  },
};

/**
 * Returns true if the accept header prefers markdown or plain text over HTML.
 *
 * Examples:
 * - opencode - accept: text/markdown;q=1.0, text/x-markdown;q=0.9, text/plain;q=0.8, text/html;q=0.7, *\/*;q=0.1
 * - claude code - accept: application/json, text/plain, *\/*
 *
 * Notes:
 * - ChatGPT and Claude web don't set an accept header; maybe check the user agent instead?
 * - Cursor's headers are too generic (accept: *, user-agent: https://github.com/sindresorhus/got)
 */
const prefersMarkdown = (request: Request) => {
  const accept = request.headers.get("accept");
  if (!accept) return false;

  // parse accept header and sort by quality; highest quality first
  const types = accept
    .split(",")
    .map((part) => {
      const type = part.split(";")[0].trim();
      const q = part.match(/q=([^,]+)/)?.[1];
      return { type, q: q ? Number.parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q)
    .map((type) => type.type);

  const markdown = types.indexOf("text/markdown");
  const plain = types.indexOf("text/plain");
  const html = types.indexOf("text/html");

  // if no HTML is specified, and either markdown or plain text is specified, prefer markdown
  if (html === -1) {
    return markdown !== -1 || plain !== -1;
  }

  // prefer markdown if higher quality than HTML
  if ((markdown !== -1 && markdown < html) || (plain !== -1 && plain < html)) {
    return true;
  }

  // otherwise, prefer HTML
  return false;
};
