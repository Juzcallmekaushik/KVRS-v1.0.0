'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

export default function ProtectedLayout({ children }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/signin')
      } else {
        setLoading(false)
      }
    }

    checkSession()
  }, [router, supabase])

  if (loading) return <p className="p-8">Loading...</p>
  return <>{children}</>
}
