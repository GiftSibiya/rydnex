import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, AuthOrganisation, AuthUserRole, LoginResponseData, RegistrationResponseData } from '@/types/Types';

interface AuthState {
  // User fields
  user: AuthUser | null;
  organisation: AuthOrganisation | null;
  accessToken: string;

  // Legacy convenience accessors (kept for backward compat)
  user_id: number;
  user_name: string;
  user_email: string;
  user_last_name: string;
  user_phone: string;
  user_idNum: string;
  company_id: number;

  // Actions
  setAuthFromLogin: (data: LoginResponseData) => void;
  setAuthFromRegistration: (data: RegistrationResponseData) => void;
  updateUser: (userData: Partial<AuthUser>) => void;
  setUserId: (id: number) => void;
  setUserName: (name: string) => void;
  setUserLastName: (last_name: string) => void;
  setUserEmail: (email: string) => void;
  setUserPhone: (phone: string) => void;
  setUserIDNum: (idNum: string) => void;
  setCompanyId: (company_id: number) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => Promise<void>;

  // Derived helpers
  isAdmin: () => boolean;
  getRoles: () => AuthUserRole[];

  // Data fetches
  updateUserDetails: (user_id: number) => void;
}

const initialState = {
  user: null as AuthUser | null,
  organisation: null as AuthOrganisation | null,
  accessToken: '',
  user_id: 0,
  user_name: '',
  user_email: '',
  user_last_name: '',
  user_phone: '',
  user_idNum: '',
  company_id: 0,
};

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Primary login action — stores everything from the API response
      setAuthFromLogin: (data: LoginResponseData) => {
        const { user, accessToken, organisation } = data;
        set({
          user,
          accessToken,
          organisation: organisation ?? null,
          // Keep legacy fields in sync
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          user_phone: user.phone ?? '',
        });
      },

      // Registration action — stores data from the registration response
      setAuthFromRegistration: (data: RegistrationResponseData) => {
        const { user, accessToken } = data;
        set({
          user,
          accessToken,
          organisation: null,
          // Keep legacy fields in sync
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          user_phone: user.phone ?? '',
          user_last_name: user.last_name ?? '',
        });
      },

      // Update user action — updates the user object in the store
      updateUser: (userData: Partial<AuthUser>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({
            user: updatedUser,
            // Keep legacy fields in sync
            user_name: updatedUser.name,
            user_email: updatedUser.email,
            user_phone: updatedUser.phone ?? '',
            user_last_name: updatedUser.last_name ?? '',
          });
        }
      },

      // Legacy setters
      setUserId: (user_id) => set({ user_id }),
      setUserEmail: (user_email) => set({ user_email }),
      setUserName: (user_name) => set({ user_name }),
      setUserLastName: (user_last_name) => set({ user_last_name }),
      setUserPhone: (user_phone) => set({ user_phone }),
      setUserIDNum: (user_idNum) => set({ user_idNum }),
      setCompanyId: (company_id) => set({ company_id }),
      setAccessToken: (accessToken) => set({ accessToken }),

      // Helpers
      isAdmin: () => get().user?.roles?.some(r => r.role_key === 'admin') ?? false,
      getRoles: () => get().user?.roles ?? [],

      // Data fetches
      updateUserDetails: async (user_id: number) => {
        try {
          // Users are managed by the auth subsystem, not database tables.
          // Keep legacy fields in sync from the already-authenticated user payload.
          const currentUser = get().user;
          if (currentUser && currentUser.id === user_id) {
            set({
              user_id: currentUser.id,
              user_name: currentUser.name,
              user_email: currentUser.email,
              user_phone: currentUser.phone ?? '',
            });
          }
        } catch (error) {
          console.log('updateUserDetails error:', error);
        }
      },

      logout: async () => {
        try {
          const { authService } = await import('@/backend/services/AuthService');
          await authService.logout();
        } catch {
          // Proceed with local logout regardless of API result
        }
        try {
          useAuthStore.persist.clearStorage();
        } catch {
          await AsyncStorage.removeItem('user-store');
        }
        set({ ...initialState });
      },
    }),
    {
      name: 'user-store',
      storage: {
        getItem: async (key) => {
          const item = await AsyncStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        },
        setItem: async (key, value) => {
          await AsyncStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: async (key) => {
          await AsyncStorage.removeItem(key);
        },
      },
    }
  )
);

export default useAuthStore;
