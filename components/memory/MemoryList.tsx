'use client';

import { Memory } from '@/lib/memory/client';
import { MemoryCard } from './MemoryCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MemoryListProps {
  memories: Memory[];
  onEdit?: (memory: Memory) => void;
  onDelete?: (memory: Memory) => void;
  showActions?: boolean;
  pagination?: {
    page: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
  };
  isLoading?: boolean;
}

export function MemoryList({ 
  memories, 
  onEdit, 
  onDelete, 
  showActions = true, 
  pagination,
  isLoading 
}: MemoryListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-48"></div>
          </div>
        ))}
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No memories found</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your search or create a new memory</p>
      </div>
    );
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;
  const hasNextPage = pagination ? pagination.page < totalPages : false;
  const hasPrevPage = pagination ? pagination.page > 1 : false;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memories.map((memory) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            onEdit={onEdit}
            onDelete={onDelete}
            showActions={showActions}
          />
        ))}
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} memories
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === pagination.page;
                
                return (
                  <Button
                    key={pageNum}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => pagination.onPageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={!hasNextPage}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}