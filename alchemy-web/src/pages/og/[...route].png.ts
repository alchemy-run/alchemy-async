import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import {
  access,
  constants,
  mkdir,
  readFile,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { chromium, type Browser } from "playwright";

export const prerender = true;

// Cache directory and manifest file
const CACHE_DIR = join(process.cwd(), ".astro", "og-cache");
const MANIFEST_FILE = join(CACHE_DIR, "digest-manifest.json");

// Shared browser instance and cached assets
let sharedBrowser: Browser | null = null;
const assetCache = new Map<string, string>();

async function getBrowser(): Promise<Browser> {
  if (!sharedBrowser) {
    sharedBrowser = await chromium.launch();

    // Clean up browser on process exit
    process.on("exit", () => {
      if (sharedBrowser) {
        sharedBrowser.close();
      }
    });

    process.on("SIGINT", () => {
      if (sharedBrowser) {
        sharedBrowser.close();
      }
      process.exit();
    });

    process.on("SIGTERM", () => {
      if (sharedBrowser) {
        sharedBrowser.close();
      }
      process.exit();
    });
  }

  return sharedBrowser;
}

async function getAsset(filename: string): Promise<string> {
  // Return cached version if available
  if (assetCache.has(filename)) {
    return assetCache.get(filename)!;
  }

  try {
    const publicDir = join(process.cwd(), "public");
    const fileData = await readFile(join(publicDir, filename));

    // Determine MIME type based on file extension
    const ext = filename.split(".").pop()?.toLowerCase();
    let mimeType: string;

    switch (ext) {
      case "svg":
        mimeType = "image/svg+xml";
        break;
      case "webp":
        mimeType = "image/webp";
        break;
      case "png":
        mimeType = "image/png";
        break;
      case "jpg":
      case "jpeg":
        mimeType = "image/jpeg";
        break;
      case "gif":
        mimeType = "image/gif";
        break;
      default:
        mimeType = "application/octet-stream";
    }

    const base64String = `data:${mimeType};base64,${fileData.toString("base64")}`;

    // Cache the result
    assetCache.set(filename, base64String);

    return base64String;
  } catch (e) {
    console.error(`Failed to read asset: ${filename}`, e);
    const fallback = "";
    assetCache.set(filename, fallback);
    return fallback;
  }
}

interface DigestManifest {
  [path: string]: string; // path -> digest mapping
}

async function loadManifest(): Promise<DigestManifest> {
  try {
    await access(MANIFEST_FILE, constants.F_OK);
    const content = await readFile(MANIFEST_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function ensureCacheDir(): Promise<void> {
  try {
    await access(CACHE_DIR, constants.F_OK);
  } catch {
    await mkdir(CACHE_DIR, { recursive: true });
  }
}

async function ensureDistSymlink(): Promise<void> {
  const distOgDir = join(process.cwd(), "dist", "og");
  const distDir = join(process.cwd(), "dist");

  // Ensure dist directory exists
  try {
    await access(distDir, constants.F_OK);
  } catch {
    await mkdir(distDir, { recursive: true });
  }

  // Remove existing dist/og if it exists (file or directory)
  try {
    await access(distOgDir, constants.F_OK);
    try {
      await unlink(distOgDir);
    } catch {
      // If it's a directory, this will fail, but that's ok
    }
  } catch {
    // File doesn't exist, that's fine
  }

  // Create symlink from dist/og to cache directory
  try {
    await symlink(CACHE_DIR, distOgDir, "dir");
    console.log(`Created symlink: dist/og -> ${CACHE_DIR}`);
  } catch (e) {
    console.error("Failed to create symlink:", e);
  }
}

async function saveManifest(manifest: DigestManifest): Promise<void> {
  await ensureCacheDir();
  await writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

export async function getStaticPaths() {
  // Check if OG image generation is enabled
  if (!process.env.GENERATE_OG_IMAGES) {
    return [];
  }

  const docs: any[] = await getCollection("docs");

  const paths = docs.map((doc) => ({
    params: { route: doc.id },
    props: { entry: doc },
  }));

  // Add a specific path for the root `/og/` route that maps to index
  const indexDoc = docs.find((doc) => doc.id === "index");
  if (indexDoc) {
    paths.push({
      params: { route: undefined }, // This handles the empty route case
      props: { entry: indexDoc },
    });
  }

  // Build new manifest with current paths and digests
  const currentPaths = new Set<string>();
  const newManifest: DigestManifest = {};

  for (const path of paths) {
    const route = path.params.route || "index";
    const ogPath = `/og/${route}.png`;
    const digest = path.props.entry.digest;

    currentPaths.add(ogPath);
    newManifest[ogPath] = digest;
  }

  // Run setup and cleanup operations in parallel
  const [oldManifest] = await Promise.all([
    loadManifest(),
    ensureCacheDir(),
    ensureDistSymlink(),
  ]);

  // Find and delete outdated cached files
  const deletePromises: Promise<void>[] = [];
  for (const oldPath in oldManifest) {
    if (!currentPaths.has(oldPath)) {
      const relativePath = oldPath.replace(/^\/og\//, "");
      const cacheFile = join(CACHE_DIR, relativePath);
      deletePromises.push(
        unlink(cacheFile)
          .then(() => {
            console.log(`Deleted outdated OG cache: ${cacheFile}`);
          })
          .catch(() => {}), // File doesn't exist or can't be deleted, that's ok
      );
    }
  }

  // Wait for all deletions and save manifest
  await Promise.all([...deletePromises, saveManifest(newManifest)]);

  return paths;
}

export const GET: APIRoute = async ({ props, params }) => {
  const { entry } = props as {
    entry: CollectionEntry<"docs"> & { digest: string };
  };
  const { data, digest } = entry;
  const route = params.route || "index";

  const ogPath = `/og/${route}.png`;
  // Convert /og/path/to/file.png to cache/path/to/file.png
  const relativePath = ogPath.replace(/^\/og\//, "");
  const cacheFile = join(CACHE_DIR, relativePath);

  // Check if we have a cached version with the same digest
  const [manifest, cacheExists] = await Promise.all([
    loadManifest(),
    access(cacheFile, constants.F_OK)
      .then(() => true)
      .catch(() => false),
  ]);

  if (manifest[ogPath] === digest && cacheExists) {
    try {
      const cachedImage = await readFile(cacheFile);
      console.log(" (using cache)");

      return new Response(Buffer.from(cachedImage), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch (e) {
      console.error(`Failed to read cached image: ${cacheFile}`, e);
      // Continue to regenerate if cache read fails
    }
  }

  console.log(" (generating)");

  // Generate breadcrumb from entry path
  const pathParts = entry.id
    .split("/")
    .filter((part: string) => part !== "index");
  const breadcrumbParts =
    pathParts.length > 1
      ? pathParts.slice(0, -1)
      : pathParts[0]
        ? [pathParts[0]]
        : [];
  const isBlogPost = entry.id.startsWith("blog/");
  const breadcrumbText =
    breadcrumbParts.length > 0
      ? isBlogPost
        ? breadcrumbParts.join(" / ")
        : `docs / ${breadcrumbParts.join(" / ")}`
      : "";

  // Create the HTML content
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:wght@400;700&display=swap");

    :root {
      --og-width: 1200px;
      --og-height: 630px;
      /* Hero-inspired colors for dark theme */
      --hero-text-primary: #ffffff;
      --hero-title-accent: #a78bfa;
      --hero-glow-color: rgba(167, 139, 250, 0.1);
      --hero-noise-opacity: 0.4;
      --sl-color-bg: #090a0f;
      --sl-color-bg-nav: #0e0f17;
    }

    html,
    body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: black;
    }

    .og-container {
      width: var(--og-width);
      height: var(--og-height);
      background:
        radial-gradient(
          circle at 50% 50%,
          var(--hero-glow-color) 0%,
          transparent 85%
        ),
        linear-gradient(
          135deg,
          var(--sl-color-bg) 0%,
          var(--sl-color-bg-nav) 100%
        );
      position: relative;
      display: flex;
      align-items: center;
      overflow: hidden;
      font-family: "IBM Plex Serif", Georgia, serif;
    }

    /* Noise overlay */
    .og-container::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: var(--hero-noise-opacity);
      pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
      mix-blend-mode: overlay;
      z-index: 1;
    }

    .content {
      flex: 1;
      padding-left: 80px;
      padding-right: 40px;
      z-index: 2;
      max-width: 714px;
    }

    .logo {
      margin-bottom: 30px;
    }

    .logo-image {
      height: 42px;
      width: auto;
    }

    .breadcrumb {
      font-size: 16px;
      font-weight: 400;
      color: #a78bfa;
      margin-bottom: 16px;
      font-family: "IBM Plex Sans", sans-serif;
      line-height: 1;
      opacity: 0.8;
    }

    .title {
      font-size: 72px;
      font-weight: 700;
      line-height: 1.2;
      margin: 0 0 30px 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      /* Dark mode gradient from Hero */
      background: linear-gradient(
        135deg,
        var(--hero-text-primary) 0%,
        var(--hero-title-accent) 100%
      );
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .description {
      font-size: clamp(1.1rem, 2.5vw, 1.5rem);
      color: #e5e7eb;
      line-height: 1.4;
      margin: 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      font-family: "IBM Plex Sans", sans-serif;
    }

    .character-container {
      position: absolute;
      right: 30px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 1;
    }

    .character-circle {
      width: 348px;
      height: 348px;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        rgba(167, 139, 250, 0.3) 0%,
        rgba(147, 51, 234, 0.2) 50%,
        rgba(0, 0, 0, 0.1) 100%
      );
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      border: 2px solid rgba(167, 139, 250, 0.2);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
    }

    .character-image {
      width: 348px;
      height: 348px;
      object-fit: contain;
      object-position: center;
    }
  </style>
</head>
<body>
  <div class="og-container">
    <div class="content">
      <div class="logo">
        <img src="${await getAsset("alchemy-logo-dark.svg")}" alt="Alchemy" class="logo-image" />
      </div>
      ${breadcrumbText ? `<div class="breadcrumb">${breadcrumbText}</div>` : ""}
      <h1 class="title">${data.title}</h1>
      ${
        data.description || data.excerpt
          ? `<p class="description">${data.description || data.excerpt}</p>`
          : ""
      }
    </div>

    <div class="character-container">
      <div class="character-circle">
        <img src="${await getAsset("alchemist.webp")}" alt="Alchemist" class="character-image" />
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // Use shared browser instance
  const browser = await getBrowser();
  const page = await browser.newPage();
  let screenshot: Buffer;

  try {
    // Set viewport to OG image size
    await page.setViewportSize({ width: 1200, height: 630 });

    // Set the HTML content (domcontentloaded is faster than networkidle)
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    // Wait for fonts to load
    await page.waitForTimeout(50);

    // Take a screenshot
    screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
    });
  } finally {
    // Always close the page to free resources
    await page.close();
  }

  // Update manifest - the build process will write to cache via symlink
  try {
    // Ensure the directory structure exists for when build process writes
    const cacheFileDir = dirname(cacheFile);
    try {
      await access(cacheFileDir, constants.F_OK);
    } catch {
      await mkdir(cacheFileDir, { recursive: true });
    }

    // Update manifest with new digest
    const updatedManifest = await loadManifest();
    updatedManifest[ogPath] = digest;
    await saveManifest(updatedManifest);
  } catch (e) {
    console.error("Failed to update manifest:", e);
  }

  // Return the screenshot as the response
  return new Response(Buffer.from(screenshot), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
