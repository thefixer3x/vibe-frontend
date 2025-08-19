'use client';

import useSWR from 'swr';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AppStoreDashboardPage() {
  const { data, error, isLoading } = useSWR('/api/appstore/apps', fetcher);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Apple App Store Connect</h1>
      <Card>
        <CardHeader>
          <CardTitle>Apps</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center text-gray-500"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading apps…</div>
          )}
          {error && (
            <div className="text-red-600">{error?.message || 'Failed to load apps'}</div>
          )}
          {!isLoading && data?.error && (
            <div className="text-yellow-700">{data.error} (set ENABLE_APPLE_CONNECT=1 and Apple credentials)</div>
          )}
          {!isLoading && data?.data?.data && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Bundle ID</th>
                    <th className="py-2 pr-4">SKU</th>
                    <th className="py-2 pr-4">Platform</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.data.map((app: any) => (
                    <tr key={app.id} className="border-b last:border-none">
                      <td className="py-2 pr-4">{app.attributes?.name}</td>
                      <td className="py-2 pr-4">{app.attributes?.bundleId}</td>
                      <td className="py-2 pr-4">{app.attributes?.sku}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline">{app.attributes?.platform || 'iOS/macOS'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

