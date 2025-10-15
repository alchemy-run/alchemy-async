// @ts-check
import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightBlog from "starlight-blog";
import starlightLinksValidator from "starlight-links-validator";
import theme from "starlight-theme-nova";

// @ts-expect-error
import postHogScript from "./src/scripts/posthog.js?raw";

// https://astro.build/config
export default defineConfig({
  site: "https://alchemy.run",
  prefetch: true,
  trailingSlash: "ignore",
  integrations: [
    sitemap({
      filter: (page) =>
        !page.endsWith(".html") &&
        !page.endsWith(".md") &&
        !page.endsWith(".mdx"),
    }),
    starlight({
      title: "Alchemy",
      favicon: "/potion.png",
      head: [
        {
          tag: "script",
          content:
            process.env.ENABLE_POSTHOG === "true"
              ? postHogScript
                  .replace(
                    "<POSTHOG_CLIENT_API_HOST>",
                    process.env.POSTHOG_CLIENT_API_HOST,
                  )
                  .replace(
                    "<POSTHOG_PROJECT_ID>",
                    process.env.POSTHOG_PROJECT_ID,
                  )
              : "",
        },
      ],
      logo: {
        light: "./public/alchemy-logo-light.svg",
        dark: "./public/alchemy-logo-dark.svg",
        replacesTitle: true,
      },
      customCss: ["./src/styles/custom.css"],
      prerender: true,
      routeMiddleware: "./src/routeData.ts",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/alchemy-run/alchemy",
        },
        {
          icon: "x.com",
          label: "X",
          href: "https://x.com/alchemy_run",
        },
        {
          icon: "discord",
          label: "Discord",
          href: "https://discord.gg/jwKw8dBJdN",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/alchemy-run/alchemy/edit/main/alchemy-web",
      },
      components: {
        Hero: "./src/components/Hero.astro",
        MarkdownContent: "./src/components/MarkdownContent.astro",
      },
      sidebar: [
        {
          label: "What is Alchemy?",
          slug: "what-is-alchemy",
        },
        {
          label: "Getting Started",
          slug: "getting-started",
        },
        {
          label: "Guides",
          autogenerate: { directory: "guides" },
          collapsed: true,
        },
        {
          label: "Concepts",
          autogenerate: { directory: "concepts" },
        },
        {
          label: "Providers",
          autogenerate: { directory: "providers", collapsed: true },
        },
      ],
      expressiveCode: {
        themes: ["github-light", "github-dark-dimmed"],
      },
      plugins: [
        theme({
          nav: [
            {
              label: "Docs",
              href: "/getting-started",
            },
            {
              label: "Blog",
              href: "/blog",
            },
          ],
        }),
        starlightBlog(),
        starlightLinksValidator(),
      ],
    }),
  ],
});
