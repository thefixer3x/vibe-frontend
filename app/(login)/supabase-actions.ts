'use server'

// import { revalidatePath } from 'next/cache'
// import { redirect } from 'next/navigation'
// TODO: Re-enable when Supabase integration is needed
// import { createClient } from '@/lib/supabase/server'

// DISABLED: Supabase authentication functions for future integration
// Current app uses custom JWT auth in app/(login)/actions.ts

export async function signIn(_formData: FormData) {
  // TODO: Implement Supabase auth when ready
  return { error: 'Supabase authentication is currently disabled. Use custom auth instead.' }
  
  /*
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
  */
}

export async function signUp(_formData: FormData) {
  // TODO: Implement Supabase auth when ready
  return { error: 'Supabase authentication is currently disabled. Use custom auth instead.' }
  
  /*
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
  */
}

export async function signOut() {
  // TODO: Implement Supabase auth when ready
  return { error: 'Supabase authentication is currently disabled. Use custom auth instead.' }
  
  /*
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/sign-in')
  */
}
