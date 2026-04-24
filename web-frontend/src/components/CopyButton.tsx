import { useState } from 'react';

import { copyToClipboard } from '../utils/clipboard';

type CopyButtonProps = {
  value: string;
  disabled?: boolean;
};

export function CopyButton({ value, disabled = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value || disabled) {
      return;
    }

    await copyToClipboard(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      className="inline-flex h-8 items-center rounded-md border border-line px-3 text-xs font-medium text-slate-600 transition hover:border-brand-500 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
      type="button"
      onClick={handleCopy}
      disabled={disabled || !value}
    >
      {copied ? '已复制' : '复制'}
    </button>
  );
}
