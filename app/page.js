'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/register')
      } else {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  if (loading) return null

  return (
    <div className="flex justify-center items-center min-h-screen bg-black text-white">
      
    </div>
  )
}
