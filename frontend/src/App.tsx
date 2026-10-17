import { ThemeProvider } from './context';
import { AppRouter } from './routes';
import { ToastHost } from './components/ui/Toast';

export default function App() {
  return (
    <ThemeProvider>
      <AppRouter />
      <ToastHost />
    </ThemeProvider>
  );
}
