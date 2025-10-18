export default function Home() {
  return (
    <main className="container">
      <h1>Welcome to Next.js on Cloudflare Workers!</h1>
      <p>
        This is a Next.js application deployed to Cloudflare Workers using{" "}
        <a href="https://alchemy.run" target="_blank" rel="noopener noreferrer">
          Alchemy
        </a>
        .
      </p>

      <section>
        <h2>Features</h2>
        <ul>
          <li>🚀 Server-side rendering</li>
          <li>⚡️ Hot Module Replacement</li>
          <li>📦 Asset optimization</li>
          <li>🔄 Server Actions</li>
          <li>🔒 TypeScript</li>
          <li>🌐 Edge runtime</li>
        </ul>
      </section>

      <section>
        <h2>Get Started</h2>
        <p>
          Edit <code>src/app/page.tsx</code> and save to see your changes.
        </p>
      </section>

      <footer>
        <p>
          Learn more:{" "}
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Next.js Docs
          </a>{" "}
          |{" "}
          <a
            href="https://alchemy.run"
            target="_blank"
            rel="noopener noreferrer"
          >
            Alchemy Docs
          </a>
        </p>
      </footer>
    </main>
  );
}
