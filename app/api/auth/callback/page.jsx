'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

export default function CallbackPage() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState(0)

  useEffect(() => {
    const runSequence = async () => {
      setStep(1)
      await new Promise((res) => setTimeout(res, 1000))
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      setStep(2)
      await new Promise((res) => setTimeout(res, 1200))
      setStep(3)
      await new Promise((res) => setTimeout(res, 1000))

      if (session) {
        router.push('/')
      } else {
        console.error('Auth error:', error)
        router.push('/signin')
      }
    }

    runSequence()
  }, [router, supabase])

  const steps = [
    'Authenticating your account...',
    'Creating your digital ID...',
    'Finalizing registration...',
    'Redirecting you now 🚀',
  ]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-8 transition-all duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-wide">Hold on...</h1>
        <p className="text-lg text-gray-300">{steps[step]}</p>

        <div className="mt-8">
          <div className="w-48 h-2 bg-gray-800 rounded overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-700 ease-in-out"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
