'use client';

import { UnifiedPlatformDashboard } from '@/components/dashboard/unified-platform-dashboard';

export default function OverviewPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <UnifiedPlatformDashboard />
    </section>
  );
}