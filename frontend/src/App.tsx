import { MotionConfig } from 'framer-motion';
import { usePauseAnimationsWhenHidden } from './hooks';
import { ThemeProvider } from './context';
import { AppRouter } from './routes';
import { ToastHost } from './components/ui/Toast';

export default function App() {
  usePauseAnimationsWhenHidden();
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AppRouter />
        <ToastHost />
      </ThemeProvider>
    </MotionConfig>
  );
}
