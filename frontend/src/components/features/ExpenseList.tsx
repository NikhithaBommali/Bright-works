import { Pencil, ReceiptText, Trash2 } from 'lucide-react';
import type { Expense } from '../../api-client/expenses';
import { formatCurrency, formatDisplayDate } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

interface ExpenseListProps {
  expenses: Expense[];
  loading: boolean;
  editingExpense: Expense | null;
  deletingExpenseId?: number | null;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseList({ expenses, loading, editingExpense, deletingExpenseId, onEdit, onDelete }: ExpenseListProps) {
  return (
    <section className="space-y-4" aria-labelledby="expense-list-heading">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/15 p-2 text-primary">
          <ReceiptText className="h-5 w-5" />
        </div>
        <div>
          <h2 id="expense-list-heading" className="text-xl font-semibold">
            Expense list
          </h2>
          <p className="text-sm text-muted-foreground">Review, edit, and delete persisted records.</p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="space-y-3 rounded-xl border border-border/60 p-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-9 w-40" />
                </div>
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
              <p className="text-base font-medium">No matching expenses</p>
              <p className="mt-2 text-sm text-muted-foreground">Adjust the category filter or add a new expense to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => {
                const isEditing = editingExpense?.id === expense.id;
                const isDeleting = deletingExpenseId === expense.id;

                return (
                  <article
                    key={expense.id}
                    className="rounded-2xl border border-border/60 bg-surface-secondary/40 p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-soft"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="capitalize">{expense.category}</Badge>
                          <span className="text-sm text-muted-foreground">{formatDisplayDate(expense.date)}</span>
                          {isEditing && <Badge variant="outline">Editing</Badge>}
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{formatCurrency(Number(expense.amount ?? 0))}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{expense.note || 'No note provided.'}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(expense)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(expense)}
                          disabled={isDeleting}
                          aria-disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
