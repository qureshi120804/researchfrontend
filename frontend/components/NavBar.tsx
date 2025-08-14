'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

export default function NavBar({ currentPage, onNavigate }: { currentPage: string, onNavigate: (p: string)=>void }) {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <nav className="w-full h-16 border-b bg-white/70 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4">
        <div className="text-xl font-semibold tracking-tight">Research Assistant AI</div>
        <div className="flex items-center gap-3">
          <button className={`px-3 py-1 rounded-md ${currentPage==='search'?'bg-neutral-900 text-white':'hover:bg-neutral-100'}`} onClick={()=>onNavigate('search')}>Search</button>
          <button className={`px-3 py-1 rounded-md ${currentPage==='results'?'bg-neutral-900 text-white':'hover:bg-neutral-100'}`} onClick={()=>onNavigate('results')}>Results</button>
          {email ? (
            <button
              onClick={async () => { await supabase.auth.signOut() }}
              className="ml-2 px-3 py-1 rounded-md border hover:bg-neutral-50"
              title={email}
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="ml-2 px-3 py-1 rounded-md border hover:bg-neutral-50">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
