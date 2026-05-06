import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingFormClient from './OnboardingForm'

export default async function OnboardingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id, talleres(id, nombre, onboarding_completo)')
    .eq('id', user.id)
    .single()

  let tallerId = ''
  let nombreTaller = ''
  let onboardingCompleto = false

  const raw = usuario?.talleres
  if (raw) {
    const t = Array.isArray(raw) ? raw[0] : raw
    if (t && typeof t === 'object' && 'id' in t) {
      tallerId = (t as { id: string }).id ?? ''
      nombreTaller = (t as { nombre: string }).nombre ?? ''
      onboardingCompleto = (t as { onboarding_completo: boolean }).onboarding_completo ?? false
    }
  }

  if (onboardingCompleto) redirect('/dashboard')

  return <OnboardingFormClient tallerId={tallerId} nombreTaller={nombreTaller} />
}