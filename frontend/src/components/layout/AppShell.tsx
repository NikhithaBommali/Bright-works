import type { ReactNode } from 'react';
import { CheckSquare, Moon, SunMedium } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-border/60 bg-card/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                <CheckSquare className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-teal">TaskFlow</p>
                <h1 className="text-2xl font-semibold sm:text-3xl">Plan work with calm, visible momentum</h1>
                <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                  Track tasks, update status, and keep your day organized from one focused workspace.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
            >
              {isDark ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </main>
  );
}
