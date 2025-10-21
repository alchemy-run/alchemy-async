import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@orange-js/orange";

import rootStyles from "./root.css?inline";

export const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <style>{rootStyles}</style>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  let status = 500;
  let details = "Internal Server Error";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    details = error.statusText;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="w-screen h-screen flex flex-col gap-2 items-center justify-center mx-auto">
      <h1 className="text-xl font-mono">HTTP {status}</h1>
      <h2 className="text-5xl font-mono border-orange-500 border-b-2 pb-3 border-dotted">
        {details}
      </h2>
      {stack && <pre className="text-xs text-left">{stack}</pre>}
    </main>
  );
}
