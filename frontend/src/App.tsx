import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Building2,
  Mail,
  NotebookPen,
  Phone,
  RefreshCw,
  Trash2,
  UserRound,
} from 'lucide-react';
import {
  createContact,
  deleteContact,
  fetchContact,
  fetchContacts,
  type Contact,
  type ContactPayload,
  updateContact,
} from './api-client/contacts';
import { ContactForm } from './components/features/ContactForm';
import { ContactList } from './components/features/ContactList';
import { BaseLayout } from './components/layout/BaseLayout';
import { Badge } from './components/ui/Badge';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Skeleton } from './components/ui/Skeleton';
import { useDarkMode } from './hooks/useDarkMode';

type ActiveView = 'create' | 'detail' | 'edit';

type FlowState = {
  loading: boolean;
  error: string | null;
};

function DetailSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </Card>
  );
}

function EmptyDetail({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="p-8 sm:p-10">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="rounded-3xl bg-gradient-primary p-4 text-primary-foreground shadow-soft">
          <UserRound className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold">Select a contact to open their profile</h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Browse the list on the left, or add someone new to start building your Rolodex.
        </p>
        <Button className="mt-5" onClick={onCreate}>
          Create your first contact
        </Button>
      </div>
    </Card>
  );
}

function ErrorPanel({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border border-destructive/30 bg-destructive/10 p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-destructive/15 p-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </Card>
  );
}

function DetailField({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/50 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <p className="mt-2 break-words text-sm text-muted-foreground">{value?.trim() ? value : 'Not provided'}</p>
    </div>
  );
}

