import { redirect } from 'next/navigation'

// La raíz redirige — el middleware maneja la lógica auth
export default function Home() {
  redirect('/dashboard')
}
