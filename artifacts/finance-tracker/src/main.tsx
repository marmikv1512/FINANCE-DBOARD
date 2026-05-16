import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// In dev: Vite proxies /api → backend. In prod: VITE_API_URL = backend URL.
const apiBase = import.meta.env.VITE_API_URL || "https://workspaceapi-server-production-6e02.up.railway.app";
setBaseUrl(apiBase);

createRoot(document.getElementById("root")!).render(<App />);
