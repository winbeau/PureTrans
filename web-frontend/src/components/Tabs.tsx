import type { ReactNode } from 'react';

export type TabItem<T extends string> = {
  id: T;
  label: string;
};

type TabsProps<T extends string> = {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  children: ReactNode;
};

export function Tabs<T extends string>({ tabs, activeTab, onChange, children }: TabsProps<T>) {
  return (
    <>
      <div className="overflow-x-auto border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl gap-1 px-4 sm:px-6">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                className={`h-11 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition ${
                  active
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
                type="button"
                onClick={() => onChange(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      {children}
    </>
  );
}
