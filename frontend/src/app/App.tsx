import { RouterProvider } from 'react-router';
import { router } from './routes';
import { BrandProvider } from './context/BrandContext';
import { GalleryProvider } from './context/GalleryContext';
import { ProceduresProvider } from './context/ProceduresContext';
import { CategoriesProvider } from './context/CategoriesContext';
import { AppointmentsProvider } from './context/AppointmentsContext';
import { ClientsProvider } from './context/ClientsContext';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <BrandProvider>
        <GalleryProvider>
          <CategoriesProvider>
            <ProceduresProvider>
              <ClientsProvider>
                <AppointmentsProvider>
                  <RouterProvider router={router} />
                  <Toaster richColors position="bottom-right" />
                </AppointmentsProvider>
              </ClientsProvider>
            </ProceduresProvider>
          </CategoriesProvider>
        </GalleryProvider>
      </BrandProvider>
    </AuthProvider>
  );
}
