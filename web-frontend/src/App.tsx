import { useEffect, useMemo, useState } from 'react';

import { healthCheck } from './api/translation';
import { Header } from './components/Header';
import { Tabs, type TabItem } from './components/Tabs';
import { CheckTranslationPage } from './pages/CheckTranslationPage';
import { CompareTranslatePage } from './pages/CompareTranslatePage';
import { DirectTranslatePage } from './pages/DirectTranslatePage';
import { KnowledgeTranslatePage } from './pages/KnowledgeTranslatePage';

type ActiveTab = 'kb' | 'direct' | 'compare' | 'check';
type BackendStatus = 'checking' | 'online' | 'offline';

const tabs: TabItem<ActiveTab>[] = [
  { id: 'kb', label: '知识库翻译' },
  { id: 'direct', label: '直接翻译' },
  { id: 'compare', label: '对比翻译' },
  { id: 'check', label: '译文校验' },
];

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('kb');
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const apiBaseUrl = useMemo(() => import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000', []);

  useEffect(() => {
    let active = true;

    healthCheck()
      .then((response) => {
        if (active) {
          setBackendStatus(response.status === 'ok' ? 'online' : 'offline');
        }
      })
      .catch(() => {
        if (active) {
          setBackendStatus('offline');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header backendStatus={backendStatus} apiBaseUrl={apiBaseUrl} />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
        {activeTab === 'kb' ? <KnowledgeTranslatePage /> : null}
        {activeTab === 'direct' ? <DirectTranslatePage /> : null}
        {activeTab === 'compare' ? <CompareTranslatePage /> : null}
        {activeTab === 'check' ? <CheckTranslationPage /> : null}
      </Tabs>
    </div>
  );
}

export default App;
