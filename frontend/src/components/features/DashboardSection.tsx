import type { ReactNode } from 'react';
import { LayoutGrid, Receipt, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import type { Expense, ExpenseCategory } from '../../api-client/expenses';
import { formatCurrency } from '../../utils/format';

interface DashboardSectionProps {
  expenses: Expense[];
  loading: boolean;
}

const categories: ExpenseCategory[] = ['food', 'transport', 'shopping', 'other'];

export function DashboardSection({ expenses, loading }: DashboardSectionProps) {
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const categoryCounts = categories
    .map((category) => ({
      category,
      count: expenses.filter((expense) => expense.category === category).length
    }))
    .filter((entry) => entry.count > 0);

  return (
    <section className="space-y-4" aria-labelledby="dashboard-heading">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/15 p-2 text-primary">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <h2 id="dashboard-heading" className="text-xl font-semibold">
            Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">Total spend and category activity based on your current stored expenses.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Total spent"
          value={loading ? undefined : formatCurrency(totalSpent)}
          icon={<Receipt className="h-5 w-5" />}
          loading={loading}
        />
        <SummaryCard
          label="Tracked expenses"
          value={loading ? undefined : `${expenses.length}`}
          icon={<LayoutGrid className="h-5 w-5" />}
          loading={loading}
        />
        <Card className="md:col-span-2 xl:col-span-1">
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Count by category</p>
              <span className="text-xs text-muted-foreground">Current data</span>
            </div>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : categoryCounts.length > 0 ? (
              <div className="space-y-3">
                {categoryCounts.map((entry) => (
                  <div key={entry.category} className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 px-4 py-3">
                    <span className="capitalize text-foreground">{entry.category}</span>
                    <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">{entry.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                No expenses yet. Add your first entry to populate the dashboard.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

interface SummaryCardProps {
  label: string;
  value?: string;
  icon: ReactNode;
  loading: boolean;
}

function SummaryCard({ label, value, icon, loading }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="rounded-full bg-primary/15 p-2 text-primary">{icon}</div>
        </div>
        {loading ? <Skeleton className="h-8 w-28" /> : <p className="text-3xl font-semibold">{value}</p>}
      </CardContent>
    </Card>
  );
}
