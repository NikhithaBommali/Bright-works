import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const filesToCheck = [
  'frontend/src/api-client/contacts.ts',
  'frontend/src/components/features/ContactForm.tsx',
  'frontend/src/components/features/ContactList.tsx',
  'frontend/src/components/layout/BaseLayout.tsx',
  'frontend/src/components/ui/StyleGuide.tsx',
  'frontend/src/main.tsx',
];

test('all frontend fetches use the API_BASE ?? "" pattern', async () => {
  for (const file of filesToCheck) {
    const content = readFileSync(file, 'utf8');
    expect(content).toContain("const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';"
    );
  }
});

test('frontend source does not contain hardcoded absolute backend URLs', async () => {
  for (const file of filesToCheck) {
    const content = readFileSync(file, 'utf8');
    expect(content).not.toMatch(/https?:\/\//);
  }
});
