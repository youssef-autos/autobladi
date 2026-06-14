"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/types/database.types"

type Profile = Tables<"profiles">

export type UseUserState = {
  user: User | null
  profile: Profile | null
  loading: boolean
}

export function useUser(): UseUserState {
  const [state, setState] = useState<UseUserState>({
    user: null,
    profile: null,
    loading: true,
  })

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function resolve(user: User | null) {
      let profile: Profile | null = null
      if (user) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()
          profile = (data as Profile | null) ?? null
        } catch {
          profile = null
        }
      }
      if (!cancelled) setState({ user, profile, loading: false })
    }

    // Read the session from local storage — instant, no network round-trip.
    // (getUser() makes a network call that can hang and leave the avatar
    //  stuck on the gray loading placeholder.)
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => resolve(session?.user ?? null))
      .catch(() => {
        if (!cancelled) setState({ user: null, profile: null, loading: false })
      })

    // Safety net: never stay on the loading placeholder forever.
    const timer = setTimeout(() => {
      if (!cancelled) {
        setState((s) => (s.loading ? { ...s, loading: false } : s))
      }
    }, 2500)

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void resolve(session?.user ?? null)
    })

    return () => {
      cancelled = true
      clearTimeout(timer)
      sub.subscription.unsubscribe()
    }
  }, [])

  return state
}
