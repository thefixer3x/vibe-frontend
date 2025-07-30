'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search as SearchIcon, Network, Upload, Download, Trash2, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { MemoryList } from '@/components/memory/MemoryList';
import { MemoryForm } from '@/components/memory/MemoryForm';
import { MemorySearch } from '@/components/memory/MemorySearch';
import { MemoryDashboard } from '@/components/memory/MemoryDashboard';
import { memoryClient, Memory, CreateMemoryRequest, SearchMemoryResponse, MemoryStats } from '@/lib/memory/client';
import { toast } from 'sonner';
import { useMemoryNotifications } from '@/lib/hooks/useMemoryNotifications';

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchResults, setSearchResults] = useState<SearchMemoryResponse | null>(null);
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMemories, setTotalMemories] = useState(0);
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedMemories, setSelectedMemories] = useState<string[]>([]);
  const limit = 12;

  const loadMemories = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await memoryClient.listMemories({ page, limit });
      setMemories(response.data);
      setTotalMemories(response.total);
      setCurrentPage(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load memories');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMemoryStats = async () => {
    try {
      const stats = await memoryClient.getMemoryStats();
      setMemoryStats(stats);
    } catch (error) {
      console.error('Failed to load memory stats:', error);
    }
  };

  const handleSearch = async (params: Parameters<typeof memoryClient.searchMemories>[0]) => {
    setIsLoading(true);
    try {
      const results = await memoryClient.searchMemories(params);
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMemory = async (data: CreateMemoryRequest) => {
    try {
      const newMemory = await memoryClient.createMemory(data);
      toast.success('Memory created successfully');
      setIsFormOpen(false);
      loadMemories(currentPage);
      
      // Send real-time notification
      sendNotification('memory.created', {
        memory_id: newMemory.id,
        title: newMemory.title,
        memory_type: newMemory.memory_type,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create memory');
      throw error;
    }
  };

  const handleUpdateMemory = async (data: CreateMemoryRequest) => {
    if (!editingMemory) return;
    
    try {
      await memoryClient.updateMemory(editingMemory.id, data);
      toast.success('Memory updated successfully');
      setEditingMemory(null);
      setIsFormOpen(false);
      loadMemories(currentPage);
      if (searchResults) {
        // Refresh search results if we're in search mode
        const searchParams = { query: '', limit: 20 };
        handleSearch(searchParams);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update memory');
      throw error;
    }
  };

  const handleDeleteMemory = async (memory: Memory) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;
    
    try {
      await memoryClient.deleteMemory(memory.id);
      toast.success('Memory deleted successfully');
      loadMemories(currentPage);
      if (searchResults) {
        setSearchResults({
          ...searchResults,
          results: searchResults.results.filter(m => m.id !== memory.id)
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete memory');
    }
  };

  const handleEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingMemory(null);
  };

  const handleBulkDelete = async () => {
    if (selectedMemories.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedMemories.length} memories?`)) return;
    
    try {
      await memoryClient.bulkDeleteMemories(selectedMemories);
      toast.success(`Deleted ${selectedMemories.length} memories successfully`);
      setSelectedMemories([]);
      loadMemories(currentPage);
      if (searchResults) {
        setSearchResults({
          ...searchResults,
          results: searchResults.results.filter(m => !selectedMemories.includes(m.id))
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete memories');
    }
  };

  const handleExportMemories = async (format: 'json' | 'csv' = 'json') => {
    try {
      const blob = await memoryClient.exportMemories(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memories-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Memories exported successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export memories');
    }
  };

  // Real-time notifications
  const { isConnected, sendNotification } = useMemoryNotifications({
    enabled: true,
    showToasts: false, // We'll handle toasts manually
    onNotification: (notification) => {
      switch (notification.type) {
        case 'memory.created':
          loadMemories(currentPage);
          loadMemoryStats();
          break;
        case 'memory.updated':
          loadMemories(currentPage);
          if (searchResults) {
            // Refresh search if we're in search mode
            const lastQuery = searchResults.query;
            if (lastQuery) {
              handleSearch({ query: lastQuery, limit: 20 });
            }
          }
          break;
        case 'memory.deleted':
          loadMemories(currentPage);
          loadMemoryStats();
          if (searchResults) {
            setSearchResults({
              ...searchResults,
              results: searchResults.results.filter(m => m.id !== notification.data.memory_id)
            });
          }
          break;
      }
    }
  });

  useEffect(() => {
    loadMemories();
    loadMemoryStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Memory Dashboard</h1>
            {isConnected && (
              <div className="flex items-center text-green-600 text-sm">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-1 animate-pulse"></div>
                Live
              </div>
            )}
          </div>
          <p className="text-gray-600 mt-1">Manage your knowledge base and memories</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/dashboard/memory/visualizer">
            <Button variant="outline">
              <Network className="w-4 h-4 mr-2" />
              Visualizer
            </Button>
          </Link>
          <Link href="/dashboard/memory/upload">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => handleExportMemories('json')}
            title="Export memories as JSON"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {selectedMemories.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              title={`Delete ${selectedMemories.length} selected memories`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete ({selectedMemories.length})
            </Button>
          )}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMemory(null)}>
                <Plus className="w-4 h-4 mr-2" />
                New Memory
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingMemory ? 'Edit Memory' : 'Create New Memory'}
                </DialogTitle>
              </DialogHeader>
              <MemoryForm
                memory={editingMemory || undefined}
                onSubmit={editingMemory ? handleUpdateMemory : handleCreateMemory}
                onCancel={handleFormClose}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Memory Stats Dashboard */}
      {memoryStats && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Memories</p>
                <p className="text-2xl font-bold text-gray-900">{memoryStats.total_memories}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <Network className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                <p className="text-2xl font-bold text-gray-900">{memoryStats.recent_activity}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <Upload className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(memoryStats.storage_used / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <SearchIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Similarity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(memoryStats.avg_similarity_score * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse All</TabsTrigger>
          <TabsTrigger value="search">
            <SearchIcon className="w-4 h-4 mr-1" />
            Search
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-1" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <MemoryList
            memories={memories}
            onEdit={handleEdit}
            onDelete={handleDeleteMemory}
            isLoading={isLoading}
            selectedMemories={selectedMemories}
            onSelectionChange={setSelectedMemories}
            pagination={{
              page: currentPage,
              total: totalMemories,
              limit,
              onPageChange: loadMemories
            }}
          />
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <MemorySearch onSearch={handleSearch} isLoading={isLoading} />
          
          {searchResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Search Results ({searchResults.total} found)
                </h3>
              </div>
              
              <MemoryList
                memories={searchResults.results}
                onEdit={handleEdit}
                onDelete={handleDeleteMemory}
                isLoading={isLoading}
                selectedMemories={selectedMemories}
                onSelectionChange={setSelectedMemories}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <MemoryDashboard onStatsUpdate={setMemoryStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}