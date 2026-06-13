import { cookies } from 'next/headers'
import type { Lang } from './i18n'

export async function getPortalLang(): Promise<Lang> {
  const cookieStore = await cookies()
  const lang = cookieStore.get('portal_lang')?.value
  return (lang === 'pt' || lang === 'en') ? lang as Lang : 'pt'
}
