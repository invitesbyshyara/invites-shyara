import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ScheduleEntry {
  time: string;
  title: string;
  description: string;
}

interface ScheduleEditorProps {
  value: ScheduleEntry[];
  onChange: (entries: ScheduleEntry[]) => void;
}

const ScheduleEditor = ({ value = [], onChange }: ScheduleEditorProps) => {
  const addEntry = () => {
    onChange([...value, { time: '', title: '', description: '' }]);
  };

  const removeEntry = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof ScheduleEntry, val: string) => {
    const updated = value.map((entry, i) =>
      i === index ? { ...entry, [field]: val } : entry
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {value.map((entry, i) => (
        <div key={i} className="p-4 rounded-lg border border-border bg-background space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body font-medium text-muted-foreground">Event {i + 1}</span>
            <button
              type="button"
              onClick={() => removeEntry(i)}
              className="text-xs text-destructive hover:underline font-body"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Time (e.g. 4:00 PM)"
              value={entry.time}
              onChange={e => updateEntry(i, 'time', e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="Event Title"
              value={entry.title}
              onChange={e => updateEntry(i, 'title', e.target.value)}
              className="text-sm"
            />
          </div>
          <Input
            placeholder="Description (optional)"
            value={entry.description}
            onChange={e => updateEntry(i, 'description', e.target.value)}
            className="text-sm"
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addEntry} className="w-full font-body">
        + Add Event
      </Button>
    </div>
  );
};

export default ScheduleEditor;
