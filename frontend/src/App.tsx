import { ChefHat, LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  addFavorite,
  ApiError,
  deleteFavorite,
  fetchFavorites,
  fetchPreferences,
  fetchWeekPlan,
  generateDayPlan,
  savePreferences,
  suggestAlternative,
  type DayMeals,
  type Favorite,
  type Meal,
  type MealSlot,
  type Preferences,
  type WeekPlan,
} from './api-client/mealPlanner';
import { FavoritesPanel } from './components/features/FavoritesPanel';
import { MealCard } from './components/features/MealCard';
import { EmptyPlanner, MealCardsSkeleton, PlannerError } from './components/features/PlannerStates';
import { PreferencesPanel } from './components/features/PreferencesPanel';
import { WeeklyPlanner } from './components/features/WeeklyPlanner';
import { MealPlannerLayout } from './components/layout/MealPlannerLayout';
import { Badge } from './components/ui/Badge';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { useDarkMode } from './hooks/useDarkMode';

const DEFAULT_PREFERENCES: Preferences = {
  number_of_kids: 1,
  age_range: '1-3 years',
  dietary_restriction: 'None',
  foods_to_avoid: '',
  cuisine_preferences: [],
};

const EMPTY_WEEK: WeekPlan = {
  week_start: '',
  days: [],
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 503) {
      return error.message || 'Meal generation is temporarily unavailable. Please check the backend service configuration and try again.';
    }
    return error.message || 'Something went wrong while talking to the backend.';
  }
  return 'Something went wrong while talking to the backend.';
}

function mergeSlot(currentMeals: DayMeals | null, nextMeals: DayMeals, slot: MealSlot): DayMeals {
  if (!currentMeals) return nextMeals;
  return {
    ...currentMeals,
    [slot]: nextMeals[slot],
  };
}

