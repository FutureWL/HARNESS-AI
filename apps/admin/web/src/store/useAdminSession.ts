import { create } from 'zustand'

import type { AdminProfile, LoginResponse } from '@/lib/admin-api'

const SESSION_KEY = 'harness-admin-session'

type AdminSessionState = {
  token: string | null
  profile: AdminProfile | null
  hydrated: boolean
  hydrate: () => void
  setSession: (payload: LoginResponse) => void
  clearSession: () => void
}

function persistSession(token: string, profile: AdminProfile) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, profile }))
}

export const useAdminSession = create<AdminSessionState>((set) => ({
  token: null,
  profile: null,
  hydrated: false,
  hydrate: () => {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) {
      set({ hydrated: true })
      return
    }

    try {
      const parsed = JSON.parse(raw) as { token: string; profile: AdminProfile }
      set({
        token: parsed.token,
        profile: parsed.profile,
        hydrated: true,
      })
    } catch {
      localStorage.removeItem(SESSION_KEY)
      set({ token: null, profile: null, hydrated: true })
    }
  },
  setSession: (payload) => {
    persistSession(payload.accessToken, payload.profile)
    set({
      token: payload.accessToken,
      profile: payload.profile,
      hydrated: true,
    })
  },
  clearSession: () => {
    localStorage.removeItem(SESSION_KEY)
    set({
      token: null,
      profile: null,
      hydrated: true,
    })
  },
}))
