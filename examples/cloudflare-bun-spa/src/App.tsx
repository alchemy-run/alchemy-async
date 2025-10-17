import { useCallback, useEffect, useState } from "react";
import "./App.css";

import { getBackendUrl } from "alchemy/cloudflare/bun-spa";
import bunLogo from "./assets/logo.svg";
import alchemyLogo from "./assets/potion.png";
import reactLogo from "./assets/react.svg";

const apiBaseUrl = getBackendUrl();

function backendUrl(path: string) {
  return new URL(path, apiBaseUrl);
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
          Edit <code>src/worker.tsx</code> and save to test alchemy dev (backend changes are applied in real time)
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
