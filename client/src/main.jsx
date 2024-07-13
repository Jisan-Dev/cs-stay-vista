import ReactDOM from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import AuthProvider from './providers/AuthProvider';
import { router } from './routes/Routes';
import { Toaster } from 'react-hot-toast';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BooleanProvider } from './providers/BooleanProvider';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BooleanProvider>
          <RouterProvider router={router} />
          <Toaster />
        </BooleanProvider>
      </QueryClientProvider>
    </AuthProvider>
  </HelmetProvider>
);
