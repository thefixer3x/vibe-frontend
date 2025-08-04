import { Suspense } from 'react';
import { SupabaseLogin } from '../supabase-login';

export default function SignInPage() {
  return (
    <Suspense>
      <SupabaseLogin mode="signin" />
    </Suspense>
  );
}
