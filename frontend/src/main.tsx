import { createRoot } from "react-dom/client";
import App from "./app/App";
import { loadSite } from "./app/config/registry";
import { SiteProvider } from "./app/config/SiteContext";
import "./styles/index.css";
async function bootstrap() {
  const site = await loadSite(
    window.location.hostname,
    import.meta.env.VITE_CLIENTE,
  );
  document.title = site.identity.name;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", site.identity.description);
  createRoot(document.getElementById("root")!).render(
    <SiteProvider site={site}>
      <App />
    </SiteProvider>,
  );
}
bootstrap().catch((error) => {
  console.error(error);
  const root = document.getElementById("root");
  if (root)
    root.textContent = "Não foi possível carregar a configuração do site.";
});
