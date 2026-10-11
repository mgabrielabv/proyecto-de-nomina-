import { motion, useReducedMotion } from 'framer-motion';
import { AnimatedBackground } from '../../components/background/AnimatedBackground';
import { AuthCard } from '../../components/auth/AuthCard';
import { BrandMark } from '../../components/ui/BrandMark';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

export function LoginPage() {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-dvh bg-bg font-sans text-text">
      <div className="page-gradient pointer-events-none fixed inset-0" aria-hidden />
      <ThemeToggle className="fixed right-5 top-5 z-50" />
      <main className="relative mx-auto grid min-h-dvh max-w-[1600px] grid-cols-1 lg:grid-cols-2">
        <section className="flex items-center justify-center px-4 py-20 sm:px-10 lg:px-14">
          <AuthCard />
        </section>
        <section className="relative hidden min-h-dvh overflow-hidden border-l border-border lg:block" aria-hidden>
          <AnimatedBackground>
            <div className="flex h-full flex-col justify-between p-10 xl:p-14">
              <BrandMark />
              <div className="mx-auto w-full max-w-md py-8">
                <motion.svg
                  viewBox="0 0 48 48"
                  className="mb-10 h-10 w-10 text-text-secondary"
                  animate={reduce ? undefined : { rotate: 360 }}
                  transition={reduce ? undefined : { duration: 48, repeat: Infinity, ease: 'linear' }}
                  aria-hidden
                >
                  <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                    <path d="M24 4v40" />
                    <path d="M24 4v40" transform="rotate(45 24 24)" />
                    <path d="M24 4v40" transform="rotate(90 24 24)" />
                    <path d="M24 4v40" transform="rotate(135 24 24)" />
                    <circle cx="24" cy="24" r="9.5" strokeWidth="1" opacity="0.6" />
                  </g>
                </motion.svg>
                <h2 className="max-w-xl text-balance text-4xl font-light leading-[1.15] tracking-tight text-text xl:text-5xl">
                  Menos ruido.
                  <br />
                  <span className="font-semibold">Más foco.</span>
                </h2>
                <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-text-secondary">
                  La plataforma moderna para el pago de nómina. Gestiona salarios, dispersa pagos y calcula
                  retenciones de todo tu equipo en un solo lugar.
                </p>
                <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
                  <div>
                    <dt className="text-2xl font-semibold tracking-tight text-text">1.4M</dt>
                    <dd className="text-xs uppercase tracking-wider text-text-muted">Nóminas al mes</dd>
                  </div>
                  <div>
                    <dt className="text-2xl font-semibold tracking-tight text-text">99.99%</dt>
                    <dd className="text-xs uppercase tracking-wider text-text-muted">Precisión en pagos</dd>
                  </div>
                  <div>
                    <dt className="text-2xl font-semibold tracking-tight text-text">12k+</dt>
                    <dd className="text-xs uppercase tracking-wider text-text-muted">Equipos gestionados</dd>
                  </div>
                </dl>
              </div>
              <p className="text-xs text-text-muted">© {new Date().getFullYear()} Onyx. Diseñado con intención.</p>
            </div>
          </AnimatedBackground>
        </section>
      </main>
    </div>
  );
}