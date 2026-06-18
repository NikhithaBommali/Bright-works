import type { WeekDay } from '../../types/mealPlanner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionHeading } from '../ui/SectionHeading';
import { Skeleton } from '../ui/Skeleton';

interface WeekCalendarProps {
  days: WeekDay[];
  selectedDate: string;
  loading: boolean;
  onSelectDate: (date: string) => void;
}

export function WeekCalendar({ days, selectedDate, loading, onSelectDate }: WeekCalendarProps) {
  return (
    <Card className="min-w-0">
      <SectionHeading eyebrow="Week" title="Pick a day" description="Tap a day to review that plan and generate meals for today if needed." />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {loading
          ? Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-24" />)
          : days.map((day) => {
              const mealCount = day.meals.length;
              const isSelected = day.date === selectedDate;
              return (
                <Button
                  key={day.date}
                  type="button"
                  variant={isSelected ? 'primary' : 'outline'}
                  className="h-auto min-w-0 flex-col items-start rounded-2xl px-4 py-4 text-left"
                  onClick={() => onSelectDate(day.date)}
                >
                  <span className="text-xs uppercase tracking-wide opacity-80">{new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                  <span className="text-sm font-semibold">{new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  <span className="text-xs opacity-80">{mealCount}/4 meals</span>
                </Button>
              );
            })}
      </div>
    </Card>
  );
}
