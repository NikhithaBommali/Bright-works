import { Save, Users } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type { Preferences } from '../../api-client/mealPlanner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ChipButton } from '../ui/ChipButton';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

const AGE_OPTIONS = ['2-5', '6-8', '9-12'];
const DIET_OPTIONS = ['none', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free'];
const CUISINE_OPTIONS = ['Italian', 'Mexican', 'Indian', 'Mediterranean', 'American', 'Asian'];

interface PreferencesPanelProps {
  preferences: Preferences;
  onChange: (next: Preferences) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function PreferencesPanel({ preferences, onChange, onSave, isSaving }: PreferencesPanelProps) {
  const updateField = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    onChange({ ...preferences, [key]: value });
  };

  const handleNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateField('number_of_kids', Math.max(1, Number(event.target.value || 1)));
  };

  const toggleCuisine = (value: string) => {
    const current = preferences.cuisine_preferences;
    updateField(
      'cuisine_preferences',
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Family preferences</p>
          <p className="mt-1 text-sm text-muted-foreground">Keep meals aligned with your kids' ages, routines, and food boundaries.</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
          <Users className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-4">
        <Field id="number_of_kids" label="Number of kids" required>
          <Input
            id="number_of_kids"
            type="number"
            min={1}
            value={preferences.number_of_kids}
            onChange={handleNumberChange}
            aria-required="true"
          />
        </Field>

        <Field id="age_range" label="Age range" required>
          <Select
            id="age_range"
            value={preferences.age_range}
            onChange={(event) => updateField('age_range', event.target.value)}
            aria-required="true"
          >
            {AGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="dietary_restriction" label="Dietary restriction">
          <Select
            id="dietary_restriction"
            value={preferences.dietary_restriction}
            onChange={(event) => updateField('dietary_restriction', event.target.value)}
          >
            {DIET_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="foods_to_avoid" label="Foods to avoid" hint="Separate ingredients with commas if needed.">
          <Input
            id="foods_to_avoid"
            value={preferences.foods_to_avoid}
            onChange={(event) => updateField('foods_to_avoid', event.target.value)}
            placeholder="e.g. peanuts, mushrooms"
          />
        </Field>

        <Field id="cuisine_preferences" label="Cuisine preferences" hint="Pick a few favorite styles for more personalized suggestions.">
          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map((option) => (
              <ChipButton
                key={option}
                active={preferences.cuisine_preferences.includes(option)}
                aria-pressed={preferences.cuisine_preferences.includes(option)}
                onClick={() => toggleCuisine(option)}
              >
                {option}
              </ChipButton>
            ))}
          </div>
        </Field>
      </div>

      <Button onClick={onSave} disabled={isSaving} aria-disabled={isSaving} className="w-full" iconLeft={<Save className="h-4 w-4" />}>
        {isSaving ? 'Saving preferences...' : 'Save preferences'}
      </Button>
    </Card>
  );
}
