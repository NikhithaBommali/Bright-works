import { CalendarRange } from 'lucide-react';
import type { WeekDay } from '../../api-client/mealPlanner';
import { Card } from '../ui/Card';
import { ChipButton } from '../ui/ChipButton';

interface WeeklyPlannerProps {
  weekStart: string;
  days: WeekDay[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

function getDayLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return {
    weekday: parsed.toLocaleDateString(undefined, { weekday: 'short' }),
    day: parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
  };
}

export function WeeklyPlanner({ weekStart, days, selectedDate, onSelectDate }: WeeklyPlannerProps) {
  return (
    <Card className="space-y-4 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Weekly plan</p>
          <p className="mt-1 text-sm text-muted-foreground">Tap a day to review that day's saved meals or see which days still need planning.</p>
        </div>
        <div className="rounded-2xl bg-accent/10 p-2 text-accent">
          <CalendarRange className="h-5 w-5" />
        </div>
      </div>

      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Week of {weekStart}</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {days.map((day) => {
          const label = getDayLabel(day.date);
          const active = day.date === selectedDate;
          return (
            <ChipButton
              key={day.date}
              active={active}
              onClick={() => onSelectDate(day.date)}
              className="h-auto flex-col items-start rounded-2xl px-3 py-3 text-left"
            >
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{label.weekday}</span>
              <span className="text-sm font-semibold text-foreground">{label.day}</span>
              <span className="text-xs text-muted-foreground">{day.meals ? 'Planned' : 'Open'}</span>
            </ChipButton>
          );
        })}
      </div>
    </Card>
  );
}
