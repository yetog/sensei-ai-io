import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { FileProvider } from '@/contexts/FileContext'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <FileProvider projectId="default">
        <App />
        <Toaster />
      </FileProvider>
    </QueryClientProvider>
  </BrowserRouter>
);
