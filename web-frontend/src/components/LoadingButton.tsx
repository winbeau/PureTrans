import type { ReactNode } from 'react';

type LoadingButtonProps = {
  loading: boolean;
  children: ReactNode;
  disabled?: boolean;
};

export function LoadingButton({ loading, children, disabled = false }: LoadingButtonProps) {
  return (
    <button
      className="inline-flex h-10 min-w-28 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      type="submit"
      disabled={loading || disabled}
    >
      {loading ? '处理中...' : children}
    </button>
  );
}
