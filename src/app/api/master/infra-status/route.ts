import { getInfraStatus } from '@/repositories/infraStatusRepository'
import { requireMaster } from '@/lib/masterAuth'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const status = await getInfraStatus()
  return NextResponse.json({ status })
}
