import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import type { Contact, ContactPayload } from '../../api-client/contacts';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

interface ContactFormProps {
  mode: 'create' | 'edit';
  initialValue?: Contact | null;
  onSubmit: (payload: ContactPayload) => Promise<void>;
  onCancel?: () => void;
  submitting?: boolean;
  submitLabel?: string;
}

type FormValues = {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
};

function toFormValues(contact?: Contact | null): FormValues {
  return {
    name: contact?.name ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    company: contact?.company ?? '',
    notes: contact?.notes ?? '',
  };
}

function normalizePayload(values: FormValues): ContactPayload {
  return {
    name: values.name.trim(),
    email: values.email.trim() ? values.email.trim() : null,
    phone: values.phone.trim() ? values.phone.trim() : null,
    company: values.company.trim() ? values.company.trim() : null,
    notes: values.notes.trim() ? values.notes.trim() : null,
  };
}

export function ContactForm({ mode, initialValue, onSubmit, onCancel, submitting = false, submitLabel }: ContactFormProps) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(initialValue));
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setValues(toFormValues(initialValue));
    setErrors({});
    setFormError(null);
  }, [initialValue]);

  function validate(nextValues: FormValues) {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};
    if (!nextValues.name.trim()) {
      nextErrors.name = 'Name is required.';
    }

    if (nextValues.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextValues.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    return nextErrors;
  }

  function applyBackendErrors(messages: string[]) {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};
    messages.forEach((message) => {
      const lower = message.toLowerCase();
      if (lower.includes('email')) nextErrors.email = message;
      else if (lower.includes('name')) nextErrors.name = message;
    });
    setErrors((current) => ({ ...current, ...nextErrors }));
    if (!Object.keys(nextErrors).length && messages[0]) {
      setFormError(messages[0]);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await onSubmit(normalizePayload(values));
      if (mode === 'create') {
        setValues(toFormValues(null));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save contact.';
      const details = typeof error === 'object' && error !== null && 'details' in error && Array.isArray((error as { details: unknown }).details)
        ? ((error as { details: string[] }).details)
        : [message];
      applyBackendErrors(details);
      setFormError(message);
    }
  }

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">{mode === 'create' ? 'Create a contact' : 'Edit contact'}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === 'create' ? 'Capture a person, customer, or teammate with rich notes.' : 'Keep contact details fresh and accurate.'}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <Field id={`${mode}-name`} label="Name" required error={errors.name}>
          <Input
            id={`${mode}-name`}
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            hasError={Boolean(errors.name)}
            aria-required="true"
            aria-invalid={Boolean(errors.name)}
          />
        </Field>

        <Field id={`${mode}-email`} label="Email" error={errors.email}>
          <Input
            id={`${mode}-email`}
            type="email"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            hasError={Boolean(errors.email)}
            aria-invalid={Boolean(errors.email)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${mode}-phone`} label="Phone">
            <Input id={`${mode}-phone`} value={values.phone} onChange={(event) => updateField('phone', event.target.value)} />
          </Field>
          <Field id={`${mode}-company`} label="Company">
            <Input id={`${mode}-company`} value={values.company} onChange={(event) => updateField('company', event.target.value)} />
          </Field>
        </div>

        <Field id={`${mode}-notes`} label="Notes">
          <Textarea id={`${mode}-notes`} value={values.notes} onChange={(event) => updateField('notes', event.target.value)} />
        </Field>

        {formError ? (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert" aria-live="polite">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{formError}</span>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" disabled={submitting} aria-disabled={submitting} iconLeft={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}>
            {submitLabel ?? (mode === 'create' ? 'Save contact' : 'Save changes')}
          </Button>
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
