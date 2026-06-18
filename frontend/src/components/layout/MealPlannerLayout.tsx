import type { ReactNode } from 'react';
import { CalendarDays, Sparkles, UtensilsCrossed } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Badge } from '../ui/Badge';

interface MealPlannerLayoutProps {
  isDark: boolean;
  onToggleTheme: () => void;
  sidebar: ReactNode;
  content: ReactNode;
  utility?: ReactNode;
}

export function MealPlannerLayout({ isDark, onToggleTheme, sidebar, content, utility }: MealPlannerLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="glass-panel overflow-hidden rounded-3xl p-6 sm:p-7">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-primary opacity-10 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl bg-gradient-primary p-3 text-primary-foreground shadow-soft">
                  <UtensilsCrossed className="h-6 w-6" />
                </div>
                <Badge variant="accent" className="gap-1 px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> AI-assisted planning
                </Badge>
                <Badge className="gap-1 px-3 py-1.5">
                  <CalendarDays className="h-3.5 w-3.5" /> Family-friendly weekly view
                </Badge>
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Kids Daily <span className="text-gradient">Meal Planner</span>
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
                  Save your family preferences, generate fresh ideas for breakfast through dinner, and revisit the full week in one colorful planner.
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
