'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { Memory, CreateMemoryRequest } from '@/lib/memory/client';

interface MemoryFormProps {
  memory?: Memory;
  onSubmit: (data: CreateMemoryRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const memoryTypes = [
  { value: 'context', label: 'Context' },
  { value: 'project', label: 'Project' },
  { value: 'knowledge', label: 'Knowledge' },
  { value: 'reference', label: 'Reference' },
  { value: 'personal', label: 'Personal' },
  { value: 'workflow', label: 'Workflow' }
] as const;

export function MemoryForm({ memory, onSubmit, onCancel, isLoading }: MemoryFormProps) {
  const [title, setTitle] = useState(memory?.title || '');
  const [content, setContent] = useState(memory?.content || '');
  const [type, setType] = useState<CreateMemoryRequest['type']>(memory?.type || 'context');
  const [tags, setTags] = useState<string[]>(memory?.tags || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: CreateMemoryRequest = {
      title: title.trim(),
      content: content.trim(),
      type,
      tags: tags.length > 0 ? tags : undefined,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter memory title..."
          required
        />
      </div>

      <div>
        <Label htmlFor="type">Type</Label>
        <Select value={type} onValueChange={(value) => setType(value as CreateMemoryRequest['type'])}>
          <SelectTrigger>
            <SelectValue placeholder="Select memory type" />
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
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter memory content..."
          rows={6}
          required
        />
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
          />
          <Button type="button" onClick={handleAddTag} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {tags.length > 0 && (
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
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading || !title.trim() || !content.trim()}>
          {isLoading ? 'Saving...' : memory ? 'Update Memory' : 'Create Memory'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}