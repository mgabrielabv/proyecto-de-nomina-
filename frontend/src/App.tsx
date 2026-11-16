import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from './context';
import { AppRouter } from './routes';
import { ToastHost } from './components/ui/Toast';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AppRouter />
        <ToastHost />
      </ThemeProvider>
    </MotionConfig>
  );
}
