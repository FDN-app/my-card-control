import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/store";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import Cards from "./pages/Cards";
import CardDetail from "./pages/CardDetail";
import NewExpense from "./pages/NewExpense";
import ImportExpenses from "./pages/ImportExpenses";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/tarjetas" element={<Cards />} />
              <Route path="/tarjetas/:id" element={<CardDetail />} />
              <Route path="/gastos/nuevo" element={<NewExpense />} />
              <Route path="/gastos/importar" element={<ImportExpenses />} />
              <Route path="/configuracion" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
