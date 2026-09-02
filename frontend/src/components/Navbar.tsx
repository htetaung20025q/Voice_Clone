import React, { useState } from 'react';
import { Volume2, Menu, X, Globe } from 'lucide-react';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  language: Language;
  onToggleLanguage: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  language,
  onToggleLanguage,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language].nav;

  const navItems = [
    { id: 'home', label: t.home },
    { id: 'studio', label: t.studio },
    { id: 'voices', label: t.voices },
    { id: 'about', label: t.about },
    { id: 'docs', label: t.docs },
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo & Title */}
        <div 
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-lg bg-myanmar-red flex items-center justify-center text-white shadow-sm shadow-myanmar-red/20 group-hover:bg-myanmar-red-hover transition-colors">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-zinc-900 tracking-tight">
              BurmaVoice
            </span>
            <span className="text-xs font-semibold text-myanmar-gold font-burmese">
              မြန်မာအသံ
            </span>
          </div>
        </div>

        {/* Right: Desktop Navigation, Language Switcher & CTA */}
        <div className="hidden md:flex items-center gap-7">
          <nav className="flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`text-sm transition-colors cursor-pointer ${
                    isActive
                      ? 'text-myanmar-red font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900 font-medium'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 pl-3 border-l border-zinc-200">
            {/* Language Switcher */}
            <button
              onClick={onToggleLanguage}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 transition-colors cursor-pointer"
              title="Switch Language / ဘာသာစကား ပြောင်းရန်"
            >
              <Globe className="w-3.5 h-3.5 text-myanmar-gold" />
              <span className="font-semibold">{language === 'my' ? 'English' : 'မြန်မာ'}</span>
            </button>

            {/* Primary CTA */}
            <button
              onClick={() => handleNav('studio')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-myanmar-red hover:bg-myanmar-red-hover text-white transition-colors cursor-pointer shadow-sm shadow-myanmar-red/20"
            >
              {t.getStarted}
            </button>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={onToggleLanguage}
            className="p-1.5 rounded-md text-xs font-semibold text-zinc-700 border border-zinc-200"
          >
            {language === 'my' ? 'EN' : 'မြန်မာ'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-600 hover:text-zinc-900 cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200 bg-white px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                  isActive ? 'bg-myanmar-red-light text-myanmar-red font-semibold' : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-zinc-100">
            <button
              onClick={() => handleNav('studio')}
              className="w-full py-2.5 rounded-lg text-sm font-medium bg-myanmar-red text-white shadow-sm cursor-pointer"
            >
              {t.getStarted}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
