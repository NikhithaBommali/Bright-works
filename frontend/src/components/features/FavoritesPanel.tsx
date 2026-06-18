import { Heart } from 'lucide-react';
import type { Favorite } from '../../api-client/mealPlanner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface FavoritesPanelProps {
  favorites: Favorite[];
  pendingFavoriteId?: string | null;
  onRemove: (favorite: Favorite) => void;
}

export function FavoritesPanel({ favorites, pendingFavoriteId, onRemove }: FavoritesPanelProps) {
  return (
    <Card className="space-y-4 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Favorite meals</p>
          <p className="mt-1 text-sm text-muted-foreground">Keep your biggest mealtime wins ready for another busy day.</p>
        </div>
        <div className="rounded-2xl bg-rose-500/10 p-2 text-rose-500">
          <Heart className="h-5 w-5" />
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">
          Save a meal you love and it will appear here for quick reference.
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{favorite.meal.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{favorite.meal.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {Number(favorite.meal.prep_time_minutes)} min • {favorite.meal.difficulty}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(favorite)}
                  disabled={pendingFavoriteId === favorite.id}
                  aria-disabled={pendingFavoriteId === favorite.id}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
