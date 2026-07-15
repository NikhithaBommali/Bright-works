import type { ReactNode } from 'react';
import { CheckSquare2, MoonStar, SunMedium } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface BaseLayoutProps {
  isDark: boolean;
  onToggleTheme: () => void;
  header: ReactNode;
  sidebar: ReactNode;
  content: ReactNode;
}

export function BaseLayout({ isDark, onToggleTheme, header, sidebar, content }: BaseLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="glass-panel rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gradient-primary p-3 text-primary-foreground shadow-soft">
                <CheckSquare2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">BrightCone Unified Theme</p>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Todo control center</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn('hidden rounded-full border border-border px-3 py-1 text-xs text-muted-foreground sm:block', isDark ? 'bg-surface-secondary' : 'bg-background')}>
                {isDark ? 'Dark mode' : 'Light mode'}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={onToggleTheme} iconLeft={isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}>
                {isDark ? 'Light' : 'Dark'} mode
              </Button>
            </div>
          </div>
          <div className="mt-5">{header}</div>
        </header>

        <div className="grid flex-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">{sidebar}</aside>
          <section className="space-y-6">{content}</section>
        </div>
      </div>
    </main>
  );
}
