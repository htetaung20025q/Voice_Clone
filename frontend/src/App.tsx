import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Studio } from './pages/Studio';
import { Voices } from './pages/Voices';
import { About } from './pages/About';
import { AdminDashboard } from './pages/AdminDashboard';
import type { Language } from './services/i18n';

export function App() {
  const getInitialPage = () => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    if (['home', 'studio', 'voices', 'about', 'admin'].includes(hash)) {
      return hash;
    }
    return 'home';
  };

  const [currentPage, setCurrentPage] = useState<string>(getInitialPage);
  const [language, setLanguage] = useState<Language>('my'); // Default to မြန်မာ (Burmese)
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'my' ? 'en' : 'my'));
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (['home', 'studio', 'voices', 'about', 'admin'].includes(hash)) {
        setCurrentPage(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: string) => {
    setCurrentPage(page);
    window.location.hash = `/${page}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectVoiceForStudio = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    navigateTo('studio');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 selection:bg-myanmar-red selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={navigateTo}
        language={language}
        onToggleLanguage={toggleLanguage}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <Home
            onOpenStudio={() => navigateTo('studio')}
            onExploreVoices={() => navigateTo('voices')}
            language={language}
          />
        )}
        {currentPage === 'studio' && (
          <Studio
            language={language}
            initialVoiceId={selectedVoiceId}
          />
        )}
        {currentPage === 'voices' && (
          <Voices
            onSelectVoiceForStudio={handleSelectVoiceForStudio}
            language={language}
          />
        )}
        {currentPage === 'about' && (
          <About
            onOpenStudio={() => navigateTo('studio')}
            language={language}
          />
        )}
        {currentPage === 'admin' && (
          <AdminDashboard
            language={language}
            onNavigateToStudio={() => navigateTo('studio')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
