import type { Direction } from '../types/api';
import { directions } from '../utils/examples';

type DirectionSelectProps = {
  value: Direction;
  onChange: (value: Direction) => void;
};

export function DirectionSelect({ value, onChange }: DirectionSelectProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      翻译方向
      <select
        className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        value={value}
        onChange={(event) => onChange(event.target.value as Direction)}
      >
        {directions.map((direction) => (
          <option key={direction} value={direction}>
            {direction}
          </option>
        ))}
      </select>
    </label>
  );
}
