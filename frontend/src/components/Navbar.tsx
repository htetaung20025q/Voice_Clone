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
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo & Title with Cultural Details */}
        <div 
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-myanmar-red to-myanmar-red-hover flex items-center justify-center text-white shadow-sm shadow-myanmar-red/30 group-hover:scale-105 transition-all border border-amber-500/20">
            <Volume2 className="w-4 h-4 text-amber-200" />
          </div>
          <div className="flex flex-col text-left leading-tight">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-zinc-900 tracking-tight">
                BurmaVoice
              </span>
              <span className="text-[11px] font-bold text-amber-600 font-burmese tracking-wide">
                မြန်မာအသံ
              </span>
            </div>
            <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-semibold">
              Myanmar AI Speech Studio
            </span>
          </div>
        </div>

        {/* Right: Desktop Navigation, Language Switcher & CTA */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-5">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`text-sm transition-all cursor-pointer font-burmese px-2.5 py-1.5 rounded-lg relative ${
                    isActive
                      ? 'text-myanmar-red font-bold bg-myanmar-red-light/60'
                      : 'text-zinc-600 hover:text-zinc-900 font-medium hover:bg-zinc-50'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-myanmar-red rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 pl-3 border-l border-zinc-200">
            {/* Language Switcher with Subtle Gold Leaf Accent */}
            <button
              onClick={onToggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-amber-50/50 border border-zinc-200 hover:border-amber-300/60 transition-all cursor-pointer"
              title="Switch Language / ဘာသာစကား ပြောင်းရန်"
            >
              <Globe className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-burmese">{language === 'my' ? 'English' : 'မြန်မာ'}</span>
            </button>

            {/* Primary CTA */}
            <button
              onClick={() => handleNav('studio')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-myanmar-red hover:bg-myanmar-red-hover text-white transition-all cursor-pointer shadow-sm shadow-myanmar-red/25 hover:shadow-myanmar-red/35 active:scale-[0.98] font-burmese"
            >
              {t.getStarted}
            </button>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={onToggleLanguage}
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-700 border border-zinc-200 font-burmese"
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

      {/* Subtle Myanmar Hairline Shwe-Ruby Gradient Bottom Border */}
      <div className="h-[1.5px] w-full bg-shwe-ruby-line opacity-80" />

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200 bg-white/98 px-4 py-4 space-y-2 bg-acheik-lines">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer font-burmese ${
                  isActive ? 'bg-myanmar-red-light text-myanmar-red font-bold' : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-zinc-100">
            <button
              onClick={() => handleNav('studio')}
              className="w-full py-3 rounded-xl text-sm font-bold bg-myanmar-red text-white shadow-sm cursor-pointer font-burmese"
            >
              {t.getStarted}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