export default function App() {
  const { isDark, toggleTheme } = useDarkMode(true);

  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [selectedMeals, setSelectedMeals] = useState<DayMeals | null>(null);
  const [weekPlan, setWeekPlan] = useState<WeekPlan>(EMPTY_WEEK);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestingSlot, setSuggestingSlot] = useState<MealSlot | null>(null);
  const [pendingFavoriteName, setPendingFavoriteName] = useState<string | null>(null);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<string | null>(null);

  const [generationError, setGenerationError] = useState<string>('');
  const [bootstrapError, setBootstrapError] = useState<string>('');

  const selectedWeekDay = useMemo(
    () => weekPlan.days.find((day) => day.date === selectedDate) ?? null,
    [selectedDate, weekPlan.days],
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setBootstrapError('');
        const [loadedPreferences, loadedFavorites, loadedWeek] = await Promise.all([
          fetchPreferences(),
          fetchFavorites(),
          fetchWeekPlan(selectedDate),
        ]);

        setPreferences({
          ...loadedPreferences,
          number_of_kids: Number(loadedPreferences.number_of_kids ?? 1),
        });
        setFavorites(
          loadedFavorites.map((favorite) => ({
            ...favorite,
            meal: {
              ...favorite.meal,
              prep_time_minutes: Number(favorite.meal.prep_time_minutes ?? 0),
            },
          })),
        );
        setWeekPlan(loadedWeek);

        const initialDay = loadedWeek.days.find((day) => day.date === selectedDate) ?? null;
        setSelectedMeals(initialDay?.meals ?? null);
      } catch (error) {
        setBootstrapError(getErrorMessage(error));
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, [selectedDate]);

  const refreshWeek = async (date: string, preferredMeals?: DayMeals | null) => {
    const loadedWeek = await fetchWeekPlan(date);
    setWeekPlan(loadedWeek);
    const chosenDay = loadedWeek.days.find((day) => day.date === date) ?? null;
    setSelectedMeals(preferredMeals ?? chosenDay?.meals ?? null);
  };

  const handleSavePreferences = async () => {
    try {
      setIsSavingPreferences(true);
      const saved = await savePreferences(preferences);
      setPreferences({ ...saved, number_of_kids: Number(saved.number_of_kids ?? 1) });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleGenerate = async (date = selectedDate) => {
    try {
      setIsGenerating(true);
      setGenerationError('');
      const plan = await generateDayPlan({ date, preferences });
      const normalizedMeals = Object.fromEntries(
        Object.entries(plan.meals).map(([slot, meal]) => [
          slot,
          {
            ...meal,
            prep_time_minutes: Number(meal.prep_time_minutes ?? 0),
          },
        ]),
      ) as DayMeals;
      setSelectedDate(plan.date);
      setSelectedMeals(normalizedMeals);
      await refreshWeek(plan.date, normalizedMeals);
    } catch (error) {
      setGenerationError(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectDay = (date: string) => {
    setSelectedDate(date);
    const day = weekPlan.days.find((item) => item.date === date) ?? null;
    setSelectedMeals(day?.meals ?? null);
    setGenerationError('');
  };

  const handleSuggestAlternative = async (slot: MealSlot) => {
    try {
      setSuggestingSlot(slot);
      setGenerationError('');
      const plan = await suggestAlternative({ date: selectedDate, slot, preferences });
      const normalizedMeals = Object.fromEntries(
        Object.entries(plan.meals).map(([mealSlot, meal]) => [
          mealSlot,
          {
            ...meal,
            prep_time_minutes: Number(meal.prep_time_minutes ?? 0),
          },
        ]),
      ) as DayMeals;
      const mergedMeals = mergeSlot(selectedMeals, normalizedMeals, slot);
      setSelectedMeals(mergedMeals);
      await refreshWeek(plan.date, mergedMeals);
    } catch (error) {
      setGenerationError(getErrorMessage(error));
    } finally {
      setSuggestingSlot(null);
    }
  };

  const handleToggleFavorite = async (meal: Meal, favorite?: Favorite) => {
    if (favorite) {
      try {
        setPendingFavoriteId(favorite.id);
        await deleteFavorite({ id: favorite.id });
        setFavorites((current) => current.filter((item) => item.id !== favorite.id));
      } finally {
        setPendingFavoriteId(null);
      }
      return;
    }

    try {
      setPendingFavoriteName(meal.name);
      const created = await addFavorite({ meal });
      setFavorites((current) => [...current, { ...created, meal: { ...created.meal, prep_time_minutes: Number(created.meal.prep_time_minutes ?? 0) } }]);
    } finally {
      setPendingFavoriteName(null);
    }
  };

  const mealEntries = selectedMeals ? (Object.entries(selectedMeals) as [MealSlot, Meal][]) : [];

  const utility = (
    <Badge className="gap-2 px-3 py-1.5">
      <ChefHat className="h-3.5 w-3.5" /> {selectedWeekDay?.meals ? 'Plan saved' : 'Ready to plan'}
    </Badge>
  );

  const sidebar = (
    <>
      <PreferencesPanel
        preferences={preferences}
        onChange={setPreferences}
        onSave={handleSavePreferences}
        isSaving={isSavingPreferences}
      />
      <WeeklyPlanner
        weekStart={weekPlan.week_start || selectedDate}
        days={weekPlan.days}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDay}
      />
      <FavoritesPanel favorites={favorites} pendingFavoriteId={pendingFavoriteId} onRemove={(favorite) => void handleToggleFavorite(favorite.meal, favorite)} />
    </>
  );

  let content = null;

  if (isBootstrapping) {
    content = <MealCardsSkeleton />;
  } else if (bootstrapError) {
    content = <PlannerError message={bootstrapError} onRetry={() => window.location.reload()} disabled={false} />;
  } else if (isGenerating) {
    content = <MealCardsSkeleton />;
  } else if (generationError) {
    content = <PlannerError message={generationError} onRetry={() => void handleGenerate()} disabled={isGenerating} />;
  } else if (!selectedMeals) {
    content = <EmptyPlanner onPlanToday={() => void handleGenerate(selectedDate)} disabled={isGenerating || suggestingSlot !== null} />;
  } else {
    content = (
      <div className="space-y-4">
        <Card className="rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Meals for {selectedDate}</p>
              <p className="mt-1 text-sm text-muted-foreground">Review today’s lineup, expand ingredients, and refresh a single slot whenever you need a new idea.</p>
            </div>
            <Button
              onClick={() => void handleGenerate(selectedDate)}
              disabled={isGenerating || suggestingSlot !== null}
              aria-disabled={isGenerating || suggestingSlot !== null}
              iconLeft={isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : undefined}
            >
              {isGenerating ? 'Generating meals...' : 'Generate today\'s plan'}
            </Button>
          </div>
        </Card>
        {mealEntries.map(([slot, meal]) => {
          const favorite = favorites.find((item) => item.meal.name === meal.name && item.meal.description === meal.description);
          const isFavoritePending = pendingFavoriteName === meal.name || pendingFavoriteId === favorite?.id;
          return (
            <MealCard
              key={`${slot}-${meal.name}`}
              slot={slot}
              meal={meal}
              favorite={favorite}
              isFavoritePending={isFavoritePending}
              isSuggesting={suggestingSlot === slot}
              onToggleFavorite={(nextMeal, existingFavorite) => void handleToggleFavorite(nextMeal, existingFavorite)}
              onSuggestAlternative={(nextSlot) => void handleSuggestAlternative(nextSlot)}
            />
          );
        })}
      </div>
    );
  }

  return <MealPlannerLayout isDark={isDark} onToggleTheme={toggleTheme} sidebar={sidebar} content={content} utility={utility} />;
}
