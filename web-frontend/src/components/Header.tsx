type HeaderProps = {
  backendStatus: 'checking' | 'online' | 'offline';
  apiBaseUrl: string;
};

export function Header({ backendStatus, apiBaseUrl }: HeaderProps) {
  const statusText = {
    checking: '检测中',
    online: '在线',
    offline: '离线',
  }[backendStatus];

  const statusClassName =
    backendStatus === 'online'
      ? 'border-brand-100 bg-brand-50 text-brand-700'
      : backendStatus === 'offline'
        ? 'border-red-100 bg-red-50 text-red-700'
        : 'border-slate-200 bg-white text-slate-600';

  return (
    <header className="border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">PureTrans</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-ink">清译 Web 演示</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full border px-3 py-1 font-medium ${statusClassName}`}>后端 {statusText}</span>
          <span className="max-w-full truncate rounded-full border border-line bg-slate-50 px-3 py-1 text-slate-500">
            {apiBaseUrl}
          </span>
        </div>
      </div>
    </header>
  );
}
