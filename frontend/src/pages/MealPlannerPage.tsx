import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  addFavorite,
  fetchFavorites,
  fetchPreferences,
  fetchWeekPlan,
  generateDayPlan,
  removeFavorite,
  savePreferences,
  suggestAlternative,
} from '../api-client/mealPlanner';
import type { DayPlan, Meal, MealSlot, Preferences, WeekDay } from '../types/mealPlanner';
import { AppShell } from '../components/layout/AppShell';
import { PlannerHero } from '../components/layout/PlannerHero';
import { DailyPlanPanel } from '../components/features/DailyPlanPanel';
import { FavoritesPanel } from '../components/features/FavoritesPanel';
import { PreferencesPanel } from '../components/features/PreferencesPanel';
import { WeekCalendar } from '../components/features/WeekCalendar';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { formatLongDateLabel, todayIsoDate } from '../utils/date';

const AGE_OPTIONS = ['2-5', '6-10', '11-13'];
const DIETARY_OPTIONS = ['none', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free'];
const CUISINE_OPTIONS = ['American', 'Italian', 'Mexican', 'Indian', 'Mediterranean', 'Asian'];
const SLOT_OPTIONS: MealSlot[] = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
const DEFAULT_PREFERENCES: Preferences = {
  numberOfKids: 1,
  ageRange: '2-5',
  dietaryRestrictions: ['none'],
  foodsToAvoid: '',
  cuisinePreferences: [],
};

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const text = error.message;
    if (text.includes('503') || text.toLowerCase().includes('openai')) {
      return 'Meal generation is unavailable because the backend is missing OPENAI_API_KEY. Add the key to the backend environment and try again.';
    }
    return text;
  }
  return 'Something went wrong while talking to the meal planner service.';
}

function replaceMealInDay(day: WeekDay, meal: Meal) {
  return {
    ...day,
    meals: day.meals.map((entry) => (entry.slot === meal.slot ? meal : entry)),
  };
}

