import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, CircleDollarSign, PencilLine, Plus, Tags, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import type { Expense, ExpenseCategory, ExpensePayload } from '../../api-client/expenses';

interface ExpenseFormProps {
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (payload: ExpensePayload) => Promise<void>;
  isSubmitting: boolean;
  initialValues?: Expense;
  onCancel?: () => void;
}

type FormState = {
  amount: string;
  category: ExpenseCategory;
  note: string;
  date: string;
};

const categoryOptions: ExpenseCategory[] = ['food', 'transport', 'shopping', 'other'];

const emptyState: FormState = {
  amount: '',
  category: 'food',
  note: '',
  date: new Date().toISOString().slice(0, 10)
};

function toFormState(values?: Expense): FormState {
  if (!values) {
    return emptyState;
  }

  return {
    amount: String(Number(values.amount ?? 0)),
    category: values.category,
    note: values.note,
    date: values.date
  };
}

export function ExpenseForm({ title, description, submitLabel, onSubmit, isSubmitting, initialValues, onCancel }: ExpenseFormProps) {
  const [formState, setFormState] = useState<FormState>(toFormState(initialValues));
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    setFormState(toFormState(initialValues));
    setAmountError('');
  }, [initialValues]);

  const isEditing = useMemo(() => Boolean(initialValues), [initialValues]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const numericAmount = Number(formState.amount);
    if (numericAmount <= 0 || Number.isNaN(numericAmount)) {
      setAmountError('Amount must be greater than 0.');
      return;
    }

    setAmountError('');
    await onSubmit({
      amount: numericAmount,
      category: formState.category,
      note: formState.note,
      date: formState.date
    });

    if (!isEditing) {
      setFormState(emptyState);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            {isEditing ? <PencilLine className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="amount">
                Amount <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <CircleDollarSign className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  className="pl-10"
                  value={formState.amount}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, amount: event.target.value }));
                    if (amountError) {
                      setAmountError('');
                    }
                  }}
                  aria-required="true"
                  aria-describedby={amountError ? 'amount-error' : undefined}
                  disabled={isSubmitting}
                />
              </div>
              {amountError && (
                <p id="amount-error" className="mt-2 text-sm text-destructive">
                  {amountError}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="category">
                Category <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Tags className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Select
                  id="category"
                  name="category"
                  className="pl-10 capitalize"
                  value={formState.category}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, category: event.target.value as ExpenseCategory }))
                  }
                  aria-required="true"
                  disabled={isSubmitting}
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option} className="capitalize">
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="date">
                Date <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  name="date"
                  type="date"
                  className="pl-10"
                  value={formState.date}
                  onChange={(event) => setFormState((current) => ({ ...current, date: event.target.value }))}
                  aria-required="true"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                name="note"
                className="min-h-[44px]"
                value={formState.note}
                onChange={(event) => setFormState((current) => ({ ...current, note: event.target.value }))}
                placeholder="Groceries, train fare, gifts..."
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting} aria-disabled={isSubmitting}>
              {isEditing ? <PencilLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isSubmitting ? 'Saving...' : submitLabel}
            </Button>
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
