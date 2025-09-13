import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FileProvider } from "@/contexts/FileContext";
import Workspace from "./pages/Workspace";
import Datasets from "./pages/Datasets";
import Agents from "./pages/Agents";
import Products from "./pages/Products";
import Settings from "./pages/Settings";
import Tools from "./pages/Tools";
import NotFound from "./pages/NotFound";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { Sword } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FileProvider projectId="default">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <AppSidebar />
              <SidebarInset className="flex-1">
                <header className="sticky top-0 z-40 h-14 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger className="-ml-1" />
                    <BreadcrumbNav />
                  </div>
                  <div className="hidden sm:flex items-center gap-2 group relative">
                    <div className="relative">
                      <span className="text-lg font-bold">Sensei <span className="text-primary">AI</span></span>
                      {/* Samurai sword animation */}
                      <Sword className="absolute -top-5 -left-8 h-8 w-8 text-primary katana-sword" />
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">Your GPT Trainer</span>
                  </div>
                </header>

                <main className="animate-fade-in">
                  <Routes>
                    <Route path="/" element={<Workspace />} />
                    <Route path="/workspace" element={<Workspace />} />
                    <Route path="/datasets" element={<Datasets />} />
                    <Route path="/agents" element={<Agents />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/tools" element={<Tools />} />
                    <Route path="/settings" element={<Settings />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </SidebarInset>
            </div>
            <WelcomeOnboarding />
          </SidebarProvider>
        </BrowserRouter>
      </FileProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