function DetailView({
  contact,
  loading,
  error,
  onEdit,
  onDelete,
  onRetry,
  deleting,
  deleteError,
  showDeleteConfirm,
  onStartDelete,
  onCancelDelete,
}: {
  contact: Contact | null;
  loading: boolean;
  error: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onRetry: () => void;
  deleting: boolean;
  deleteError: string | null;
  showDeleteConfirm: boolean;
  onStartDelete: () => void;
  onCancelDelete: () => void;
}) {
  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <ErrorPanel
        title="Unable to load contact details"
        message={error}
        action={
          <Button variant="outline" onClick={onRetry} iconLeft={<RefreshCw className="h-4 w-4" />}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!contact) return null;

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-gradient-primary p-3 text-primary-foreground shadow-soft">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold sm:text-3xl">{contact.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Full contact profile with every stored field.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="accent">Rolodex Profile</Badge>
              {contact.company ? <Badge variant="muted">{contact.company}</Badge> : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={onEdit} iconLeft={<NotebookPen className="h-4 w-4" />}>
              Edit contact
            </Button>
            {!showDeleteConfirm ? (
              <Button variant="destructive" onClick={onStartDelete} iconLeft={<Trash2 className="h-4 w-4" />}>
                Delete
              </Button>
            ) : (
              <div className="flex flex-col gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">Confirm delete for {contact.name}?</p>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={onDelete} disabled={deleting} aria-disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Yes, delete'}
                  </Button>
                  <Button variant="outline" onClick={onCancelDelete} disabled={deleting}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {deleteError ? (
          <div className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
            {deleteError}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <DetailField icon={<Mail className="h-4 w-4" />} label="Email" value={contact.email} />
        <DetailField icon={<Phone className="h-4 w-4" />} label="Phone" value={contact.phone} />
        <DetailField icon={<Building2 className="h-4 w-4" />} label="Company" value={contact.company} />
        <DetailField icon={<NotebookPen className="h-4 w-4" />} label="Notes" value={contact.notes} />
      </div>
    </div>
  );
}

export default function App() {
  const { isDark, toggleTheme } = useDarkMode(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('create');
  const [listState, setListState] = useState<FlowState>({ loading: true, error: null });
  const [detailState, setDetailState] = useState<FlowState>({ loading: false, error: null });
  const [createState, setCreateState] = useState<FlowState>({ loading: false, error: null });
  const [editState, setEditState] = useState<FlowState>({ loading: false, error: null });
  const [deleteState, setDeleteState] = useState<FlowState>({ loading: false, error: null });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const searchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = window.setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 250);

    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchValue]);

  async function loadContacts(nextSelectedId?: number | null) {
    setListState({ loading: true, error: null });

    try {
      const data = await fetchContacts(debouncedSearch.trim());
      setContacts(data);
      setListState({ loading: false, error: null });

      const preferredId = nextSelectedId ?? selectedContactId;
      if (preferredId && data.some((contact) => contact.id === preferredId)) {
        setSelectedContactId(preferredId);
        return;
      }

      if (data.length > 0) {
        setSelectedContactId((current) => (current && data.some((contact) => contact.id === current) ? current : data[0].id));
        if (activeView !== 'create') {
          setActiveView('detail');
        }
      } else {
        setSelectedContactId(null);
        setSelectedContact(null);
        setActiveView('create');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load contacts.';
      setListState({ loading: false, error: message });
    }
  }

  useEffect(() => {
    void loadContacts();
  }, [debouncedSearch]);

  async function loadContactDetail(contactId: number) {
    setDetailState({ loading: true, error: null });
    setDeleteState({ loading: false, error: null });
    setShowDeleteConfirm(false);

    try {
      const data = await fetchContact(contactId);
      setSelectedContact(data);
      setDetailState({ loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load contact details.';
      setDetailState({ loading: false, error: message });
    }
  }

  useEffect(() => {
    if (activeView !== 'detail' || selectedContactId === null) {
      return;
    }

    void loadContactDetail(selectedContactId);
  }, [activeView, selectedContactId]);

  const stats = useMemo(() => {
    const withEmail = contacts.filter((contact) => Boolean(contact.email)).length;
    const withCompany = contacts.filter((contact) => Boolean(contact.company)).length;
    return {
      total: Number(contacts.length ?? 0),
      withEmail: Number(withEmail ?? 0),
      withCompany: Number(withCompany ?? 0),
    };
  }, [contacts]);

  async function handleCreate(payload: ContactPayload) {
    setCreateState({ loading: true, error: null });
    try {
      const created = await createContact(payload);
      setCreateState({ loading: false, error: null });
      await loadContacts(created.id);
      setSelectedContactId(created.id);
      setActiveView('detail');
      setSelectedContact(created);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create contact.';
      setCreateState({ loading: false, error: message });
      throw error;
    }
  }

  async function handleEdit(payload: ContactPayload) {
    if (selectedContactId === null) return;

    setEditState({ loading: true, error: null });
    try {
      const updated = await updateContact(selectedContactId, payload);
      setSelectedContact(updated);
      setEditState({ loading: false, error: null });
      await loadContacts(updated.id);
      setActiveView('detail');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update contact.';
      setEditState({ loading: false, error: message });
      throw error;
    }
  }

  async function handleDelete() {
    if (selectedContactId === null) return;

    setDeleteState({ loading: true, error: null });
    try {
      await deleteContact(selectedContactId);
      setDeleteState({ loading: false, error: null });
      setShowDeleteConfirm(false);
      setSelectedContact(null);
      setSelectedContactId(null);
      await loadContacts(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete contact.';
      setDeleteState({ loading: false, error: message });
    }
  }

  function openCreateView() {
    setActiveView('create');
    setSelectedContact(null);
    setShowDeleteConfirm(false);
    setDeleteState({ loading: false, error: null });
  }

  function openDetailView(contactId: number) {
    setSelectedContactId(contactId);
    setActiveView('detail');
  }

  function detailErrorMessage() {
    if (detailState.error) return detailState.error;
    if (editState.error && activeView === 'edit') return editState.error;
    return null;
  }

  const sidebar = (
    <>
      <Card className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6 xl:grid-cols-1">
        <div>
          <p className="text-sm text-muted-foreground">Total contacts</p>
          <p className="mt-1 text-3xl font-semibold">{stats.total}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">With email</p>
          <p className="mt-1 text-3xl font-semibold">{stats.withEmail}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">With company</p>
          <p className="mt-1 text-3xl font-semibold">{stats.withCompany}</p>
        </div>
      </Card>

      <ContactList
        contacts={contacts}
        selectedContactId={selectedContactId}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSelect={openDetailView}
        onCreateNew={openCreateView}
        loading={listState.loading}
        error={listState.error}
        onRetry={() => {
          void loadContacts();
        }}
      />
    </>
  );

  const utility = (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        if (activeView === 'detail' && selectedContactId !== null) {
          void loadContactDetail(selectedContactId);
        }
        void loadContacts();
      }}
      iconLeft={<RefreshCw className="h-4 w-4" />}
    >
      Refresh
    </Button>
  );

  const content =
    activeView === 'create' ? (
      <div className="space-y-6">
        <ContactForm mode="create" onSubmit={handleCreate} submitting={createState.loading} />
        {createState.error ? (
          <ErrorPanel title="Create flow needs attention" message={createState.error} />
        ) : null}
      </div>
    ) : activeView === 'edit' ? (
      detailState.loading ? (
        <DetailSkeleton />
      ) : detailErrorMessage() ? (
        <ErrorPanel
          title="Unable to open edit form"
          message={detailErrorMessage() ?? 'Unknown error'}
          action={
            <Button variant="outline" onClick={() => selectedContactId !== null && void loadContactDetail(selectedContactId)}>
              Retry
            </Button>
          }
        />
      ) : selectedContact ? (
        <div className="space-y-6">
          <ContactForm
            mode="edit"
            initialValue={selectedContact}
            onSubmit={handleEdit}
            onCancel={() => setActiveView('detail')}
            submitting={editState.loading}
          />
          {editState.error ? <ErrorPanel title="Edit failed" message={editState.error} /> : null}
        </div>
      ) : (
        <EmptyDetail onCreate={openCreateView} />
      )
    ) : selectedContactId === null && !listState.loading ? (
      <EmptyDetail onCreate={openCreateView} />
    ) : (
      <DetailView
        contact={selectedContact}
        loading={detailState.loading}
        error={detailState.error}
        onEdit={() => setActiveView('edit')}
        onDelete={handleDelete}
        onRetry={() => selectedContactId !== null && void loadContactDetail(selectedContactId)}
        deleting={deleteState.loading}
        deleteError={deleteState.error}
        showDeleteConfirm={showDeleteConfirm}
        onStartDelete={() => setShowDeleteConfirm(true)}
        onCancelDelete={() => {
          setShowDeleteConfirm(false);
          setDeleteState({ loading: false, error: null });
        }}
      />
    );

  return <BaseLayout isDark={isDark} onToggleTheme={toggleTheme} sidebar={sidebar} content={content} utility={utility} />;
}
