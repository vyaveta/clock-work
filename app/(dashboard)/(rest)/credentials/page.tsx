import { requireAuth } from '@/lib/auth-utils'
import React from 'react'

const Credentials = async () => {

    await requireAuth()

  return (
    <div>Credentials</div>
  )
}

export default Credentials