'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function iniciarSesionAdmin(password: string) {
  if (!process.env.ADMIN_SECRET || password !== process.env.ADMIN_SECRET) {
    return { error: 'Contraseña incorrecta' }
  }

  cookies().set('admin_session', process.env.ADMIN_SECRET, {
    httpOnly: true,
    sameSite: 'lax',
    secure:   true,
    path:     '/',
    maxAge:   60 * 60 * 24 * 30, // 30 días
  })

  return { error: null }
}

export async function cerrarSesionAdmin() {
  cookies().delete('admin_session')
  redirect('/admin/login')
}
