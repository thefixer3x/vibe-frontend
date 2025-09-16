'use client';

import { useMemo, useState, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BadgeProps } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ServiceStatus, ServiceStatusGrid } from '@/components/services/service-status';
import { useApiServices } from '@/lib/hooks/useApiServices';
import Link from 'next/link';
import {
  Plug,
  Settings,
  Search,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react';

const ALL_SERVICES = ['stripe', 'openai', 'github', 'vercel', 'netlify', 'supabase'] as const;

type ToolItem = {
  name: string;
  configured: boolean;
  valid: boolean;
  keyCount: number;
};

export default function ToolsHubPage() {
  const { services, refreshServices } = useApiServices();
  const [query, setQuery] = useState('');

  const items = useMemo<ToolItem[]>(() => {
    const list = ALL_SERVICES.map((name) => {
      const s = services?.[name as keyof typeof services];
      return {
        name,
        configured: Boolean(s?.isConfigured),
        valid: Boolean(s?.hasValidKey),
        keyCount: s?.keyCount ?? 0,
      };
    });
    return list.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));
  }, [services, query]);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Plug className="h-6 w-6 text-blue-600" />
          <h1 className="text-lg lg:text-2xl font-medium">Tools</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshServices}>
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/secrets">
              <Settings className="h-4 w-4 mr-2" />
              Manage Secrets
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            placeholder="Search tools..."
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="pl-9"
          />
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.name} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium capitalize">{item.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {(() => {
                    const variant: NonNullable<BadgeProps['variant']> = item.valid
                      ? 'default'
                      : item.configured
                      ? 'secondary'
                      : 'destructive';
                    return (
                      <Badge variant={variant}>
                        {item.valid ? 'Configured' : item.configured ? 'Needs Validation' : 'Not Configured'}
                      </Badge>
                    );
                  })()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {item.keyCount} key{item.keyCount === 1 ? '' : 's'} configured
                </div>
                <div className="flex items-center gap-2">
                  {item.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/tools/${item.name}`}>
                    Open <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/dashboard/secrets?service=${item.name}`}>Configure</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-base font-medium mb-3">Connection Status</h2>
        <ServiceStatusGrid services={[...ALL_SERVICES]} showTestButtons />
      </div>
    </section>
  );
}