export function MealPlannerPage() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [selectedReuseSlot, setSelectedReuseSlot] = useState<MealSlot>('Breakfast');
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [favorites, setFavorites] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekLoading, setWeekLoading] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [generatingDay, setGeneratingDay] = useState(false);
  const [alternativeSlot, setAlternativeSlot] = useState<MealSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedDay = useMemo(() => weekDays.find((day) => day.date === selectedDate) ?? null, [weekDays, selectedDate]);
  const currentPlan = useMemo<DayPlan | null>(() => (selectedDay ? { date: selectedDay.date, meals: selectedDay.meals } : null), [selectedDay]);
  const hasMeals = Boolean(selectedDay && selectedDay.meals.length > 0);

  async function loadWeek(date: string) {
    setWeekLoading(true);
    try {
      const week = await fetchWeekPlan(date);
      setWeekDays(week.days);
      setSelectedDate(week.selectedDate);
    } finally {
      setWeekLoading(false);
    }
  }

  async function bootstrap() {
    setLoading(true);
    setError(null);
    try {
      const [preferencesResponse, weekResponse, favoritesResponse] = await Promise.all([
        fetchPreferences(),
        fetchWeekPlan(selectedDate),
        fetchFavorites(),
      ]);
      setPreferences(preferencesResponse);
      setWeekDays(weekResponse.days);
      setSelectedDate(weekResponse.selectedDate);
      setFavorites(favoritesResponse.favorites);
    } catch (bootstrapError) {
      setError(toErrorMessage(bootstrapError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void bootstrap();
  }, []);

  async function handleSavePreferences() {
    setSavingPreferences(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await savePreferences(preferences);
      setPreferences(saved);
      setSuccess('Preferences saved.');
    } catch (saveError) {
      setError(toErrorMessage(saveError));
    } finally {
      setSavingPreferences(false);
    }
  }

  async function handleGenerateDay() {
    setGeneratingDay(true);
    setError(null);
    setSuccess(null);
    try {
      const plan = await generateDayPlan({ date: selectedDate, preferences });
      setWeekDays((current) => current.map((day) => (day.date === plan.date ? { date: plan.date, meals: plan.meals } : day)));
      await loadWeek(selectedDate);
      setSuccess('Today’s meals are ready.');
    } catch (generateError) {
      setError(toErrorMessage(generateError));
    } finally {
      setGeneratingDay(false);
    }
  }

  async function handleSuggestAlternative(slot: MealSlot) {
    if (!currentPlan) return;
    setAlternativeSlot(slot);
    setError(null);
    setSuccess(null);
    try {
      const updatedPlan = await suggestAlternative({
        date: selectedDate,
        slot,
        preferences,
        currentPlan,
      });
      setWeekDays((current) => current.map((day) => (day.date === updatedPlan.date ? { date: updatedPlan.date, meals: updatedPlan.meals } : day)));
      setSuccess(`${slot} refreshed.`);
    } catch (alternativeError) {
      setError(toErrorMessage(alternativeError));
    } finally {
      setAlternativeSlot(null);
    }
  }

  async function handleSaveFavorite(meal: Meal) {
    setError(null);
    setSuccess(null);
    setFavoritesLoading(true);
    try {
      const response = await addFavorite({ meal });
      setFavorites(response.favorites);
      setSuccess(`${meal.name} saved to favorites.`);
    } catch (favoriteError) {
      setError(toErrorMessage(favoriteError));
    } finally {
      setFavoritesLoading(false);
    }
  }

  async function handleRemoveFavorite(meal: Meal) {
    setError(null);
    setSuccess(null);
    setFavoritesLoading(true);
    try {
      const response = await removeFavorite({ mealName: meal.name, slot: meal.slot });
      setFavorites(response.favorites);
      setSuccess(`${meal.name} removed from favorites.`);
    } catch (favoriteError) {
      setError(toErrorMessage(favoriteError));
    } finally {
      setFavoritesLoading(false);
    }
  }

  function handleReuseFavorite(meal: Meal) {
    setWeekDays((current) =>
      current.map((day) =>
        day.date === selectedDate
          ? replaceMealInDay(day, { ...meal, slot: selectedReuseSlot })
          : day,
      ),
    );
    setSuccess(`${meal.name} added to ${selectedReuseSlot}.`);
  }

  return (
    <AppShell>
      <PlannerHero onGenerate={handleGenerateDay} generating={generatingDay} />

      {error ? (
        <Card className="mb-6 border-destructive/40 bg-destructive/10">
          <div className="flex items-start gap-3 text-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <p className="text-foreground">{error}</p>
          </div>
        </Card>
      ) : null}

      {success ? (
        <Card className="mb-6 border-primary/40 bg-primary/10 py-3">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>{success}</span>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <Card className="py-12">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading meal planner...
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6 min-w-0">
            <PreferencesPanel
              preferences={preferences}
              ageOptions={AGE_OPTIONS}
              dietaryOptions={DIETARY_OPTIONS}
              cuisineOptions={CUISINE_OPTIONS}
              saving={savingPreferences}
              onChange={setPreferences}
              onSave={handleSavePreferences}
            />
            <WeekCalendar
              days={weekDays}
              selectedDate={selectedDate}
              loading={weekLoading}
              onSelectDate={setSelectedDate}
            />
            <DailyPlanPanel
              dateLabel={formatLongDateLabel(selectedDate)}
              plan={selectedDay}
              loading={generatingDay}
              alternativeSlot={alternativeSlot}
              favorites={favorites}
              onGenerate={handleGenerateDay}
              onSuggestAlternative={handleSuggestAlternative}
              onSaveFavorite={handleSaveFavorite}
              onRemoveFavorite={handleRemoveFavorite}
            />
          </div>

          <div className="space-y-6 min-w-0">
            <Card>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Reuse favorites</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Pick a slot, then tap a saved favorite to place it into the current visible plan.</p>
                </div>
                <Select value={selectedReuseSlot} onChange={(event) => setSelectedReuseSlot(event.target.value as MealSlot)} aria-label="Choose slot for favorite reuse">
                  {SLOT_OPTIONS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </Select>
              </div>
            </Card>
            <FavoritesPanel
              favorites={favorites}
              loading={favoritesLoading}
              onReuse={handleReuseFavorite}
              onRemove={handleRemoveFavorite}
            />
            {!hasMeals ? null : <Card className="text-sm text-muted-foreground">Viewing plan for <span className="font-medium text-foreground">{formatLongDateLabel(selectedDate)}</span>.</Card>}
          </div>
        </div>
      )}
    </AppShell>
  );
}
