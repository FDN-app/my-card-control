import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import Cards from "./pages/Cards";
import CardDetail from "./pages/CardDetail";
import NewExpense from "./pages/NewExpense";
import ImportExpenses from "./pages/ImportExpenses";
import Subscriptions from "./pages/Subscriptions";
import Finanzas from "./pages/Finanzas";
import SettingsPage from "./pages/Settings";
import MetasAhorro from "./pages/MetasAhorro";
import MetasDiariasPage from "./pages/MetasDiariasPage";
import Conductor from "./pages/Conductor";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Landing from "./pages/Landing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <TooltipProvider>
          <Toaster />
          <SonnerToaster />
          <AppProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/landing" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/tarjetas" element={<Cards />} />
                    <Route path="/tarjetas/:id" element={<CardDetail />} />
                    <Route path="/gastos/nuevo" element={<NewExpense />} />
                    <Route path="/gastos/editar/:id" element={<NewExpense />} />
                    <Route path="/gastos/importar" element={<ImportExpenses />} />
                    <Route path="/suscripciones" element={<Subscriptions />} />
                    <Route path="/finanzas" element={<Finanzas />} />
                    <Route path="/metas" element={<MetasAhorro />} />
                    <Route path="/metas-diarias" element={<MetasDiariasPage />} />
                    <Route path="/conductor" element={<Conductor />} />
                    <Route path="/configuracion" element={<SettingsPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AppProvider>
        </TooltipProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
