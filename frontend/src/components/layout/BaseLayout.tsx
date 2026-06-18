import type { ReactNode } from 'react';
import { BookUser, Layers3 } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Badge } from '../ui/Badge';

interface BaseLayoutProps {
  isDark: boolean;
  onToggleTheme: () => void;
  sidebar: ReactNode;
  content: ReactNode;
  utility?: ReactNode;
}

export function BaseLayout({ isDark, onToggleTheme, sidebar, content, utility }: BaseLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="glass-panel rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-primary p-3 text-primary-foreground shadow-soft">
                  <BookUser className="h-6 w-6" />
                </div>
                <Badge variant="accent" className="gap-1 px-3 py-1.5">
                  <Layers3 className="h-3.5 w-3.5" /> BrightCone Rolodex
                </Badge>
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Your premium <span className="text-gradient">contact command center</span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Search, review, create, and maintain every relationship in a single polished workspace.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-start lg:self-auto">
              {utility}
              <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-6">{sidebar}</aside>
          <section className="space-y-6">{content}</section>
        </div>
      </div>
    </main>
  );
}
