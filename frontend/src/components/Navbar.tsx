import React, { useState, useEffect } from 'react';
import { Volume2, Menu, X, Globe, Zap, LogIn, LogOut, User as UserIcon, Plus } from 'lucide-react';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';
import { AuthService } from '../services/auth';
import type { UserResponse } from '../services/api';
import { AuthModal } from './AuthModal';
import { CreditPackagesModal } from './CreditPackagesModal';

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
  const [user, setUser] = useState<UserResponse | null>(AuthService.getUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [packagesModalOpen, setPackagesModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('register');

  const tNav = translations[language].nav;
  const tCredits = translations[language].credits;
  const tAuth = translations[language].auth;

  useEffect(() => {
    // Refresh user state from server if token exists
    AuthService.refresh().then((u) => {
      if (u) setUser(u);
    });

    // Subscribe to real-time auth/credit state changes
    const unsubscribe = AuthService.subscribe((updatedUser) => {
      setUser(updatedUser ? { ...updatedUser } : null);
    });
    return unsubscribe;
  }, []);

  const navItems = [
    { id: 'home', label: tNav.home },
    { id: 'studio', label: tNav.studio },
    { id: 'voices', label: tNav.voices },
    { id: 'about', label: tNav.about },
    ...(user?.is_admin ? [{ id: 'admin', label: language === 'my' ? '🛡️ အက်ဒမင်' : '🛡️ Admin' }] : []),
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Left: Brand Logo & Title */}
          <div 
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-myanmar-red to-myanmar-red-hover flex items-center justify-center text-white shadow-sm shadow-myanmar-red/30 group-hover:scale-105 transition-all border border-amber-500/20">
              <Volume2 className="w-4 h-4 text-amber-200" />
            </div>
            <div className="flex flex-col text-left leading-tight">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-zinc-900 tracking-tight">
                  BurmeseATAN
                </span>
                <span className="text-[11px] font-bold text-amber-600 font-burmese tracking-wide">
                  မြန်မာအသံ
                </span>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-semibold hidden sm:inline">
                Myanmar AI Speech Studio
              </span>
            </div>
          </div>

          {/* Center/Right: Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-5">
            <nav className="flex items-center gap-4">
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
          </div>

          {/* Right Action Cluster: Credits, Buy Credits, Auth & Language */}
          <div className="hidden md:flex items-center gap-3">
            {/* Credit Balance Indicator */}
            {user ? (
              <div className="flex items-center gap-2">
                <div 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs font-bold font-burmese shadow-2xs"
                  title="Your current credit balance"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>{user.credits_balance} Credits</span>
                  {user.is_admin ? (
                    <span className="ml-1 px-1.5 py-0.2 rounded-md bg-amber-500 text-zinc-950 text-[10px] uppercase tracking-wider font-black">
                      ADMIN
                    </span>
                  ) : user.is_premium ? (
                    <span className="ml-1 px-1.5 py-0.2 rounded-md bg-amber-200 text-amber-900 text-[10px] uppercase tracking-wider font-extrabold">
                      PRO
                    </span>
                  ) : null}
                </div>

                {/* Buy Credits CTA Button */}
                <button
                  type="button"
                  onClick={() => setPackagesModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 text-xs font-bold font-burmese transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700" />
                  <span>{tCredits.buyCredits}</span>
                </button>

                {/* User menu / logout */}
                <div className="flex items-center gap-1.5 pl-1">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 text-xs font-bold uppercase" title={user.email}>
                    {user.username.charAt(0) || <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title={tAuth.logoutBtn}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthInitialMode('register');
                    setAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300/80 text-amber-900 text-xs font-bold font-burmese transition-all cursor-pointer shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>⚡ 5 Free Credits</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthInitialMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 transition-colors cursor-pointer font-burmese"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{tAuth.loginBtn}</span>
                </button>
              </div>
            )}

            {/* Language Switcher */}
            <div className="pl-2 border-l border-zinc-200">
              <button
                onClick={onToggleLanguage}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-amber-50/50 border border-zinc-200 hover:border-amber-300/60 transition-all cursor-pointer"
                title="Switch Language / ဘာသာစကား ပြောင်းရန်"
              >
                <Globe className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-burmese">{language === 'my' ? 'EN' : 'မြန်မာ'}</span>
              </button>
            </div>

            {/* Studio CTA */}
            <button
              onClick={() => handleNav('studio')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-myanmar-red hover:bg-myanmar-red-hover text-white transition-all cursor-pointer shadow-sm shadow-myanmar-red/25 hover:shadow-myanmar-red/35 active:scale-[0.98] font-burmese"
            >
              {tNav.getStarted}
            </button>
          </div>

          {/* Mobile Header Controls */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <div 
                onClick={() => setPackagesModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                <span>{user.credits_balance}</span>
              </div>
            )}
            <button
              onClick={onToggleLanguage}
              className="px-2 py-1 rounded-lg text-xs font-bold text-zinc-700 border border-zinc-200 font-burmese"
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

        {/* Shwe-Ruby Gradient Line */}
        <div className="h-[1.5px] w-full bg-shwe-ruby-line opacity-80" />

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-200 bg-white/98 px-4 py-4 space-y-3 bg-acheik-lines">
            {/* User status in mobile */}
            {user ? (
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-zinc-800">{user.username}</div>
                  <div className="text-[11px] text-zinc-500">{user.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold">
                    ⚡ {user.credits_balance}
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setPackagesModalOpen(true);
                    }}
                    className="px-2 py-1 rounded-lg bg-amber-500 text-white text-xs font-bold"
                  >
                    + Buy
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthInitialMode('register');
                    setAuthModalOpen(true);
                  }}
                  className="py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold font-burmese text-center"
                >
                  ⚡ Register (+5 Credits)
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthInitialMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="py-2.5 rounded-xl bg-zinc-100 text-zinc-800 text-xs font-bold font-burmese text-center"
                >
                  {tAuth.loginBtn}
                </button>
              </div>
            )}

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
                {tNav.getStarted}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        language={language}
        initialMode={authInitialMode}
        onSuccess={() => setUser(AuthService.getUser())}
      />

      {/* Credit Packages Modal */}
      <CreditPackagesModal
        isOpen={packagesModalOpen}
        onClose={() => setPackagesModalOpen(false)}
        language={language}
        onRequireAuth={() => {
          setAuthInitialMode('register');
          setAuthModalOpen(true);
        }}
        onSuccess={() => setUser(AuthService.getUser())}
      />
    </>
  );
};
