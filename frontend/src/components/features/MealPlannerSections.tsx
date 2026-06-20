import { useMemo, useState } from 'react';
import { CalendarDays, ChefHat, Clock3, Heart, Loader2, Save, Sparkles, Trash2, Users } from 'lucide-react';
import type { Favorite, Meal, MealSlot, Preferences, WeekResponse } from '../../api-client/mealPlanner';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CheckboxChip } from '../ui/CheckboxChip';
import { Collapsible } from '../ui/Collapsible';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { SectionHeading } from '../ui/SectionHeading';
import { Select } from '../ui/Select';
import { Skeleton } from '../ui/Skeleton';
import { Textarea } from '../ui/Textarea';

interface PlannerHeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onGenerate: () => void;
  generating: boolean;
  ThemeIcon: React.ComponentType<{ className?: string }>;
}

export function PlannerHeader({ theme, onToggleTheme, onGenerate, generating, ThemeIcon }: PlannerHeaderProps) {
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
            <Button type="button" variant="outline" size="icon" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              <ThemeIcon className="h-4 w-4" />
            </Button>
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

interface PreferencesPanelProps {
  preferences: Preferences;
  saving: boolean;
  cuisineOptions: string[];
  ageOptions: string[];
  dietaryOptions: string[];
  onChange: (next: Preferences) => void;
  onSave: () => void;
}

export function PreferencesPanel({ preferences, saving, cuisineOptions, ageOptions, dietaryOptions, onChange, onSave }: PreferencesPanelProps) {
  const selectedDietary = useMemo(() => new Set(preferences.dietaryRestrictions), [preferences.dietaryRestrictions]);
  const selectedCuisine = useMemo(() => new Set(preferences.cuisinePreferences), [preferences.cuisinePreferences]);

  function toggleValue(values: string[], value: string) {
    return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
  }

  return (
    <Card>
      <SectionHeading
        eyebrow="Preferences"
        title="Make the plan fit your family"
        description="Save kid count, age range, dietary needs, foods to avoid, and favorite cuisine styles before generating meals."
        action={<Button type="button" onClick={onSave} loading={saving}>Save preferences</Button>}
      />
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="numberOfKids">Number of kids</Label>
          <Input
            id="numberOfKids"
            type="number"
            min={1}
            value={preferences.numberOfKids}
            onChange={(event) => onChange({ ...preferences, numberOfKids: Number(event.target.value || 1) })}
          />
        </div>
        <div>
          <Label htmlFor="ageRange">Age range</Label>
          <Select id="ageRange" value={preferences.ageRange} onChange={(event) => onChange({ ...preferences, ageRange: event.target.value })}>
            <option value="">Select an age range</option>
            {ageOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Dietary restrictions</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {dietaryOptions.map((option) => (
              <CheckboxChip
                key={option}
                checked={selectedDietary.has(option)}
                label={option}
                onToggle={() => onChange({ ...preferences, dietaryRestrictions: toggleValue(preferences.dietaryRestrictions, option) })}
              />
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="foodsToAvoid">Foods to avoid</Label>
          <Textarea
            id="foodsToAvoid"
            value={preferences.foodsToAvoid}
            onChange={(event) => onChange({ ...preferences, foodsToAvoid: event.target.value })}
            placeholder="Example: mushrooms, peanuts, spicy sauces"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Cuisine preferences</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {cuisineOptions.map((option) => (
              <CheckboxChip
                key={option}
                checked={selectedCuisine.has(option)}
                label={option}
                onToggle={() => onChange({ ...preferences, cuisinePreferences: toggleValue(preferences.cuisinePreferences, option) })}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface WeekStripProps {
  weekPlan: WeekResponse | null;
  selectedDate: string;
  loading: boolean;
  mealSlots: MealSlot[];
  formatDateLabel: (date: string) => string;
  onSelectDate: (date: string) => void;
}

export function WeekStrip({ weekPlan, selectedDate, loading, mealSlots, formatDateLabel, onSelectDate }: WeekStripProps) {
  return (
    <Card>
      <SectionHeading eyebrow="Week" title="Pick a day" description="Tap a day to review that plan and generate meals for today if needed." />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {loading
          ? Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-24" />)
          : weekPlan?.days.map((day) => {
              const mealCount = mealSlots.filter((slot) => day.meals.some((meal) => meal.slot === slot)).length;
              const isSelected = day.date === selectedDate;
              return (
                <Button
                  key={day.date}
                  type="button"
                  variant={isSelected ? 'primary' : 'outline'}
                  className="h-auto flex-col items-start rounded-2xl px-4 py-4 text-left"
                  onClick={() => onSelectDate(day.date)}
                >
                  <span className="text-xs uppercase tracking-wide opacity-80">{new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                  <span className="text-sm font-semibold">{formatDateLabel(day.date)}</span>
                  <span className="text-xs opacity-80">{mealCount}/4 meals</span>
                </Button>
              );
            })}
      </div>
    </Card>
  );
}

interface DailyPlanSectionProps {
  selectedDate: string;
  hasAnyMeal: boolean;
  generateLoading: boolean;
  mealSlots: MealSlot[];
  currentMeals: Record<MealSlot, Meal | null> | null;
  favoriteIdsByName: Map<string, string>;
  alternativeLoadingSlot: MealSlot | null;
  onGenerate: () => void;
  onSuggestAlternative: (slot: MealSlot) => void;
  onToggleFavorite: (meal: Meal, favoriteId?: string) => void;
  formatDateLabel: (date: string) => string;
}

export function DailyPlanSection({ selectedDate, hasAnyMeal, generateLoading, mealSlots, currentMeals, favoriteIdsByName, alternativeLoadingSlot, onGenerate, onSuggestAlternative, onToggleFavorite, formatDateLabel }: DailyPlanSectionProps) {
  return (
    <section className="mt-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-foreground">Plan for {formatDateLabel(selectedDate)}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Breakfast, lunch, snack, and dinner all in one easy scan.</p>
      </div>
      {!hasAnyMeal && !generateLoading ? (
        <EmptyPlanState onGenerate={onGenerate} loading={false} />
      ) : generateLoading && !hasAnyMeal ? (
        <div className="grid gap-4 md:grid-cols-2">
          {mealSlots.map((slot) => <Skeleton key={slot} className="h-72" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mealSlots.map((slot) => (
            <MealCard
              key={slot}
              slot={slot}
              meal={currentMeals?.[slot] ?? null}
              favoriteId={currentMeals?.[slot] ? favoriteIdsByName.get(currentMeals[slot]?.name ?? '') : undefined}
              loadingAlternative={alternativeLoadingSlot === slot}
              onSuggestAlternative={onSuggestAlternative}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface MealCardProps {
  slot: MealSlot;
  meal: Meal | null;
  favoriteId?: string;
  loadingAlternative: boolean;
  onSuggestAlternative: (slot: MealSlot) => void;
  onToggleFavorite: (meal: Meal, favoriteId?: string) => void;
}

export function MealCard({ slot, meal, favoriteId, loadingAlternative, onSuggestAlternative, onToggleFavorite }: MealCardProps) {
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone="soft">{slotLabel}</Badge>
          <h3 className="mt-3 text-xl font-semibold text-foreground">{meal?.name ?? `No ${slotLabel.toLowerCase()} planned yet`}</h3>
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
            <Button type="button" variant={favoriteId ? 'destructive' : 'secondary'} onClick={() => onToggleFavorite(meal, favoriteId)}>
              {favoriteId ? <Trash2 className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
              {favoriteId ? 'Remove favorite' : 'Save favorite'}
            </Button>
          </div>

          <div className="mt-5">
            <Collapsible title="Ingredients" open={ingredientsOpen} onToggle={() => setIngredientsOpen((current) => !current)}>
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

interface FavoritesSectionProps {
  favorites: Favorite[];
  loading: boolean;
  onRemove: (favoriteId: string) => void;
  onReuse: (meal: Meal) => void;
}

export function FavoritesSection({ favorites, loading, onRemove, onReuse }: FavoritesSectionProps) {
  return (
    <Card className="h-full">
      <SectionHeading eyebrow="Favorites" title="Saved meal ideas" description="Keep kid-approved meals handy and reuse them in the current day plan." />
      <div className="mt-5 space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : favorites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            Save a generated meal to build a quick list of family favorites.
          </div>
        ) : (
          favorites.map((favorite) => (
            <div key={favorite.id} className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{favorite.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{favorite.description}</p>
                </div>
                <Badge>{favorite.difficulty}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> family ready</span>
                <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {Number(favorite.prepTimeMinutes ?? 0)} min</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => onReuse(favorite)}>
                  <Save className="h-4 w-4" /> Reuse in a slot
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(favorite.id)}>
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export function EmptyPlanState({ onGenerate, loading }: { onGenerate: () => void; loading: boolean }) {
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
