import { Clock3, Save, Trash2, Users } from 'lucide-react';
import type { Meal } from '../../types/mealPlanner';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionHeading } from '../ui/SectionHeading';
import { Skeleton } from '../ui/Skeleton';

interface FavoritesPanelProps {
  favorites: Meal[];
  loading: boolean;
  onReuse: (meal: Meal) => void;
  onRemove: (meal: Meal) => void;
}

export function FavoritesPanel({ favorites, loading, onReuse, onRemove }: FavoritesPanelProps) {
  return (
    <Card className="h-full min-w-0">
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
            <div key={`${favorite.name}-${favorite.slot}`} className="rounded-2xl border border-border/80 bg-secondary/30 p-4 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground">{favorite.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{favorite.description}</p>
                </div>
                <Badge>{favorite.difficulty}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> family ready</span>
                <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {Number(favorite.prepTimeMinutes ?? 0)} min</span>
                <span className="inline-flex items-center gap-1">Best for {favorite.slot}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => onReuse(favorite)}>
                  <Save className="h-4 w-4" /> Reuse in a slot
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(favorite)}>
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
