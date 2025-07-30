'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import { Memory } from '@/lib/memory/client';

interface MemorySearchProps {
  onSearch: (params: {
    query: string;
    type?: Memory['type'];
    tags?: string[];
    limit?: number;
  }) => void;
  isLoading?: boolean;
}

const memoryTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'context', label: 'Context' },
  { value: 'project', label: 'Project' },
  { value: 'knowledge', label: 'Knowledge' },
  { value: 'reference', label: 'Reference' },
  { value: 'personal', label: 'Personal' },
  { value: 'workflow', label: 'Workflow' }
] as const;

export function MemorySearch({ onSearch, isLoading }: MemorySearchProps) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<string>('all');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSearch({
      query: query.trim(),
      type: type === 'all' ? undefined : type as Memory['type'],
      tags: tags.length > 0 ? tags : undefined,
      limit: 20
    });
  };

  return (
    <form onSubmit={handleSearch} className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-full"
          />
        </div>
        <Button type="submit" disabled={isLoading || !query.trim()}>
          <Search className="w-4 h-4 mr-1" />
          Search
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {memoryTypes.map((memoryType) => (
                <SelectItem key={memoryType.value} value={memoryType.value}>
                  {memoryType.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Filter by Tags</label>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag filter..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            />
            <Button type="button" onClick={handleAddTag} size="sm" variant="outline">
              Add
            </Button>
          </div>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Active Tag Filters:</label>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}