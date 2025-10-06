import { useCallback, useEffect, useState } from "react";
import "./App.css";

import bunLogo from "./assets/logo.svg";
import alchemyLogo from "./assets/potion.png";
import reactLogo from "./assets/react.svg";

// This is ugly but it's necessary to support both local and prod environments
let apiBaseUrl: string = window.location.protocol + '//' + window.location.host;
try {
  // Bun will only inline this if we use exactly `process.env.PUBLIC_BACKEND_URL` it we use other forms including process?.env for example bun will not inline it
  // we can't check typeof process either because process may not be available but Bun may already have inlined process.env.PUBLIC_BACKEND_URL with the correct value
  apiBaseUrl = process.env.PUBLIC_BACKEND_URL ?? apiBaseUrl;
} catch {
  // Bun may not have had anything to inline and process.env may not exist to above can throw an error
  // do nothing
}
console.log("Using apiBaseUrl", apiBaseUrl);

function backendUrl(path: string) {
  if(path.startsWith('/')) {
    return `${apiBaseUrl.replace(/\/$/, '')}${path}`;
  }
  const currentPathWithoutQuery = window.location.pathname.split('?')[0];
  const pathDirs = currentPathWithoutQuery.split('/');
  pathDirs.pop();  // we never want the 'filename'
  while(path.startsWith('..')) {
    pathDirs.shift();
    pathDirs.shift();
  }
  const newPath = pathDirs.join('/');
  return `${apiBaseUrl}${newPath}${path}`;
}

function fetchBackend(path: string, init?: Parameters<typeof fetch>[1]) {
  return fetch(backendUrl(path), init);
}

function useServerCounter(key: string) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial counter value
  useEffect(() => {
    fetchBackend(`/api/test/kv/${key}`)
      .then((res) => {
        if(res.status === 404) return "0";
        return res.ok ? res.text() : null;
      })
      .then((value) => setCount(value ? Number.parseInt(value, 10) : 0))
      .catch(() => setError("Failed to load counter"))
      .finally(() => setLoading(false));
  }, [key]);

  // Increment with optimistic update and rollback on error
  const increment = useCallback(async () => {
    const oldCount = count;
    const newCount = count + 1;
    setCount(newCount);
    setError(null);

    try {
      const response = await fetchBackend(`/api/test/kv/${key}`, {
        method: "PUT",
        body: newCount.toString(),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }
    } catch {
      // Rollback on error
      setCount(oldCount);
      setError("Failed to save counter");
    }
  }, [count, key]);

  return { count, loading, error, increment };
}

function App() {
  const { count, loading, error, increment } = useServerCounter("counter");

  return (
    <>
      <div>
        <a href="https://bun.sh" target="_blank" rel="noopener">
          <img src={bunLogo} className="logo bun" alt="Bun logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://alchemy.run" target="_blank" rel="noopener">
          <img src={alchemyLogo} className="logo alchemy" alt="Alchemy logo" />
        </a>
      </div>
      <h1>Bun + React + Alchemy</h1>
      <div className="card">
        <button onClick={increment} disabled={loading}>
          {loading ? "Loading..." : `count is ${count}`}
        </button>
        {error && <p style={{ color: "red", fontSize: "0.9em" }}>{error}</p>}
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR (frontend changes are applied in real time)
        </p>
        <p>
          Edit <code>src/server.tsx</code> and save to test alchemy dev (backend changes are applied in real time)
        </p>
        <p style={{ fontSize: "0.9em", opacity: 0.7 }}>
          Counter persisted in Cloudflare KV
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Bun, React, and Alchemy logos to learn more
      </p>
    </>
  );
}

export default App;
