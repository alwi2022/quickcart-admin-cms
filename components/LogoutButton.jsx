'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutButton({ className }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function onLogout() {
    try {
      setPending(true)
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      router.replace('/login')
      router.refresh()
      setPending(false)
    }
  }

  return (
    <button onClick={onLogout} disabled={pending} className={className}>
      {pending ? 'Keluar...' : 'Keluar'}
    </button>
  )
}
