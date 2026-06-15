import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Moon, Sparkles, Sun } from 'lucide-react';
import {
  addFavorite,
  fetchFavorites,
  fetchPreferences,
  fetchWeekPlan,
  generateDayPlan,
  removeFavorite,
  savePreferences,
  suggestAlternative,
  type Favorite,
  type FavoriteDeleteResponse,
  type Meal,
  type MealSlot,
  type Preferences,
  type WeekPlanResponse,
} from './api-client/mealPlanner';
import {
  EmptyPlanState,
  FavoritesPanel,
  MealCard,
  PreferencesPanel,
  WeekStrip,
} from './components/features/MealPlannerSections';

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];
const AGE_OPTIONS = ['2-4 years', '5-7 years', '8-10 years', '11-13 years'];
const DIETARY_OPTIONS = ['None', 'Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free', 'Nut Free'];
const CUISINE_OPTIONS = ['American', 'Italian', 'Mexican', 'Indian', 'Mediterranean', 'Asian'];

const defaultPreferences: Preferences = {
  number_of_kids: 2,
  age_range: '',
  dietary_restriction: '',
  cuisine_preferences: [],
  foods_to_avoid: '',
};

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document === 'undefined') {
      return 'dark';
    }
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
  };
}

function formatDateLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [weekPlan, setWeekPlan] = useState<WeekPlanResponse | null>(null);
  const [weekLoading, setWeekLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [generateLoading, setGenerateLoading] = useState(false);
  const [alternativeLoadingSlot, setAlternativeLoadingSlot] = useState<MealSlot | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      setPageError(null);
      try {
        const [preferencesResponse, weekResponse, favoritesResponse] = await Promise.all([
          fetchPreferences(),
          fetchWeekPlan(),
          fetchFavorites(),
        ]);

        if (!active) {
          return;
        }

        setPreferences(preferencesResponse.preferences ?? defaultPreferences);
        setWeekPlan(weekResponse);
        setFavorites(favoritesResponse.favorites ?? []);

        const availableDate = weekResponse.days.find((day) => day.date === selectedDate)?.date ?? weekResponse.days[0]?.date;
        if (availableDate) {
          setSelectedDate(availableDate);
        }
      } catch (error) {
        if (active) {
          setPageError(error instanceof Error ? error.message : 'Unable to load meal planner data.');
        }
      } finally {
        if (active) {
          setPreferencesLoading(false);
          setWeekLoading(false);
          setFavoritesLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [selectedDate]);

  const currentPlan = useMemo(
    () => weekPlan?.days.find((day) => day.date === selectedDate) ?? null,
    [selectedDate, weekPlan],
  );

  const hasAnyMeal = useMemo(
    () => MEAL_SLOTS.some((slot) => Boolean(currentPlan?.meals[slot])),
    [currentPlan],
  );

  const favoriteByMealKey = useMemo(() => {
    return new Map(favorites.map((favorite) => [`${favorite.meal.slot}:${favorite.meal.name}`, favorite]));
  }, [favorites]);

  async function reloadWeekPlan(nextSelectedDate?: string) {
    const response = await fetchWeekPlan();
    setWeekPlan(response);
    const preferredDate = nextSelectedDate ?? selectedDate;
    const availableDate = response.days.find((day) => day.date === preferredDate)?.date ?? response.days[0]?.date;
    if (availableDate) {
      setSelectedDate(availableDate);
    }
  }

  async function handleSavePreferences() {
    setPreferencesSaving(true);
    setPageError(null);
    setNotice('Saving preferences...');
    try {
      const response = await savePreferences(preferences);
      setPreferences(response.preferences);
      setNotice('Preferences saved.');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to save preferences.');
      setNotice(null);
    } finally {
      setPreferencesSaving(false);
      window.setTimeout(() => setNotice(null), 1500);
    }
  }

  async function handleGenerateDay() {
    setGenerateLoading(true);
    setPageError(null);
    setNotice('Generating a fresh day plan...');
    try {
      await generateDayPlan({ date: selectedDate });
      await reloadWeekPlan(selectedDate);
      setNotice('Your meal plan is ready.');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to generate a day plan.');
      setNotice(null);
    } finally {
      setGenerateLoading(false);
      window.setTimeout(() => setNotice(null), 1500);
    }
  }

  async function handleSuggestAlternative(slot: MealSlot) {
    setAlternativeLoadingSlot(slot);
    setPageError(null);
    setNotice(`Refreshing ${slot} idea...`);
    try {
      await suggestAlternative({ date: selectedDate, meal_slot: slot });
      await reloadWeekPlan(selectedDate);
      setNotice(`${slot[0].toUpperCase()}${slot.slice(1)} updated.`);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to suggest an alternative meal.');
      setNotice(null);
    } finally {
      setAlternativeLoadingSlot(null);
      window.setTimeout(() => setNotice(null), 1500);
    }
  }

  async function handleToggleFavorite(meal: Meal, favoriteId?: string) {
    setPageError(null);
    try {
      if (favoriteId) {
        const response: FavoriteDeleteResponse = await removeFavorite(favoriteId);
        if (response.success) {
          setFavorites((current) => current.filter((favorite) => favorite.id !== favoriteId));
        }
      } else {
        const response = await addFavorite({ meal });
        setFavorites((current) => [...current, response.favorite]);
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to update favorites.');
    }
  }

  async function handleRemoveFavorite(favoriteId: string) {
    await handleToggleFavorite({
      slot: 'breakfast',
      name: '',
      description: '',
      ingredients: [],
      prep_time_minutes: 0,
      difficulty: '',
    }, favoriteId);
  }

  const header = (
    <header className="mb-6 rounded-3xl border border-border/70 bg-background/70 p-5 shadow-soft backdrop-blur sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Kids Daily Meal Planner
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Warm, flexible meal plans built around your family.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            Generate a fresh day of kid-friendly meals, swap just one slot when needed, and keep your family favorites close.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground shadow-soft transition hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={handleGenerateDay}
            disabled={generateLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate today’s plan
          </button>
        </div>
      </div>
    </header>
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {header}

        {pageError ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">Something needs attention</p>
              <p className="mt-1 text-muted-foreground">{pageError}</p>
            </div>
          </div>
        ) : null}

        {notice ? (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
            <Loader2 className="h-4 w-4" />
            <span>{notice}</span>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            {preferencesLoading ? (
              <div className="h-72 animate-pulse rounded-3xl bg-secondary" />
            ) : (
              <PreferencesPanel
                preferences={preferences}
                saving={preferencesSaving}
                cuisineOptions={CUISINE_OPTIONS}
                ageOptions={AGE_OPTIONS}
                dietaryOptions={DIETARY_OPTIONS}
                onChange={setPreferences}
                onSave={handleSavePreferences}
              />
            )}

            <WeekStrip
              weekPlan={weekPlan}
              selectedDate={selectedDate}
              loading={weekLoading}
              mealSlots={MEAL_SLOTS}
              formatDateLabel={formatDateLabel}
              onSelectDate={setSelectedDate}
            />
          </div>

          <FavoritesPanel favorites={favorites} loading={favoritesLoading} onRemove={handleRemoveFavorite} />
        </div>

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Plan for {formatDateLabel(selectedDate)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Breakfast, lunch, snack, and dinner all in one easy scan.</p>
            </div>
          </div>

          {!hasAnyMeal && !generateLoading ? (
            <EmptyPlanState onGenerate={handleGenerateDay} loading={generateLoading} />
          ) : generateLoading && !hasAnyMeal ? (
            <div className="grid gap-4 md:grid-cols-2">
              {MEAL_SLOTS.map((slot) => (
                <div key={slot} className="h-72 animate-pulse rounded-3xl bg-secondary" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {MEAL_SLOTS.map((slot) => {
                const meal = currentPlan?.meals[slot] ?? null;
                const favorite = meal ? favoriteByMealKey.get(`${meal.slot}:${meal.name}`) : undefined;
                return (
                  <MealCard
                    key={slot}
                    slot={slot}
                    meal={meal}
                    favoriteId={favorite?.id}
                    loadingAlternative={alternativeLoadingSlot === slot}
                    onSuggestAlternative={handleSuggestAlternative}
                    onToggleFavorite={handleToggleFavorite}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
