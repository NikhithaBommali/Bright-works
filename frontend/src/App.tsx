import { useMemo, useState } from 'react';
import { Alert } from './components/ui/Alert';
import { AppShell } from './components/layout/AppShell';
import { DashboardSection } from './components/features/DashboardSection';
import { ExpenseForm } from './components/features/ExpenseForm';
import { ExpenseList } from './components/features/ExpenseList';
import { ExpenseListToolbar } from './components/features/ExpenseListToolbar';
import { useExpenses } from './hooks/useExpenses';
import type { Expense, ExpenseCategory, ExpensePayload } from './api-client/expenses';

function App() {
  const {
    expenses,
    loading,
    error,
    actionError,
    isSubmitting,
    createExpense,
    updateExpense,
    deleteExpense,
    refreshExpenses,
    clearActionError
  } = useExpenses();

  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === 'all') {
      return expenses;
    }

    return expenses.filter((expense) => expense.category === categoryFilter);
  }, [categoryFilter, expenses]);

  const handleCreateExpense = async (payload: ExpensePayload) => {
    clearActionError();
    await createExpense(payload);
  };

  const handleSaveEdit = async (payload: ExpensePayload) => {
    if (!editingExpense) {
      return;
    }

    clearActionError();
    await updateExpense(editingExpense.id, payload);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    const confirmed = window.confirm(`Delete this ${expense.category} expense from ${expense.date}?`);
    if (!confirmed) {
      return;
    }

    clearActionError();
    await deleteExpense(expense.id);
    if (editingExpense?.id === expense.id) {
      setEditingExpense(null);
    }
  };

  return (
    <AppShell onRefresh={refreshExpenses} isRefreshing={loading && expenses.length > 0}>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {(error || actionError) && (
            <Alert tone="error">
              <div className="space-y-1">
                <p className="font-medium">We couldn&apos;t complete that request.</p>
                <p>{actionError ?? error}</p>
              </div>
            </Alert>
          )}

          <DashboardSection expenses={expenses} loading={loading && expenses.length === 0} />

          <ExpenseForm
            title="Add expense"
            description="Capture a new spend entry with a positive amount and one of the supported categories."
            submitLabel="Save expense"
            onSubmit={handleCreateExpense}
            isSubmitting={isSubmitting}
          />
        </div>

        <div className="space-y-6">
          <ExpenseListToolbar
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            totalVisible={filteredExpenses.length}
            totalAll={expenses.length}
          />

          <ExpenseList
            expenses={filteredExpenses}
            loading={loading && expenses.length === 0}
            editingExpense={editingExpense}
            onEdit={setEditingExpense}
            onDelete={handleDeleteExpense}
          />

          {editingExpense && (
            <ExpenseForm
              key={editingExpense.id}
              title="Edit expense"
              description="Update the selected record and sync the latest persisted values back into the dashboard."
              submitLabel="Update expense"
              onSubmit={handleSaveEdit}
              initialValues={editingExpense}
              isSubmitting={isSubmitting}
              onCancel={() => setEditingExpense(null)}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default App;
