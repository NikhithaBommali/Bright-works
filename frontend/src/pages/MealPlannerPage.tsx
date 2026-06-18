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
  type FavoriteEntry,
  type Meal,
  type MealSlot,
  type Preferences,
  type WeekPlanResponse,
} from '../api-client/mealPlanner';
import { FavoritesPanel } from '../components/features/FavoritesPanel';
import { MealCard } from '../components/features/MealCard';
import { EmptyPlanner, MealCardsSkeleton, PlannerError } from '../components/features/PlannerStates';
import { PreferencesPanel } from '../components/features/PreferencesPanel';
import { WeeklyPlanner } from '../components/features/WeeklyPlanner';
import { MealPlannerLayout } from '../components/layout/MealPlannerLayout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useDarkMode } from '../hooks/useDarkMode';

const DEFAULT_PREFERENCES: Preferences = {
  number_of_kids: 1,
  age_range: '2-5',
  dietary_restrictions: 'none',
  foods_to_avoid: '',
  cuisine_preferences: [],
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeMeal(meal: Meal): Meal {
  return {
    ...meal,
    prep_time_minutes: Number(meal.prep_time_minutes ?? 0),
  };
}

function normalizeMeals(meals: DayMeals): DayMeals {
  return {
    breakfast: normalizeMeal(meals.breakfast),
    lunch: normalizeMeal(meals.lunch),
    snack: normalizeMeal(meals.snack),
    dinner: normalizeMeal(meals.dinner),
  };
}

function normalizeWeekPlan(week: WeekPlanResponse): WeekPlanResponse {
  return {
    selected_date: week.selected_date,
    days: week.days.map((day) => ({
      date: day.date,
      meals: day.meals ? normalizeMeals(day.meals) : null,
    })),
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.message === 'OPENAI_API_KEY is not configured') {
      return 'Meal generation is unavailable because OPENAI_API_KEY is not configured on the backend.';
    }
    if (error.status === 503) {
      return error.message || 'Meal generation is temporarily unavailable. Please try again in a moment.';
    }
    return error.message || 'Something went wrong while talking to the backend.';
  }
  return 'Something went wrong while talking to the backend.';
}

function mergeSlot(currentMeals: DayMeals | null, nextMeals: DayMeals, slot: MealSlot): DayMeals {
  if (!currentMeals) {
    return nextMeals;
  }

  return {
    ...currentMeals,
    [slot]: nextMeals[slot],
  };
}

export function MealPlannerPage() {
  const { isDark, toggleTheme } = useDarkMode(true);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [selectedMeals, setSelectedMeals] = useState<DayMeals | null>(null);
  const [weekPlan, setWeekPlan] = useState<WeekPlanResponse>({ selected_date: todayIso(), days: [] });
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestingSlot, setSuggestingSlot] = useState<MealSlot | null>(null);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<string | null>(null);
  const [pendingFavoriteName, setPendingFavoriteName] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState('');
  const [bootstrapError, setBootstrapError] = useState('');

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
          loadedFavorites.favorites.map((favorite) => ({
            favorite_id: favorite.favorite_id,
            meal: normalizeMeal(favorite.meal),
          })),
        );
        const normalizedWeek = normalizeWeekPlan(loadedWeek);
        setWeekPlan(normalizedWeek);
        const initialDay = normalizedWeek.days.find((day) => day.date === selectedDate) ?? null;
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
    const loadedWeek = normalizeWeekPlan(await fetchWeekPlan(date));
    setWeekPlan(loadedWeek);
    const chosenDay = loadedWeek.days.find((day) => day.date === date) ?? null;
    setSelectedMeals(preferredMeals ?? chosenDay?.meals ?? null);
  };

  const handleSavePreferences = async () => {
    try {
      setIsSavingPreferences(true);
      const saved = await savePreferences(preferences);
      setPreferences({
        ...saved,
        number_of_kids: Number(saved.number_of_kids ?? 1),
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleGenerate = async (date = selectedDate) => {
    try {
      setIsGenerating(true);
      setGenerationError('');
      const plan = await generateDayPlan({ date, preferences });
      const normalizedMeals = normalizeMeals(plan.meals);
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
    if (!selectedMeals) {
      return;
    }

    try {
      setSuggestingSlot(slot);
      setGenerationError('');
      const plan = await suggestAlternative({
        date: selectedDate,
        slot,
        preferences,
        current_plan: selectedMeals,
      });
      const normalizedMeals = normalizeMeals(plan.meals);
      const mergedMeals = mergeSlot(selectedMeals, normalizedMeals, slot);
      setSelectedMeals(mergedMeals);
      await refreshWeek(plan.date, mergedMeals);
    } catch (error) {
      setGenerationError(getErrorMessage(error));
    } finally {
      setSuggestingSlot(null);
    }
  };

  const handleToggleFavorite = async (meal: Meal, favorite?: FavoriteEntry) => {
    if (favorite) {
      try {
        setPendingFavoriteId(favorite.favorite_id);
        await deleteFavorite({ favorite_id: favorite.favorite_id });
        setFavorites((current) => current.filter((item) => item.favorite_id !== favorite.favorite_id));
      } finally {
        setPendingFavoriteId(null);
      }
      return;
    }

    try {
      setPendingFavoriteName(meal.name);
      const created = await addFavorite({ meal });
      setFavorites((current) => [...current, { favorite_id: created.favorite_id, meal: normalizeMeal(created.meal) }]);
    } finally {
      setPendingFavoriteName(null);
    }
  };

  const plannerBusy = isGenerating || suggestingSlot !== null;
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
        selectedDate={selectedDate}
        days={weekPlan.days}
        weekLabel={weekPlan.selected_date}
        onSelectDate={handleSelectDay}
      />
      <FavoritesPanel
        favorites={favorites}
        pendingFavoriteId={pendingFavoriteId}
        onRemove={(favorite) => void handleToggleFavorite(favorite.meal, favorite)}
      />
    </>
  );

  let content = null;

  if (isBootstrapping) {
    content = <MealCardsSkeleton />;
  } else if (bootstrapError) {
    content = <PlannerError message={bootstrapError} onRetry={() => window.location.reload()} disabled={false} />;
  } else if (generationError && !selectedMeals) {
    content = <PlannerError message={generationError} onRetry={() => void handleGenerate()} disabled={plannerBusy} />;
  } else if (!selectedMeals) {
    content = <EmptyPlanner onPlanToday={() => void handleGenerate(selectedDate)} disabled={plannerBusy} />;
  } else {
    content = (
      <div className="space-y-4">
        {generationError ? <PlannerError message={generationError} onRetry={() => void handleGenerate(selectedDate)} disabled={plannerBusy} /> : null}
        <Card className="rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Meals for {selectedDate}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Review today&apos;s lineup, expand ingredients, and refresh a single slot whenever you need a new idea.
              </p>
            </div>
            <Button
              onClick={() => void handleGenerate(selectedDate)}
              disabled={plannerBusy}
              aria-disabled={plannerBusy}
              iconLeft={isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : undefined}
            >
              {isGenerating ? 'Generating meals...' : 'Generate today’s plan'}
            </Button>
          </div>
        </Card>
        {isGenerating ? <MealCardsSkeleton /> : null}
        {mealEntries.map(([slot, meal]) => {
          const favorite = favorites.find(
            (item) => item.meal.name === meal.name && item.meal.description === meal.description,
          );
          const isFavoritePending = pendingFavoriteName === meal.name || pendingFavoriteId === favorite?.favorite_id;

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
