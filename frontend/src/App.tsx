import { ThemeProvider } from './context';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  return (
    <ThemeProvider>
      <LoginPage />
    </ThemeProvider>
  );
}