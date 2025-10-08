import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// @ts-expect-error this is a dev only feature
if (import.meta.hot) {
  // @ts-expect-error this is a dev only feature
  import.meta.hot.accept();
}
