import {
  defineRouteMiddleware,
  type StarlightRouteData,
} from "@astrojs/starlight/route-data";

export const onRequest = defineRouteMiddleware((context) => {
  let route: StarlightRouteData;
  // Get the content collection entry for this page.
  try {
    route = context.locals.starlightRoute;
  } catch (_) {
    // This is a non-starlight route, so we want to skip the og generation
    return;
  }

  // Get the site URL from the request or use the configured site
  const siteUrl = context.url.origin || "https://v1.alchemy.run";

  // Base OG image URL - needs to be absolute for Twitter
  const baseImageUrl = `${siteUrl}/og/${route.id ?? "index"}.png`;

  // Open Graph image (Facebook, LinkedIn, WhatsApp) - 1200x630
  route.head.push({
    tag: "meta",
    attrs: {
      property: "og:image",
      content: baseImageUrl,
    },
  });

  // Twitter Card
  route.head.push({
    tag: "meta",
    attrs: {
      name: "twitter:card",
      content: "summary_large_image",
    },
  });

  // Twitter image
  route.head.push({
    tag: "meta",
    attrs: {
      name: "twitter:image",
      content: baseImageUrl,
    },
  });

  // Optional: Twitter image alt text for accessibility
  route.head.push({
    tag: "meta",
    attrs: {
      name: "twitter:image:alt",
      content: route.entry.data.title || "Alchemy Documentation",
    },
  });
});
