'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search as SearchIcon, Network, Upload } from 'lucide-react';
import Link from 'next/link';
import { MemoryList } from '@/components/memory/MemoryList';
import { MemoryForm } from '@/components/memory/MemoryForm';
import { MemorySearch } from '@/components/memory/MemorySearch';
import { memoryClient, Memory, CreateMemoryRequest, SearchMemoryResponse } from '@/lib/memory/client';
import { toast } from 'sonner';

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchResults, setSearchResults] = useState<SearchMemoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMemories, setTotalMemories] = useState(0);
  const [activeTab, setActiveTab] = useState('browse');
  const limit = 12;

  const loadMemories = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await memoryClient.listMemories({ page, limit });
      setMemories(response.memories);
      setTotalMemories(response.total);
      setCurrentPage(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load memories');
    } finally {
      setIsLoading(false);
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
      await memoryClient.createMemory(data);
      toast.success('Memory created successfully');
      setIsFormOpen(false);
      loadMemories(currentPage);
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
          memories: searchResults.memories.filter(m => m.id !== memory.id)
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

  useEffect(() => {
    loadMemories();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Memory Dashboard</h1>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse All</TabsTrigger>
          <TabsTrigger value="search">
            <SearchIcon className="w-4 h-4 mr-1" />
            Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <MemoryList
            memories={memories}
            onEdit={handleEdit}
            onDelete={handleDeleteMemory}
            isLoading={isLoading}
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
                memories={searchResults.memories}
                onEdit={handleEdit}
                onDelete={handleDeleteMemory}
                isLoading={isLoading}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}