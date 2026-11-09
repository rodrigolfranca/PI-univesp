import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: [
        "src/app/services/**/*.ts",
        "src/app/utils/**/*.ts",
        "src/app/context/AuthContext.tsx",
        "src/app/context/UsersContext.tsx",
        "src/app/context/BrandContext.tsx",
        "src/app/context/GalleryContext.tsx",
        "src/app/context/ProceduresContext.tsx",
        "src/app/context/CategoriesContext.tsx",
        "src/app/context/AppointmentsContext.tsx",
        "src/app/pages/LandingPage.tsx",
        "src/app/pages/SettingsPage.tsx",
        "src/app/pages/AppointmentsPage.tsx",
        "src/app/pages/AvailabilityPage.tsx",
        "src/app/pages/cliente/ClienteAgendamentosPage.tsx",
        "src/app/pages/cliente/ClienteNovoAgendamentoPage.tsx",
        "src/app/pages/cliente/ClienteNotificacoesPage.tsx",
        "src/app/pages/cliente/ClientePerfilPage.tsx",
      ],
      exclude: ["**/*.test.*"],
      reporter: ["text", "html", "lcov"],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 80,
        lines: 90,
      },
    },
  },
});
