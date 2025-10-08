'use client';

import useSWR from 'swr';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AppStoreDashboardPage() {
  const health = useSWR('/api/appstore/health', fetcher);
  const apps = useSWR('/api/appstore/apps', fetcher);
  const builds = useSWR('/api/appstore/builds', fetcher);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const betaGroups = useSWR(
    () => (selectedAppId ? `/api/appstore/apps/${selectedAppId}/beta-groups` : null),
    fetcher
  );

  const appOptions = useMemo(() => {
    return apps.data?.data?.data?.map((a: any) => ({ id: a.id, name: a.attributes?.name })) || [];
  }, [apps.data]);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg lg:text-2xl font-medium">Apple App Store Connect</h1>
        <div className="flex items-center gap-2">
          {health.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {health.data && (
            <Badge 
              variant={health.data.status === 'healthy' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {health.data.status === 'healthy' ? '✅ Connected' : '❌ Error'}
            </Badge>
          )}
          {health.error && (
            <Badge variant="destructive" className="text-xs">
              ❌ Connection Failed
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="apps">
        <TabsList>
          <TabsTrigger value="apps">Apps</TabsTrigger>
          <TabsTrigger value="builds">Builds</TabsTrigger>
          <TabsTrigger value="testflight">TestFlight</TabsTrigger>
        </TabsList>

        <TabsContent value="apps">
          <Card>
            <CardHeader>
              <CardTitle>Apps</CardTitle>
            </CardHeader>
            <CardContent>
              {apps.isLoading && (
                <div className="flex items-center text-gray-500"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading apps…</div>
              )}
              {apps.error && (
                <div className="text-red-600">{apps.error?.message || 'Failed to load apps'}</div>
              )}
              {!apps.isLoading && apps.data?.error && (
                <div className="text-yellow-700">{apps.data.error} (set ENABLE_APPLE_CONNECT=1 and Apple credentials)</div>
              )}
              {!apps.isLoading && apps.data?.data?.data && (
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
                      {apps.data.data.data.map((app: any) => (
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
        </TabsContent>

        <TabsContent value="builds">
          <Card>
            <CardHeader>
              <CardTitle>Builds</CardTitle>
            </CardHeader>
            <CardContent>
              {builds.isLoading && (
                <div className="flex items-center text-gray-500"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading builds…</div>
              )}
              {builds.error && (
                <div className="text-red-600">{builds.error?.message || 'Failed to load builds'}</div>
              )}
              {!builds.isLoading && builds.data?.error && (
                <div className="text-yellow-700">{builds.data.error}</div>
              )}
              {!builds.isLoading && builds.data?.data?.data && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 pr-4">Version</th>
                        <th className="py-2 pr-4">Build #</th>
                        <th className="py-2 pr-4">Processing State</th>
                        <th className="py-2 pr-4">Min OS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {builds.data.data.data.map((b: any) => (
                        <tr key={b.id} className="border-b last:border-none">
                          <td className="py-2 pr-4">{b.attributes?.version}</td>
                          <td className="py-2 pr-4">{b.attributes?.buildNumber}</td>
                          <td className="py-2 pr-4">{b.attributes?.processingState}</td>
                          <td className="py-2 pr-4">{b.attributes?.minOsVersion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testflight">
          <Card>
            <CardHeader>
              <CardTitle>TestFlight Beta Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 max-w-sm">
                <Select onValueChange={(v) => setSelectedAppId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an app" />
                  </SelectTrigger>
                  <SelectContent>
                    {appOptions.map((o: any) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!selectedAppId && (
                <div className="text-gray-500">Select an app to view beta groups.</div>
              )}

              {selectedAppId && betaGroups.isLoading && (
                <div className="flex items-center text-gray-500"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading beta groups…</div>
              )}

              {selectedAppId && betaGroups.error && (
                <div className="text-red-600">{betaGroups.error?.message || 'Failed to load beta groups'}</div>
              )}

              {selectedAppId && !betaGroups.isLoading && betaGroups.data?.data?.data && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Is Public</th>
                        <th className="py-2 pr-4">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {betaGroups.data.data.data.map((g: any) => (
                        <tr key={g.id} className="border-b last:border-none">
                          <td className="py-2 pr-4">{g.attributes?.name}</td>
                          <td className="py-2 pr-4">{String(g.attributes?.isPublic)}</td>
                          <td className="py-2 pr-4">{g.attributes?.createdDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
