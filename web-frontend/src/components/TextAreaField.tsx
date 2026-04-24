type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
};

export function TextAreaField({ label, value, onChange, placeholder, minRows = 7 }: TextAreaFieldProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <textarea
        className="min-h-40 resize-y rounded-md border border-line bg-white px-3 py-2 text-sm leading-6 text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        rows={minRows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
