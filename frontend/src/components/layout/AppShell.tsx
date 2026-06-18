import type { ReactNode } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import { Moon, Sun } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { theme, toggleTheme } = useTheme();
  const Icon = theme === 'dark' ? Sun : Moon;

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-gradient-primary opacity-15 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            onClick={toggleTheme}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </main>
  );
}
