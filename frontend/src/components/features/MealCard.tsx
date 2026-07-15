import { ChevronDown, ChevronUp, Clock3, Heart, RefreshCw, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Favorite, Meal, MealSlot } from '../../api-client/mealPlanner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface MealCardProps {
  slot: MealSlot;
  meal: Meal;
  favorite?: Favorite;
  isFavoritePending: boolean;
  isSuggesting: boolean;
  onToggleFavorite: (meal: Meal, favorite?: Favorite) => void;
  onSuggestAlternative: (slot: MealSlot) => void;
}

function formatSlot(slot: MealSlot) {
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

export function MealCard({
  slot,
  meal,
  favorite,
  isFavoritePending,
  isSuggesting,
  onToggleFavorite,
  onSuggestAlternative,
}: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const imageUrl = useMemo(() => {
    const prompt = encodeURIComponent(
      `${meal.name}, kid-friendly ${formatSlot(slot)} meal, colorful fresh ingredients, realistic food photography, bright natural light, plated for children`,
    );
    return `https://image.pollinations.ai/prompt/${prompt}`;
  }, [meal.name, slot]);

  return (
    <Card className="overflow-hidden rounded-3xl">
      <article className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
        <img src={imageUrl} alt={meal.name} className="h-48 w-full object-cover md:h-full" />
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">{formatSlot(slot)}</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{meal.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{meal.description}</p>
            </div>
            <Button
              variant={favorite ? 'secondary' : 'outline'}
              size="icon"
              aria-label={favorite ? `Remove ${meal.name} from favorites` : `Save ${meal.name} to favorites`}
              disabled={isFavoritePending}
              aria-disabled={isFavoritePending}
              onClick={() => onToggleFavorite(meal, favorite)}
            >
              <Heart className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
              <Clock3 className="h-4 w-4" /> {Number(meal.prep_time_minutes)} min
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
              <Star className="h-4 w-4" /> {meal.difficulty}
            </span>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
              onClick={() => setIsExpanded((value) => !value)}
              aria-expanded={isExpanded}
              aria-controls={`${slot}-ingredients`}
            >
              <span>Ingredients</span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isExpanded ? (
              <ul id={`${slot}-ingredients`} className="mt-3 space-y-2 text-sm text-muted-foreground">
                {meal.ingredients.map((ingredient) => (
                  <li key={ingredient} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <Button
            variant="ghost"
            onClick={() => onSuggestAlternative(slot)}
            disabled={isSuggesting}
            aria-disabled={isSuggesting}
            className="w-full justify-center sm:w-auto"
            iconLeft={<RefreshCw className={`h-4 w-4 ${isSuggesting ? 'animate-spin' : ''}`} />}
          >
            {isSuggesting ? 'Refreshing this slot...' : 'Suggest alternative'}
          </Button>
        </div>
      </article>
    </Card>
  );
}
