import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import Cards from "./pages/Cards";
import CardDetail from "./pages/CardDetail";
import NewExpense from "./pages/NewExpense";
import ImportExpenses from "./pages/ImportExpenses";
import Subscriptions from "./pages/Subscriptions";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <SonnerToaster />
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/tarjetas" element={<Cards />} />
                  <Route path="/tarjetas/:id" element={<CardDetail />} />
                  <Route path="/gastos/nuevo" element={<NewExpense />} />
                  <Route path="/gastos/importar" element={<ImportExpenses />} />
                  <Route path="/suscripciones" element={<Subscriptions />} />
                  <Route path="/configuracion" element={<SettingsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
