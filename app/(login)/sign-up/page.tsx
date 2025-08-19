import { Suspense } from 'react';
import { SupabaseLogin } from '../supabase-login';

export default function SignUpPage() {
  return (
    <Suspense>
      <SupabaseLogin mode="signup" />
    </Suspense>
  );
}
