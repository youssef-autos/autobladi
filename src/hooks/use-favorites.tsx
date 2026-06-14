"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { createClient } from "@/lib/supabase/client"

type FavoritesContextValue = {
  /** True once the initial favorites set has been resolved. */
  ready: boolean
  isAuthed: boolean
  isFavorite: (annonceId: string) => boolean
  /**
   * Toggles a favorite. Returns the new state (true = added, false = removed),
   * or null when the visitor isn't logged in (caller shows a login prompt).
   */
  toggle: (annonceId: string) => Promise<boolean | null>
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

/**
 * Holds the current user's favorited annonce ids and exposes an optimistic
 * toggle. Reads/writes go straight to the `favorites` table — RLS scopes every
 * row to `auth.uid()`, so a single client query is both correct and safe.
 */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient())
  const [ids, setIds] = useState<Set<string>>(() => new Set())
  const [ready, setReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  // Mirror of `ids` so `toggle` can read the latest set without re-creating.
  const idsRef = useRef(ids)
  useEffect(() => {
    idsRef.current = ids
  }, [ids])
  const busy = useRef<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false

    async function loadFor(uid: string | null) {
      setUserId(uid)
      if (!uid) {
        setIds(new Set())
        setReady(true)
        return
      }
      const { data } = await supabase
        .from("favorites")
        .select("annonce_id")
        .eq("user_id", uid)
      if (cancelled) return
      setIds(
        new Set(
          (data ?? []).map((r) => (r as { annonce_id: string }).annonce_id),
        ),
      )
      setReady(true)
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => loadFor(session?.user?.id ?? null))
      .catch(() => {
        if (!cancelled) setReady(true)
      })

    // Keep in sync with login / logout.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadFor(session?.user?.id ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase])

  const isFavorite = useCallback(
    (annonceId: string) => ids.has(annonceId),
    [ids],
  )

  const toggle = useCallback(
    async (annonceId: string): Promise<boolean | null> => {
      if (!userId) return null
      if (busy.current.has(annonceId)) return idsRef.current.has(annonceId)
      busy.current.add(annonceId)

      const wasFav = idsRef.current.has(annonceId)
      // Optimistic flip.
      setIds((prev) => {
        const next = new Set(prev)
        if (wasFav) next.delete(annonceId)
        else next.add(annonceId)
        return next
      })

      try {
        if (wasFav) {
          const { error } = await supabase
            .from("favorites")
            .delete()
            .eq("user_id", userId)
            .eq("annonce_id", annonceId)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from("favorites")
            .insert({ user_id: userId, annonce_id: annonceId } as never)
          if (error) throw error
        }
        return !wasFav
      } catch (err) {
        // Revert on failure.
        setIds((prev) => {
          const next = new Set(prev)
          if (wasFav) next.add(annonceId)
          else next.delete(annonceId)
          return next
        })
        throw err
      } finally {
        busy.current.delete(annonceId)
      }
    },
    [supabase, userId],
  )

  const value = useMemo<FavoritesContextValue>(
    () => ({ ready, isAuthed: !!userId, isFavorite, toggle }),
    [ready, userId, isFavorite, toggle],
  )

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext)
  if (!ctx) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return ctx
}
