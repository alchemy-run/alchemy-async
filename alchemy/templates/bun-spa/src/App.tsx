import { getBackendUrl } from "alchemy/cloudflare/bun-spa";
import { useState } from "react";
import "./App.css";
import bunLogo from "./assets/logo.svg";
import reactLogo from "./assets/react.svg";

const apiBaseUrl = getBackendUrl();

function backendUrl(path: string) {
  return new URL(path, apiBaseUrl);
}

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState<string>("");

  const callBackend = async () => {
    const response = await fetch(backendUrl("/api/hello"));
    const data = (await response.json()) as { message: string };
    setMessage(data.message);
  };

  return (
    <>
      <div>
        <a href="https://bun.sh" target="_blank" rel="noopener">
          <img src={bunLogo} className="logo bun" alt="Bun logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Bun + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <div className="card">
        <button onClick={callBackend}>Call Backend API</button>
        {message && <p>Response: {message}</p>}
      </div>
      <p className="read-the-docs">
        Click on the Bun and React logos to learn more
      </p>
    </>
  );
}

export default App;

