'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/dashboard/overview');
  }, [router]);
  
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-center h-64">
        <p>Redirecting to dashboard overview...</p>
      </div>
    </section>
  );
}
