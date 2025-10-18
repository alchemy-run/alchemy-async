import { glob } from "glob";
import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";

const docsPath = path.join(
  import.meta.dirname,
  "..",
  "alchemy-web/src/content/docs",
);

// Find all markdown files
const files = await glob("**/*.md", {
  cwd: docsPath,
  absolute: true,
});

let processedCount = 0;
let skippedCount = 0;

for (const filePath of files) {
  try {
    const content = await readFile(filePath, "utf-8");

    // Check if file has frontmatter
    if (!content.startsWith("---")) {
      console.log(`Skipping ${filePath}: No frontmatter found`);
      skippedCount++;
      continue;
    }

    // Find the end of frontmatter
    const secondDashIndex = content.indexOf("---", 3);
    if (secondDashIndex === -1) {
      console.log(`Skipping ${filePath}: Invalid frontmatter`);
      skippedCount++;
      continue;
    }

    const frontmatter = content.substring(0, secondDashIndex + 3);
    const body = content.substring(secondDashIndex + 3);

    // Look for H1 heading in the body
    const h1Match = body.match(/^\s*# (.+)$/m);
    if (!h1Match) {
      console.log(`Skipping ${filePath}: No H1 heading found`);
      skippedCount++;
      continue;
    }

    const h1Title = h1Match[1].trim();

    // Remove the first H1 heading from the body (and following blank line if present)
    let bodyWithoutH1 = body.replace(/^\s*# .+\r?\n?/, "");
    // Remove a leading blank line that may follow the removed H1
    bodyWithoutH1 = bodyWithoutH1.replace(/^\s*\n/, "");

    // Update the title in frontmatter (replace or add if missing)
    let updatedFrontmatter = frontmatter;
    if (/^title:\s*/m.test(frontmatter)) {
      updatedFrontmatter = frontmatter.replace(
        /^title:.*$/m,
        `title: ${h1Title}`,
      );
    } else {
      // Insert title after the opening frontmatter line if it's missing
      updatedFrontmatter = frontmatter.replace(
        /^---\s*\n/,
        `---\n
title: ${h1Title}\n`,
      );
    }

    // Determine if any content changed
    const frontmatterChanged = updatedFrontmatter !== frontmatter;
    const bodyChanged = bodyWithoutH1 !== body;

    if (!frontmatterChanged && !bodyChanged) {
      console.log(`Skipping ${filePath}: No changes needed`);
      skippedCount++;
      continue;
    }

    // Ensure exactly one blank line between closing frontmatter and body
    const normalizedFrontmatter = updatedFrontmatter.replace(/\n*$/, "\n\n");
    const normalizedBody = bodyWithoutH1.replace(/^\n+/, "");
    const updatedContent = normalizedFrontmatter + normalizedBody;

    await writeFile(filePath, updatedContent, "utf-8");

    console.log(
      `✓ Updated ${path.relative(process.cwd(), filePath)}: "${h1Title}"`,
    );
    processedCount++;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

console.log("\nProcessing complete:");
console.log(`- Updated: ${processedCount} files`);
console.log(`- Skipped: ${skippedCount} files`);
console.log(`- Total: ${files.length} files`);
