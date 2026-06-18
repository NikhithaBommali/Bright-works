import { useState } from 'react';
import { CalendarDays, ChefHat, Clock3, Heart, Sparkles, Trash2 } from 'lucide-react';
import type { DayPlan, Meal, MealSlot } from '../../types/mealPlanner';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Collapsible } from '../ui/Collapsible';
import { Skeleton } from '../ui/Skeleton';

const SLOT_ORDER: MealSlot[] = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

interface DailyPlanPanelProps {
  dateLabel: string;
  plan: DayPlan | null;
  loading: boolean;
  alternativeSlot: MealSlot | null;
  favorites: Meal[];
  onGenerate: () => void;
  onSuggestAlternative: (slot: MealSlot) => void;
  onSaveFavorite: (meal: Meal) => void;
  onRemoveFavorite: (meal: Meal) => void;
}

function hasFavorite(favorites: Meal[], meal: Meal) {
  return favorites.some((favorite) => favorite.name === meal.name && favorite.slot === meal.slot);
}

interface MealCardProps {
  slot: MealSlot;
  meal: Meal | null;
  loadingAlternative: boolean;
  favoriteSaved: boolean;
  onSuggestAlternative: (slot: MealSlot) => void;
  onSaveFavorite: (meal: Meal) => void;
  onRemoveFavorite: (meal: Meal) => void;
}

function MealCard({ slot, meal, loadingAlternative, favoriteSaved, onSuggestAlternative, onSaveFavorite, onRemoveFavorite }: MealCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone="soft">{slot}</Badge>
          <h3 className="mt-3 text-xl font-semibold text-foreground">{meal?.name ?? `No ${slot.toLowerCase()} planned yet`}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {meal?.description ?? 'Generate a day plan to receive a kid-friendly idea for this meal slot.'}
          </p>
        </div>
        <ChefHat className="h-5 w-5 shrink-0 text-primary" />
      </div>

      {meal ? (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge><Clock3 className="mr-1 h-3 w-3" /> {Number(meal.prepTimeMinutes ?? 0)} min</Badge>
            <Badge tone="accent">{meal.difficulty}</Badge>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => onSuggestAlternative(slot)} loading={loadingAlternative}>
              {!loadingAlternative ? <Sparkles className="h-4 w-4" /> : null}
              Suggest alternative
            </Button>
            <Button
              type="button"
              variant={favoriteSaved ? 'destructive' : 'secondary'}
              onClick={() => (favoriteSaved ? onRemoveFavorite(meal) : onSaveFavorite(meal))}
            >
              {favoriteSaved ? <Trash2 className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
              {favoriteSaved ? 'Remove favorite' : 'Save favorite'}
            </Button>
          </div>

          <div className="mt-5">
            <Collapsible title="Ingredients" open={open} onToggle={() => setOpen((current) => !current)}>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {meal.ingredients.map((ingredient) => (
                  <li key={ingredient} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </Collapsible>
          </div>
        </>
      ) : null}
    </Card>
  );
}

function EmptyPlanState({ onGenerate, loading }: { onGenerate: () => void; loading: boolean }) {
  return (
    <Card className="border-dashed text-center">
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <CalendarDays className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-2xl font-semibold text-foreground">Plan today’s meals</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Start with a full day of breakfast, lunch, snack, and dinner ideas tailored to your saved preferences.
        </p>
        <Button type="button" className="mt-5" onClick={onGenerate} loading={loading}>
          {!loading ? <Sparkles className="h-4 w-4" /> : null}
          Plan today’s meals
        </Button>
      </div>
    </Card>
  );
}

export function DailyPlanPanel({ dateLabel, plan, loading, alternativeSlot, favorites, onGenerate, onSuggestAlternative, onSaveFavorite, onRemoveFavorite }: DailyPlanPanelProps) {
  const mealsBySlot = new Map(plan?.meals.map((meal) => [meal.slot, meal]) ?? []);
  const hasMeals = Boolean(plan && plan.meals.length > 0);

  return (
    <section className="min-w-0">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-foreground">Plan for {dateLabel}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Breakfast, lunch, snack, and dinner all in one easy scan.</p>
      </div>

      {!hasMeals && !loading ? (
        <EmptyPlanState onGenerate={onGenerate} loading={false} />
      ) : loading && !hasMeals ? (
        <div className="grid gap-4 md:grid-cols-2">
          {SLOT_ORDER.map((slot) => <Skeleton key={slot} className="h-72" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {SLOT_ORDER.map((slot) => {
            const meal = mealsBySlot.get(slot) ?? null;
            return (
              <MealCard
                key={slot}
                slot={slot}
                meal={meal}
                loadingAlternative={alternativeSlot === slot}
                favoriteSaved={meal ? hasFavorite(favorites, meal) : false}
                onSuggestAlternative={onSuggestAlternative}
                onSaveFavorite={onSaveFavorite}
                onRemoveFavorite={onRemoveFavorite}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
