'use client';

import { useMemo } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BadgeProps } from '@/components/ui/badge';
import { ServiceStatus } from '@/components/services/service-status';
import { useApiServices } from '@/lib/hooks/useApiServices';
import { ChevronLeft, Settings } from 'lucide-react';

export default function ToolDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { services } = useApiServices();
  const service = String(params?.service || '').toLowerCase();

  const info = useMemo(() => {
    const s = services?.[service as keyof typeof services];
    return {
      configured: Boolean(s?.isConfigured),
      valid: Boolean(s?.hasValidKey),
      keyCount: s?.keyCount ?? 0,
    };
  }, [services, service]);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/tools">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </Button>
          <h1 className="text-lg lg:text-2xl font-medium capitalize">{service}</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/secrets?service=${service}`}>
            <Settings className="h-4 w-4 mr-2" /> Configure
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const variant: NonNullable<BadgeProps['variant']> = info.valid
                      ? 'default'
                      : info.configured
                      ? 'secondary'
                      : 'destructive';
                    return (
                      <Badge variant={variant}>
                        {info.valid ? 'Configured' : info.configured ? 'Needs Validation' : 'Not Configured'}
                      </Badge>
                    );
                  })()}
                  <span className="text-xs text-muted-foreground">
                    {info.keyCount} key{info.keyCount === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceStatus serviceName={service} showTestButton />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" variant="outline" asChild className="w-full">
                <Link href={`/dashboard/secrets?service=${service}`}>Manage Keys</Link>
              </Button>
              <Button size="sm" variant="outline" asChild className="w-full">
                <Link href="/dashboard/apis">API Warehouse</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

