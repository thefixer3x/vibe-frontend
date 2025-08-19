'use client';

import { useActionState } from 'react';
import { signIn } from '@/app/(login)/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ActionState = { error?: string; redirect?: string; email?: string };

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    signIn,
    {}
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form action={formAction} className="w-full max-w-sm bg-white border rounded-lg p-6 space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {state?.error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {state.error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={state?.email || ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
