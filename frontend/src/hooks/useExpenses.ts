import { useCallback, useEffect, useState } from 'react';
import {
  createExpense as createExpenseRequest,
  deleteExpense as deleteExpenseRequest,
  fetchExpenses,
  updateExpense as updateExpenseRequest,
  type Expense,
  type ExpensePayload
} from '../api-client/expenses';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<number | null>(null);

  const refreshExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextExpenses = await fetchExpenses();
      setExpenses(nextExpenses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load expenses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshExpenses();
  }, [refreshExpenses]);

  const createExpense = useCallback(async (payload: ExpensePayload) => {
    setIsSubmitting(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await createExpenseRequest(payload);
      setSuccessMessage('Expense saved successfully.');
      await refreshExpenses();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save expense.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [refreshExpenses]);

  const updateExpense = useCallback(async (expenseId: number, payload: ExpensePayload) => {
    setIsSubmitting(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await updateExpenseRequest(expenseId, payload);
      setSuccessMessage('Expense updated successfully.');
      await refreshExpenses();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update expense.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [refreshExpenses]);

  const deleteExpense = useCallback(async (expenseId: number) => {
    setDeletingExpenseId(expenseId);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await deleteExpenseRequest(expenseId);
      setSuccessMessage('Expense deleted successfully.');
      await refreshExpenses();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete expense.');
      throw err;
    } finally {
      setDeletingExpenseId(null);
    }
  }, [refreshExpenses]);

  return {
    expenses,
    loading,
    error,
    actionError,
    successMessage,
    isSubmitting,
    deletingExpenseId,
    createExpense,
    updateExpense,
    deleteExpense,
    refreshExpenses,
    clearActionError: () => setActionError(null),
    clearSuccessMessage: () => setSuccessMessage(null)
  };
}
