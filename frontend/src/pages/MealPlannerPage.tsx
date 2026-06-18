import { useEffect, useMemo, useState } from 'react';
import {
  addFavorite,
  fetchFavorites,
  fetchPreferences,
  fetchWeekPlan,
  generateDayPlan,
  removeFavorite,
  savePreferences,
  suggestAlternative,
  type DayPlan,
  type Meal,
  type MealSlot,
  type Preferences,
  type WeekPlanResponse,
} from '../api-client/mealPlanner';

const AGE_OPTIONS = ['2–5 years', '6–10 years', '11–13 years'];
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free', 'Nut Free'];
const CUISINE_OPTIONS = ['American', 'Italian', 'Mexican', 'Indian', 'Mediterranean', 'Asian'];
const MEAL_SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

const defaultPreferences: Preferences = {
  numberOfKids: 2,
  ageRange: '',
  dietaryRestrictions: [],
  foodsToAvoid: '',
  cuisinePreferences: [],
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    weekday: 'long',
  });
}

function getMealBySlot(plan: DayPlan | null, slot: MealSlot) {
  return plan?.meals.find((meal) => meal.slot === slot) ?? null;
}

export function MealPlannerPage() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [weekPlan, setWeekPlan] = useState<WeekPlanResponse | null>(null);
  const [favorites, setFavorites] = useState<Meal[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [preferencesResponse, weekResponse, favoritesResponse] = await Promise.all([
          fetchPreferences(),
          fetchWeekPlan(selectedDate),
          fetchFavorites(),
        ]);

        if (!active) return;
        setPreferences(preferencesResponse);
        setWeekPlan(weekResponse);
        setFavorites(favoritesResponse.favorites);
        setSelectedDate(weekResponse.selectedDate || selectedDate);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load meal planner data.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const currentPlan = useMemo<DayPlan | null>(() => {
    const day = weekPlan?.days.find((entry) => entry.date === selectedDate);
    return day ? { date: day.date, meals: day.meals } : null;
  }, [selectedDate, weekPlan]);

  async function handleSavePreferences() {
    setSaving(true);
    setError(null);
    try {
      const next = await savePreferences(preferences);
      setPreferences(next);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save preferences.');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateDay() {
    setGenerating(true);
    setError(null);
    try {
      const day = await generateDayPlan({ date: selectedDate, preferences });
      setWeekPlan((current) => {
        if (!current) {
          return { selectedDate: day.date, days: [{ date: day.date, meals: day.meals }] };
        }
        const existing = current.days.some((entry) => entry.date === day.date);
        return {
          selectedDate: day.date,
          days: existing
            ? current.days.map((entry) => (entry.date === day.date ? { date: day.date, meals: day.meals } : entry))
            : [...current.days, { date: day.date, meals: day.meals }],
        };
      });
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Unable to generate a meal plan.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSuggestAlternative(slot: MealSlot) {
    if (!currentPlan) return;
    setError(null);
    try {
      const day = await suggestAlternative({ date: selectedDate, slot, preferences, currentPlan });
      setWeekPlan((current) => {
        if (!current) return current;
        return {
          ...current,
          days: current.days.map((entry) => (entry.date === day.date ? { date: day.date, meals: day.meals } : entry)),
        };
      });
    } catch (suggestError) {
      setError(suggestError instanceof Error ? suggestError.message : 'Unable to suggest an alternative meal.');
    }
  }

  async function handleToggleFavorite(meal: Meal) {
    setError(null);
    const exists = favorites.some((favorite) => favorite.name === meal.name && favorite.slot === meal.slot);
    try {
      const response = exists
        ? await removeFavorite({ mealName: meal.name, slot: meal.slot })
        : await addFavorite({ meal });
      setFavorites(response.favorites);
    } catch (favoriteError) {
      setError(favoriteError instanceof Error ? favoriteError.message : 'Unable to update favorites.');
    }
  }

  return (
    <main className="app-shell">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="glass-panel p-6">
          <p className="text-sm font-semibold text-primary">Kids Daily Meal Planner</p>
          <h1 className="section-title mt-2 text-3xl">Daily meal planning for busy families</h1>
          <p className="section-copy mt-2">Save preferences, review the week, generate today’s plan, swap meals, and keep favorites handy.</p>
          <button className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground" onClick={handleGenerateDay} disabled={generating}>
            {generating ? 'Generating…' : 'Generate today’s plan'}
          </button>
        </section>

        {error ? <section className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</section> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="glass-panel p-6">
            <h2 className="section-title">Preferences</h2>
            <p className="section-copy mt-1">Set kid count, age range, dietary needs, foods to avoid, and preferred cuisines.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block">Number of kids</span>
                <input className="w-full rounded-lg border border-border bg-background px-3 py-2" type="number" min={1} value={preferences.numberOfKids} onChange={(event) => setPreferences({ ...preferences, numberOfKids: Number(event.target.value || 1) })} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block">Age range</span>
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2" value={preferences.ageRange} onChange={(event) => setPreferences({ ...preferences, ageRange: event.target.value })}>
                  <option value="">Select an age range</option>
                  {AGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block">Foods to avoid</span>
                <textarea className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2" value={preferences.foodsToAvoid} onChange={(event) => setPreferences({ ...preferences, foodsToAvoid: event.target.value })} />
              </label>
              <div className="sm:col-span-2">
                <span className="mb-2 block text-sm">Dietary restrictions</span>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((option) => {
                    const checked = preferences.dietaryRestrictions.includes(option);
                    return (
                      <button key={option} className="rounded-full border border-border px-3 py-1 text-sm" onClick={() => setPreferences({ ...preferences, dietaryRestrictions: checked ? preferences.dietaryRestrictions.filter((entry) => entry !== option) : [...preferences.dietaryRestrictions, option] })}>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="mb-2 block text-sm">Cuisine preferences</span>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map((option) => {
                    const checked = preferences.cuisinePreferences.includes(option);
                    return (
                      <button key={option} className="rounded-full border border-border px-3 py-1 text-sm" onClick={() => setPreferences({ ...preferences, cuisinePreferences: checked ? preferences.cuisinePreferences.filter((entry) => entry !== option) : [...preferences.cuisinePreferences, option] })}>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <button className="mt-4 rounded-lg border border-border px-4 py-2" onClick={handleSavePreferences} disabled={saving}>
              {saving ? 'Saving…' : 'Save preferences'}
            </button>
          </section>

          <section className="glass-panel p-6">
            <h2 className="section-title">Favorites</h2>
            <p className="section-copy mt-1">Keep repeatable kid-approved meals in easy reach.</p>
            <div className="mt-4 space-y-3">
              {favorites.length === 0 ? <p className="text-sm text-muted-foreground">No favorites yet.</p> : favorites.map((meal) => <div key={`${meal.slot}-${meal.name}`} className="rounded-xl border border-border p-3"><p className="font-medium">{meal.name}</p><p className="text-sm text-muted-foreground">{meal.slot}</p></div>)}
            </div>
          </section>
        </div>

        <section className="glass-panel mt-6 p-6">
          <h2 className="section-title">Week overview</h2>
          <p className="section-copy mt-1">Review major sections of the planner by day.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? <p className="text-sm text-muted-foreground">Loading week plan…</p> : weekPlan?.days.map((day) => <button key={day.date} className="rounded-xl border border-border p-4 text-left" onClick={() => setSelectedDate(day.date)}><p className="font-medium">{formatDateLabel(day.date)}</p><p className="text-sm text-muted-foreground">{day.meals.length} meals</p></button>)}
          </div>
        </section>

        <section className="glass-panel mt-6 p-6">
          <h2 className="section-title">Daily plan</h2>
          <p className="section-copy mt-1">{formatDateLabel(selectedDate)}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {MEAL_SLOTS.map((slot) => {
              const meal = getMealBySlot(currentPlan, slot);
              const isFavorite = meal ? favorites.some((favorite) => favorite.name === meal.name && favorite.slot === meal.slot) : false;
              return (
                <article key={slot} className="rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">{slot}</p>
                      <h3 className="mt-1 font-semibold">{meal?.name ?? `No ${slot.toLowerCase()} selected yet`}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-lg border border-border px-3 py-2 text-sm" onClick={() => handleSuggestAlternative(slot)} disabled={!currentPlan}>Swap</button>
                      {meal ? <button className="rounded-lg border border-border px-3 py-2 text-sm" onClick={() => handleToggleFavorite(meal)}>{isFavorite ? 'Unfavorite' : 'Favorite'}</button> : null}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{meal?.description ?? 'Generate today’s plan to see meal details here.'}</p>
                  {meal ? <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{meal.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul> : null}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
