import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Volume2, 
  Zap, 
  Search, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Loader2,
  TrendingUp,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { VoiceStudioAPI } from '../services/api';
import type { 
  AdminStatsResponse, 
  AdminUserItem, 
  AdminGenerationItem 
} from '../services/api';
import { AuthService } from '../services/auth';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface AdminDashboardProps {
  language: Language;
  onNavigateToStudio?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  language,
  onNavigateToStudio
}) => {
  const t = translations[language].admin;
  const token = AuthService.getToken();
  const currentUser = AuthService.getUser();

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'users' | 'generations'>('users');
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [generations, setGenerations] = useState<AdminGenerationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Credit Adjustment Modal state
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState<string>('Loyalty bonus');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);
  const [adjustmentSuccessMsg, setAdjustmentSuccessMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const [statsData, usersData, gensData] = await Promise.all([
        VoiceStudioAPI.getAdminStats(token),
        VoiceStudioAPI.getAdminUsers(token, searchQuery),
        VoiceStudioAPI.getAdminGenerations(token, 30)
      ]);
      setStats(statsData);
      setUsers(usersData);
      setGenerations(gensData);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setError(err?.message || 'Failed to fetch administrative data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRefreshing(true);
    fetchData();
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser || !token) return;
    setIsSubmittingAdjustment(true);
    try {
      const res = await VoiceStudioAPI.adjustUserCredits(
        selectedUser.id,
        adjustAmount,
        adjustReason,
        token
      );
      setAdjustmentSuccessMsg(res.message);
      setTimeout(() => {
        setAdjustmentSuccessMsg(null);
        setSelectedUser(null);
        fetchData();
      }, 1200);
    } catch (err: any) {
      alert(err?.message || 'Failed to adjust credits');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  const handleTogglePremium = async (targetUser: AdminUserItem) => {
    if (!token) return;
    try {
      await VoiceStudioAPI.toggleUserPremium(targetUser.id, token);
      fetchData();
    } catch (err: any) {
      alert(err?.message || 'Failed to toggle premium');
    }
  };

  if (!currentUser?.is_admin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-zinc-200 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-myanmar-red/10 text-myanmar-red flex items-center justify-center">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 font-burmese">Access Restricted</h2>
        <p className="text-xs text-zinc-600 font-burmese">
          You must be logged into an administrator account to view this dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8 text-left">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold font-burmese">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.adminBadge}</span>
            <span className="text-zinc-400">•</span>
            <span>All Features & Voices Unlocked</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-burmese">
            {t.dashboardTitle}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 font-burmese max-w-xl">
            {t.dashboardSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10 shrink-0">
          {onNavigateToStudio && (
            <button
              onClick={onNavigateToStudio}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold font-burmese transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-zinc-950" />
              <span>Voice Studio (Admin Mode)</span>
            </button>
          )}
          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchData();
            }}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-burmese flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="p-12 text-center text-zinc-400 font-burmese flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span>Loading administrative data...</span>
        </div>
      )}

      {/* Stats Cards Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-bold uppercase tracking-wider font-burmese">{t.statsUsers}</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-zinc-900">{stats.total_users}</div>
            <div className="text-[11px] text-zinc-400 font-burmese">Registered platform accounts</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-bold uppercase tracking-wider font-burmese">{t.statsGenerations}</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-zinc-900">{stats.total_generations}</div>
            <div className="text-[11px] text-zinc-400 font-burmese">Gemini neural speech audios</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-bold uppercase tracking-wider font-burmese">{t.statsCredits}</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap className="w-4 h-4 fill-amber-500" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-900">⚡ {stats.total_credits_balance.toLocaleString()}</div>
            <div className="text-[11px] text-zinc-400 font-burmese">Active balance across accounts</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-bold uppercase tracking-wider font-burmese">{t.statsRevenue}</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-zinc-900">{stats.total_revenue_mmk.toLocaleString()} MMK</div>
            <div className="text-[11px] text-zinc-400 font-burmese">{stats.total_payments_count} paid packages</div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-burmese transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.tabUsers}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
            {users.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('generations')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-burmese transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'generations'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{t.tabGenerations}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
            {generations.length}
          </span>
        </button>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-burmese"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold font-burmese transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-burmese">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Role / Tier</th>
                    <th className="p-3.5">Balance</th>
                    <th className="p-3.5">Joined</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="p-3.5 text-zinc-400 font-mono">#{u.id}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-zinc-900">{u.username}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{u.email}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {u.is_admin && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase">
                              Admin
                            </span>
                          )}
                          {u.is_premium ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                              Pro / Premium
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-medium">
                              Free
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-amber-900 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                          ⚡ {u.credits_balance}
                        </span>
                      </td>
                      <td className="p-3.5 text-zinc-500 text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setAdjustAmount(50);
                            setAdjustReason('Admin bonus adjustment');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          ⚡ {t.adjustCreditsBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePremium(u)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium transition-colors cursor-pointer"
                          title="Toggle Premium"
                        >
                          {u.is_premium ? 'Revoke Pro' : 'Grant Pro'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-400">
                        No users found matching query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: System Generations Feed */}
      {activeTab === 'generations' && (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-burmese">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Voice / Persona</th>
                  <th className="p-3.5">Text Preview</th>
                  <th className="p-3.5">Credits</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {generations.map((g) => (
                  <tr key={g.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="p-3.5 text-zinc-400 font-mono">#{g.id}</td>
                    <td className="p-3.5 font-medium text-zinc-900">
                      {g.username || `User #${g.user_id}`}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-zinc-800 uppercase tracking-wide">{g.voice}</span>
                      <span className="text-zinc-400 text-[10px] ml-1">({g.style})</span>
                    </td>
                    <td className="p-3.5 text-zinc-600 max-w-xs truncate" title={g.text}>
                      {g.text}
                    </td>
                    <td className="p-3.5 font-bold text-amber-900">
                      ⚡ {g.credits_used}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        g.status === 'SUCCESS' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-zinc-400 text-[11px] whitespace-nowrap">
                      {g.created_at ? new Date(g.created_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
                {generations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-400">
                      No generation records found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Credits Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200 p-6 sm:p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-extrabold">
                <Zap className="w-5 h-5 fill-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 font-burmese">
                  {t.adjustCreditsTitle}
                </h3>
                <p className="text-xs text-zinc-500 font-burmese">
                  Target user: <strong className="text-zinc-800">{selectedUser.username}</strong> ({selectedUser.email})
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex justify-between text-xs font-burmese">
              <span className="text-zinc-500">Current Balance:</span>
              <span className="font-bold text-amber-900">⚡ {selectedUser.credits_balance} Credits</span>
            </div>

            <div className="space-y-3 font-burmese">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  {t.adjustAmountLabel}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustAmount(50)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 text-xs font-bold hover:bg-zinc-200"
                  >
                    +50
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustAmount(100)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 text-xs font-bold hover:bg-zinc-200"
                  >
                    +100
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustAmount(500)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 text-xs font-bold hover:bg-zinc-200"
                  >
                    +500
                  </button>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  {t.adjustReasonLabel}
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="e.g. Compensation, Campaign bonus"
                />
              </div>
            </div>

            {adjustmentSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-burmese flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{adjustmentSuccessMsg}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 font-burmese"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdjustCredits}
                disabled={isSubmittingAdjustment}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold font-burmese flex items-center gap-1.5 shadow-xs"
              >
                {isSubmittingAdjustment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>{t.confirmAdjust}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
