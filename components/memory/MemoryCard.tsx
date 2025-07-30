'use client';

import { Memory } from '@/lib/memory/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Edit2, Trash2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MemoryCardProps {
  memory: Memory;
  onEdit?: (memory: Memory) => void;
  onDelete?: (memory: Memory) => void;
  showActions?: boolean;
}

const typeColors = {
  context: 'bg-blue-100 text-blue-800',
  project: 'bg-green-100 text-green-800', 
  knowledge: 'bg-purple-100 text-purple-800',
  reference: 'bg-yellow-100 text-yellow-800',
  personal: 'bg-pink-100 text-pink-800',
  workflow: 'bg-indigo-100 text-indigo-800'
};

export function MemoryCard({ memory, onEdit, onDelete, showActions = true }: MemoryCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">
            {memory.title}
          </h3>
          <Badge className={`${typeColors[memory.type]} shrink-0`}>
            {memory.type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-2">
        <p className="text-gray-600 text-sm line-clamp-3 mb-3">
          {memory.content}
        </p>
        
        {memory.tags && memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {memory.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          {formatDistanceToNow(new Date(memory.updatedAt), { addSuffix: true })}
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter className="pt-2">
          <div className="flex gap-2 w-full">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(memory)}
                className="flex-1"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(memory)}
                className="flex-1 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}