import { CheckboxChip } from '../ui/CheckboxChip';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { SectionHeading } from '../ui/SectionHeading';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import type { Preferences } from '../../types/mealPlanner';

interface PreferencesPanelProps {
  preferences: Preferences;
  ageOptions: string[];
  dietaryOptions: string[];
  cuisineOptions: string[];
  saving: boolean;
  onChange: (next: Preferences) => void;
  onSave: () => void;
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function PreferencesPanel({ preferences, ageOptions, dietaryOptions, cuisineOptions, saving, onChange, onSave }: PreferencesPanelProps) {
  return (
    <Card>
      <SectionHeading
        eyebrow="Preferences"
        title="Make each plan fit your family"
        description="Set number of kids, age range, dietary restrictions, foods to avoid, and cuisine preferences before generating meals."
        action={<Button type="button" onClick={onSave} loading={saving}>Save preferences</Button>}
      />

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="numberOfKids">Number of kids</Label>
          <Input
            id="numberOfKids"
            type="number"
            min={1}
            value={preferences.numberOfKids}
            onChange={(event) => onChange({ ...preferences, numberOfKids: Number(event.target.value ?? 1) || 1 })}
          />
        </div>
        <div>
          <Label htmlFor="ageRange">Age range</Label>
          <Select id="ageRange" value={preferences.ageRange} onChange={(event) => onChange({ ...preferences, ageRange: event.target.value })}>
            {ageOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Dietary restrictions</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {dietaryOptions.map((option) => (
              <CheckboxChip
                key={option}
                checked={preferences.dietaryRestrictions.includes(option)}
                label={option}
                onToggle={() => onChange({ ...preferences, dietaryRestrictions: toggleValue(preferences.dietaryRestrictions, option) })}
              />
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="foodsToAvoid">Foods to avoid</Label>
          <Textarea
            id="foodsToAvoid"
            value={preferences.foodsToAvoid}
            placeholder="Example: mushrooms, peanuts, spicy sauces"
            onChange={(event) => onChange({ ...preferences, foodsToAvoid: event.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Cuisine preferences</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {cuisineOptions.map((option) => (
              <CheckboxChip
                key={option}
                checked={preferences.cuisinePreferences.includes(option)}
                label={option}
                onToggle={() => onChange({ ...preferences, cuisinePreferences: toggleValue(preferences.cuisinePreferences, option) })}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
