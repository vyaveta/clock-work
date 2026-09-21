import { requireAuth } from '@/lib/auth-utils'
import React from 'react'

const WorkFlows = async () => {

    await requireAuth()

  return (
    <div>WorkFlows</div>
  )
}

export default WorkFlows