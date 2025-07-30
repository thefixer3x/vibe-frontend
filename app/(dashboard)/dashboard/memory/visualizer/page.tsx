'use client';

import { useState, useEffect } from 'react';
import { MemoryVisualizer } from '@/components/memory/MemoryVisualizer';
import { memoryClient, Memory } from '@/lib/memory/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Eye, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function MemoryVisualizerPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    byType: {} as Record<string, number>,
    connections: 0
  });

  const loadMemories = async () => {
    setIsLoading(true);
    try {
      const response = await memoryClient.listMemories({ limit: 1000 });
      setMemories(response.memories);
      
      // Calculate stats
      const byType = response.memories.reduce((acc, memory) => {
        acc[memory.type] = (acc[memory.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Calculate potential connections
      let connections = 0;
      for (let i = 0; i < response.memories.length; i++) {
        for (let j = i + 1; j < response.memories.length; j++) {
          const memA = response.memories[i];
          const memB = response.memories[j];
          
          // Same logic as visualizer for calculating connections
          let weight = 0;
          if (memA.type === memB.type) weight += 0.3;
          
          const tagsA = memA.tags || [];
          const tagsB = memB.tags || [];
          const sharedTags = tagsA.filter(tag => tagsB.includes(tag));
          weight += sharedTags.length * 0.4;
          
          if (weight > 0.2) connections++;
        }
      }
      
      setStats({
        total: response.total,
        byType,
        connections
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load memories');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredMemories = () => {
    if (filterType === 'all') return memories;
    return memories.filter(memory => memory.type === filterType);
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const filteredMemories = getFilteredMemories();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Memory Network Visualizer</h1>
          <p className="text-gray-600 mt-1">Explore relationships and connections in your memory network</p>
        </div>
        
        <Button onClick={loadMemories} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Memories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{Object.keys(stats.byType).length}</p>
                <p className="text-sm text-gray-600">Memory Types</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.connections}</p>
                <p className="text-sm text-gray-600">Connections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{filteredMemories.length}</p>
                <p className="text-sm text-gray-600">Filtered View</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Memory Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {type}
                    </Badge>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• <strong>Node size:</strong> Content length</p>
              <p>• <strong>Connections:</strong> Shared tags & content</p>
              <p>• <strong>Colors:</strong> Memory types</p>
              <p>• <strong>Thickness:</strong> Relationship strength</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Visualizer */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading memories...
                </div>
              </CardContent>
            </Card>
          ) : (
            <MemoryVisualizer
              memories={filteredMemories}
              onNodeClick={(memory) => {
                toast.info(`Selected: ${memory.title}`);
              }}
              className="h-full"
            />
          )}
        </div>
      </div>

      {filteredMemories.length === 0 && !isLoading && (
        <Card className="mt-8">
          <CardContent className="p-8 text-center">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No memories to visualize</h3>
            <p className="text-gray-600">
              {filterType === 'all' 
                ? 'Create some memories to see the network visualization'
                : `No memories found for type: ${filterType}`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}