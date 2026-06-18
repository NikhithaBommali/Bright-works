import { Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface PlannerHeroProps {
  onGenerate: () => void;
  generating: boolean;
}

export function PlannerHero({ onGenerate, generating }: PlannerHeroProps) {
  return (
    <Card className="mb-6 overflow-hidden border-border/70 bg-card/80 p-0">
      <div className="bg-gradient-primary px-5 py-6 text-primary-foreground sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Kids Daily Meal Planner
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Warm, flexible meal plans for busy families.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/85 sm:text-base">
              Set preferences once, generate today’s meals, swap a single slot when plans change, and keep favorite kid-approved meals close.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={onGenerate} loading={generating} className="bg-white text-slate-900 hover:bg-white/90">
              {!generating ? <Sparkles className="h-4 w-4" /> : null}
              Generate today’s plan
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
