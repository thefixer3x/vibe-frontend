'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { memoryClient, MemoryStats, Memory } from '@/lib/memory/client';
import { toast } from 'sonner';

interface MemoryDashboardProps {
  onStatsUpdate?: (stats: MemoryStats) => void;
}

export function MemoryDashboard({ onStatsUpdate }: MemoryDashboardProps) {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [recentMemories, setRecentMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const loadDashboardData = async () => {
    setRefreshing(true);
    try {
      // Load stats
      const memoryStats = await memoryClient.getMemoryStats();
      setStats(memoryStats);
      onStatsUpdate?.(memoryStats);

      // Load recent memories
      const recentResponse = await memoryClient.listMemories({ 
        limit: 10, 
        sort: 'updated_at',
        order: 'desc',
        memory_type: filterType === 'all' ? undefined : filterType as 'context' | 'project' | 'knowledge' | 'reference' | 'personal' | 'workflow'
      });
      setRecentMemories(recentResponse.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleExportStats = async () => {
    if (!stats) return;
    
    const exportData = {
      timestamp: new Date().toISOString(),
      stats,
      recent_memories: recentMemories.map(m => ({
        id: m.id,
        title: m.title,
        type: m.memory_type,
        created_at: m.created_at,
        access_count: m.access_count
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Dashboard data exported successfully');
  };

  useEffect(() => {
    loadDashboardData();
  }, [filterType, loadDashboardData]);

  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Memory Analytics</h2>
          <p className="text-gray-600">Real-time insights into your memory collection</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="context">Context</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="knowledge">Knowledge</SelectItem>
              <SelectItem value="reference">Reference</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="workflow">Workflow</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportStats}
            disabled={!stats}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Memories</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_memories}</p>
                  <p className="text-xs text-gray-500 mt-1">Across all types</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recent_activity}</p>
                  <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats.storage_used / 1024 / 1024).toFixed(1)}MB
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Memory content size</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Search className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Similarity</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats.avg_similarity_score * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Search relevance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Memory Type Distribution */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Memory Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.memories_by_type || {}).map(([type, count]) => {
                  const percentage = stats.total_memories > 0 
                    ? (count / stats.total_memories * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge variant="outline" className="capitalize mr-2">
                          {type}
                        </Badge>
                        <span className="text-sm text-gray-600">{count} memories</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Memories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMemories.length > 0 ? (
                  recentMemories.slice(0, 8).map((memory) => (
                    <div key={memory.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {memory.title}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Badge variant="outline" className="mr-2 text-xs">
                            {memory.memory_type}
                          </Badge>
                          {memory.access_count && (
                            <span>{memory.access_count} views</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">
                        {new Date(memory.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No recent memories found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}