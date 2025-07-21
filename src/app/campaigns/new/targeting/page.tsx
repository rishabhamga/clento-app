'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function TargetingPage() {
  const router = useRouter()
  
  // Redirect directly to the B2B filters page since it's the only option
  useEffect(() => {
    router.push('/campaigns/new/targeting/b2b-filters')
  }, [router])
  
  // Return null as this page will redirect immediately
  return null
} 