import { RouterProvider } from "react-router";
import { router } from "./routes";
import { BrandProvider } from "./context/BrandContext";
import { GalleryProvider } from "./context/GalleryContext";
import { ProceduresProvider } from "./context/ProceduresContext";
import { CategoriesProvider } from "./context/CategoriesContext";
import { AppointmentsProvider } from "./context/AppointmentsContext";
import { UsersProvider } from "./context/UsersContext";
import { AuthProvider } from "./context/AuthContext";
import { GoogleCalendarProvider } from "./context/GoogleCalendarContext";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <GoogleCalendarProvider>
        <BrandProvider>
          <GalleryProvider>
            <CategoriesProvider>
              <ProceduresProvider>
                <UsersProvider>
                  <AppointmentsProvider>
                    <RouterProvider router={router} />
                    <Toaster richColors position="bottom-right" />
                  </AppointmentsProvider>
                </UsersProvider>
              </ProceduresProvider>
            </CategoriesProvider>
          </GalleryProvider>
        </BrandProvider>
      </GoogleCalendarProvider>
    </AuthProvider>
  );
}
