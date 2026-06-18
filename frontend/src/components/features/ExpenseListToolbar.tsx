import { Filter, Layers3 } from 'lucide-react';
import type { ExpenseCategory } from '../../api-client/expenses';
import { Card, CardContent } from '../ui/Card';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';

interface ExpenseListToolbarProps {
  categoryFilter: 'all' | ExpenseCategory;
  onCategoryFilterChange: (value: 'all' | ExpenseCategory) => void;
  totalVisible: number;
  totalAll: number;
}

const categoryOptions: Array<'all' | ExpenseCategory> = ['all', 'food', 'transport', 'shopping', 'other'];

export function ExpenseListToolbar({
  categoryFilter,
  onCategoryFilterChange,
  totalVisible,
  totalAll
}: ExpenseListToolbarProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter className="h-4 w-4 text-primary" />
            Filter expenses
          </div>
          <p className="text-sm text-muted-foreground">Focus the list on a single category while keeping dashboard metrics based on all current expenses.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_auto] sm:items-end">
          <div>
            <Label htmlFor="expense-filter">Category</Label>
            <Select
              id="expense-filter"
              value={categoryFilter}
              onChange={(event) => onCategoryFilterChange(event.target.value as 'all' | ExpenseCategory)}
              className="capitalize"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option} className="capitalize">
                  {option}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-secondary/70 px-4 py-3 text-sm text-secondary-foreground">
            <Layers3 className="h-4 w-4 text-primary" />
            <span>
              Showing <strong>{totalVisible}</strong> of <strong>{totalAll}</strong>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
