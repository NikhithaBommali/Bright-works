import type { ReactNode } from 'react';
import { ChartNoAxesCombined, MoonStar, RefreshCcw, SunMedium, WalletCards } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useDarkMode } from '../../hooks/useDarkMode';

interface AppShellProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  isRefreshing: boolean;
}

export function AppShell({ children, onRefresh, isRefreshing }: AppShellProps) {
  const { isDark, toggleTheme } = useDarkMode();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="section-shell relative overflow-hidden p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-primary opacity-10" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <Badge className="w-fit">BrightCone SpendLog</Badge>
              <div className="space-y-2">
                <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  <WalletCards className="h-8 w-8 text-primary" />
                  Spend clarity for every day
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Track expenses, watch category trends, and keep your personal ledger current with the latest persisted data.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
                  <ChartNoAxesCombined className="h-4 w-4 text-primary" />
                  Live dashboard summaries
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
                  <RefreshCcw className="h-4 w-4 text-primary" />
                  CRUD synced with /api/expenses
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
              <Button
                type="button"
                variant="outline"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                {isDark ? 'Light mode' : 'Dark mode'}
              </Button>
              <Button type="button" variant="primary" onClick={onRefresh} disabled={isRefreshing} aria-label="Refresh expenses">
                <RefreshCcw className={isRefreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <section className="mt-6 flex-1">{children}</section>
      </div>
    </main>
  );
}
