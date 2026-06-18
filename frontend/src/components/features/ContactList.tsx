import { Building2, Mail, Phone, Search, UserRound } from 'lucide-react';
import type { Contact } from '../../api-client/contacts';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface ContactListProps {
  contacts: Contact[];
  selectedContactId: number | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelect: (contactId: number) => void;
  onCreateNew: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function ContactRow({ contact, selected, onSelect }: { contact: Contact; selected: boolean; onSelect: (contactId: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(contact.id)}
      className={cn(
        'w-full rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected ? 'border-primary bg-primary/10 shadow-soft' : 'border-border bg-background/60 hover:border-primary/40 hover:bg-muted/60',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" />
            <p className="font-medium">{contact.name}</p>
          </div>
          {contact.company ? <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="h-4 w-4" />{contact.company}</p> : null}
        </div>
        <Badge variant={selected ? 'default' : 'muted'}>{selected ? 'Open' : 'Contact'}</Badge>
      </div>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        {contact.email ? <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{contact.email}</p> : null}
        {contact.phone ? <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{contact.phone}</p> : null}
      </div>
    </button>
  );
}

export function ContactList({ contacts, selectedContactId, searchValue, onSearchChange, onSelect, onCreateNew, loading = false, error, onRetry }: ContactListProps) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Contacts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Case-insensitive search by name with instant filtering.</p>
        </div>
        <Button type="button" size="sm" onClick={onCreateNew}>New</Button>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background/70 p-3">
        <label htmlFor="contact-search" className="mb-2 block text-sm font-medium text-foreground">
          Search contacts
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="contact-search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-28 w-full rounded-2xl" />)
        ) : error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <p>{error}</p>
            {onRetry ? <Button type="button" variant="outline" className="mt-3" onClick={onRetry}>Retry</Button> : null}
          </div>
        ) : contacts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-base font-medium">No contacts found</p>
            <p className="mt-2 text-sm text-muted-foreground">Create your first contact or refine your search.</p>
            <Button type="button" className="mt-4" onClick={onCreateNew}>Create contact</Button>
          </div>
        ) : (
          contacts.map((contact) => (
            <ContactRow key={contact.id} contact={contact} selected={selectedContactId === contact.id} onSelect={onSelect} />
          ))
        )}
      </div>
    </Card>
  );
}
