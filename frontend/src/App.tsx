import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Moon, Sun } from 'lucide-react';
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
  type Meal,
  type MealSlot,
  type Preferences,
  type WeekPlanResponse,
} from './api-client/mealPlanner';
import { useTheme } from './hooks/useTheme';
import { formatLongDateLabel, todayIsoDate } from './utils/date';
import {
  DailyPlanSection,
  FavoritesSection,
  PlannerHeader,
  PreferencesPanel,
  WeekStrip,
} from './components/features/MealPlannerSections';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Select } from './components/ui/Select';

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];
const AGE_OPTIONS = ['2–5 years', '6–10 years', '11–13 years'];
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free', 'Nut Free'];
const CUISINE_OPTIONS = ['American', 'Italian', 'Mexican', 'Indian', 'Mediterranean', 'Asian'];

const defaultPreferences: Preferences = {
  numberOfKids: 2,
  ageRange: '',
  dietaryRestrictions: [],
  foodsToAvoid: '',
  cuisinePreferences: [],
};

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
  const [reuseSlot, setReuseSlot] = useState<MealSlot>('breakfast');

  function formatDateLabel(date: string) {
    return formatLongDateLabel(date);
  }

  async function bootstrap(date: string) {
    setPageError(null);
    const [preferencesResponse, weekResponse, favoritesResponse] = await Promise.all([
      fetchPreferences(),
      fetchWeekPlan(date),
      fetchFavorites(),
    ]);
    setPreferences(preferencesResponse);
    setWeekPlan(weekResponse);
    setFavorites(favoritesResponse.favorites);
    setSelectedDate(weekResponse.selectedDate || date);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await bootstrap(selectedDate);
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
    })();
    return () => {
      active = false;
    };
  }, []);

  const currentPlan = useMemo(() => weekPlan?.days.find((day) => day.date === selectedDate) ?? null, [selectedDate, weekPlan]);
  const hasAnyMeal = useMemo(() => MEAL_SLOTS.some((slot) => Boolean(currentPlan?.meals[slot])), [currentPlan]);
  const currentMeals = currentPlan?.meals ?? null;
  const favoriteIdsByName = useMemo(() => new Map(favorites.map((favorite) => [favorite.name, favorite.id])), [favorites]);

  async function reloadWeekPlan(nextSelectedDate = selectedDate) {
    const response = await fetchWeekPlan(nextSelectedDate);
    setWeekPlan(response);
    setSelectedDate(response.selectedDate || nextSelectedDate);
  }

  async function handleSavePreferences() {
    setPreferencesSaving(true);
    setPageError(null);
    setNotice('Saving preferences...');
    try {
      const response = await savePreferences(preferences);
      setPreferences(response);
      setNotice('Preferences saved.');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to save preferences.');
      setNotice(null);
    } finally {
      setPreferencesSaving(false);
    }
  }

  async function handleGenerateDay() {
    setGenerateLoading(true);
    setPageError(null);
    setNotice('Generating a fresh day plan...');
    try {
      const response = await generateDayPlan({ date: selectedDate, preferences });
      setWeekPlan((current) => {
        if (!current) return current;
        return {
          ...current,
          selectedDate: response.date,
          days: current.days.map((day) => (day.date === response.date ? { ...day, meals: response.meals } : day)),
        };
      });
      await reloadWeekPlan(selectedDate);
      setNotice('Your meal plan is ready.');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to generate a day plan.');
      setNotice(null);
    } finally {
      setGenerateLoading(false);
    }
  }

  async function handleSuggestAlternative(slot: MealSlot) {
    setAlternativeLoadingSlot(slot);
    setPageError(null);
    setNotice(`Refreshing ${slot} idea...`);
    try {
      const response = await suggestAlternative({ date: selectedDate, slot, preferences });
      setWeekPlan((current) => {
        if (!current) return current;
        return {
          ...current,
          days: current.days.map((day) =>
            day.date === response.date
              ? { ...day, meals: { ...day.meals, [response.slot]: response.meal } }
              : day,
          ),
        };
      });
      setNotice(`${slot.charAt(0).toUpperCase() + slot.slice(1)} updated.`);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to suggest an alternative meal.');
      setNotice(null);
    } finally {
      setAlternativeLoadingSlot(null);
    }
  }

  async function handleToggleFavorite(meal: Meal, favoriteId?: string) {
    setPageError(null);
    try {
      if (favoriteId) {
        const response = await removeFavorite(favoriteId);
        if (response.deleted) {
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
    try {
      const response = await removeFavorite(favoriteId);
      if (response.deleted) {
        setFavorites((current) => current.filter((favorite) => favorite.id !== favoriteId));
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to remove favorite.');
    }
  }

  function handleReuseFavorite(meal: Meal) {
    setWeekPlan((current) => {
      if (!current) return current;
      return {
        ...current,
        days: current.days.map((day) =>
          day.date === selectedDate
            ? { ...day, meals: { ...day.meals, [reuseSlot]: meal } }
            : day,
        ),
      };
    });
    setNotice(`Inserted ${meal.name} into ${reuseSlot}.`);
  }

  return (
    <main className="app-shell">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PlannerHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          onGenerate={handleGenerateDay}
          generating={generateLoading}
          ThemeIcon={theme === 'dark' ? Sun : Moon}
        />

        {pageError ? (
          <Card className="mb-6 border-destructive/40 bg-destructive/10">
            <div className="flex items-start gap-3 text-sm text-foreground">
              <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">Something needs attention</p>
                <p className="mt-1 text-muted-foreground">{pageError}</p>
                {pageError.includes('503') || pageError.toLowerCase().includes('openai') ? (
                  <p className="mt-2 text-muted-foreground">Meal generation is temporarily unavailable. Please verify the backend AI configuration and try again.</p>
                ) : null}
              </div>
            </div>
          </Card>
        ) : null}

        {notice ? (
          <Card className="mb-6 border-primary/30 bg-primary/10 py-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Loader2 className="h-4 w-4" />
              <span>{notice}</span>
            </div>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            {preferencesLoading ? (
              <Card><div className="h-72 animate-pulse rounded-3xl bg-secondary" /></Card>
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

          <div className="space-y-4">
            <Card>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Favorite reuse slot</p>
                  <p className="mt-1 text-xs text-muted-foreground">Choose where saved meals should be inserted in today’s visible plan.</p>
                </div>
                <div className="w-full sm:w-52">
                  <Select value={reuseSlot} onChange={(event) => setReuseSlot(event.target.value as MealSlot)}>
                    {MEAL_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot.charAt(0).toUpperCase() + slot.slice(1)}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </Card>
            <FavoritesSection favorites={favorites} loading={favoritesLoading} onRemove={handleRemoveFavorite} onReuse={handleReuseFavorite} />
          </div>
        </div>

        <DailyPlanSection
          selectedDate={selectedDate}
          hasAnyMeal={hasAnyMeal}
          generateLoading={generateLoading}
          mealSlots={MEAL_SLOTS}
          currentMeals={currentMeals}
          favoriteIdsByName={favoriteIdsByName}
          alternativeLoadingSlot={alternativeLoadingSlot}
          onGenerate={handleGenerateDay}
          onSuggestAlternative={handleSuggestAlternative}
          onToggleFavorite={handleToggleFavorite}
          formatDateLabel={formatDateLabel}
        />

        {!hasAnyMeal && !generateLoading ? (
          <div className="mt-6 flex justify-center">
            <Button onClick={handleGenerateDay}>Plan today’s meals</Button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default App;
