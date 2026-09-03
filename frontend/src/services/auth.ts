/**
 * Authentication and User State Management.
 * Manages JWT tokens, current user profile, credits balance, and state change listeners.
 */

import { VoiceStudioAPI } from './api';
import type { UserResponse } from './api';

const TOKEN_KEY = 'burmeseatan_auth_token';
const USER_KEY = 'burmeseatan_user_profile';

type AuthListener = (user: UserResponse | null) => void;
const listeners: Set<AuthListener> = new Set();

export class AuthService {
  private static currentUser: UserResponse | null = null;

  /**
   * Initialize state from localStorage.
   */
  static init(): UserResponse | null {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch {
      this.currentUser = null;
    }
    return this.currentUser;
  }

  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static getUser(): UserResponse | null {
    if (!this.currentUser) {
      this.init();
    }
    return this.currentUser;
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static subscribe(listener: AuthListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  private static notify() {
    for (const listener of listeners) {
      listener(this.currentUser);
    }
  }

  /**
   * Update stored user & notify subscribers.
   */
  static setUser(user: UserResponse | null, token?: string | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }

    if (token !== undefined) {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    this.notify();
  }

  /**
   * Register a new user (receives 5 FREE credits).
   */
  static async register(username: string, email: string, password: string): Promise<UserResponse> {
    const res = await VoiceStudioAPI.register(username, email, password);
    this.setUser(res.user, res.token);
    return res.user;
  }

  /**
   * Login existing user.
   */
  static async login(email: string, password: string): Promise<UserResponse> {
    const res = await VoiceStudioAPI.login(email, password);
    this.setUser(res.user, res.token);
    return res.user;
  }

  /**
   * Logout user.
   */
  static logout() {
    this.setUser(null, null);
  }

  /**
   * Refresh current user profile and credit balance from server.
   */
  static async refresh(): Promise<UserResponse | null> {
    const token = this.getToken();
    if (!token) {
      this.setUser(null);
      return null;
    }
    try {
      const user = await VoiceStudioAPI.getMe(token);
      this.setUser(user);
      return user;
    } catch {
      // If token expired or invalid, clear
      this.logout();
      return null;
    }
  }

  /**
   * Update local credit balance directly (e.g., after synthesis).
   */
  static updateCredits(newBalance: number) {
    if (this.currentUser) {
      this.currentUser = {
        ...this.currentUser,
        credits_balance: newBalance
      };
      localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
      this.notify();
    }
  }
}

// Auto-initialize on import
AuthService.init();
