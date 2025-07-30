'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { Memory, CreateMemoryRequest } from '@/lib/memory/client';
import { toast } from 'sonner';

interface FileUpload {
  id: string;
  file: File;
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  extractedMetadata?: {
    title: string;
    tags: string[];
    memory_type: Memory['memory_type'];
  };
}

interface MemoryUploaderProps {
  onMemoryCreated?: (memory: Memory) => void;
  onBulkUpload?: (memories: Memory[]) => void;
  className?: string;
}

const memoryTypes = [
  { value: 'context', label: 'Context' },
  { value: 'project', label: 'Project' },
  { value: 'knowledge', label: 'Knowledge' },
  { value: 'reference', label: 'Reference' },
  { value: 'personal', label: 'Personal' },
  { value: 'workflow', label: 'Workflow' }
] as const;

export function MemoryUploader({ onMemoryCreated, onBulkUpload, className = '' }: MemoryUploaderProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [defaultType, setDefaultType] = useState<Memory['memory_type']>('context');
  const [defaultTags, setDefaultTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`File ${file.name} is too large (max 10MB)`);
        return;
      }

      const upload: FileUpload = {
        id: Math.random().toString(36).substring(2, 11),
        file,
        content: '',
        status: 'pending'
      };

      setUploads(prev => [...prev, upload]);
      processFile(upload);
    });

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = async (upload: FileUpload) => {
    setUploads(prev => prev.map(u => 
      u.id === upload.id ? { ...u, status: 'processing' } : u
    ));

    try {
      let content = '';
      const file = upload.file;

      if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        content = await file.text();
      } else if (file.type === 'application/json') {
        const jsonContent = await file.text();
        try {
          const parsed = JSON.parse(jsonContent);
          content = JSON.stringify(parsed, null, 2);
        } catch {
          content = jsonContent;
        }
      } else if (file.type.startsWith('image/')) {
        content = `[Image: ${file.name}]\nFile type: ${file.type}\nSize: ${(file.size / 1024).toFixed(2)} KB\n\nThis is an uploaded image file. The actual image content would need to be processed separately for text extraction or description.`;
      } else {
        content = `[File: ${file.name}]\nFile type: ${file.type}\nSize: ${(file.size / 1024).toFixed(2)} KB\n\nThis is an uploaded file. Content extraction may require specialized processing.`;
      }

      // Extract metadata from content
      const extractedMetadata = extractMetadata(file.name, content);

      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { 
          ...u, 
          content, 
          extractedMetadata,
          status: 'completed' 
        } : u
      ));
    } catch (error) {
      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { 
          ...u, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        } : u
      ));
    }
  };

  const extractMetadata = (filename: string, content: string) => {
    const baseName = filename.replace(/\.[^/.]+$/, '');
    
    // Extract potential tags from filename and content
    const tags: string[] = [];
    
    // Tags from filename
    if (filename.includes('api')) tags.push('api');
    if (filename.includes('doc')) tags.push('documentation');
    if (filename.includes('meeting')) tags.push('meeting');
    if (filename.includes('note')) tags.push('notes');
    if (filename.includes('project')) tags.push('project');
    
    // Tags from content (simple keyword extraction)
    const contentLower = content.toLowerCase();
    if (contentLower.includes('api')) tags.push('api');
    if (contentLower.includes('meeting')) tags.push('meeting');
    if (contentLower.includes('todo') || contentLower.includes('task')) tags.push('tasks');
    if (contentLower.includes('bug') || contentLower.includes('issue')) tags.push('issues');
    
    // Determine type based on content and filename
    let memoryType: Memory['memory_type'] = defaultType;
    if (filename.includes('project') || contentLower.includes('project')) memoryType = 'project';
    else if (filename.includes('doc') || contentLower.includes('documentation')) memoryType = 'knowledge';
    else if (filename.includes('ref') || contentLower.includes('reference')) memoryType = 'reference';
    else if (filename.includes('workflow') || contentLower.includes('process')) memoryType = 'workflow';

    return {
      title: baseName,
      tags: [...new Set([...tags, ...defaultTags])],
      memory_type: memoryType
    };
  };

  const handleAddTag = () => {
    if (newTag.trim() && !defaultTags.includes(newTag.trim())) {
      setDefaultTags([...defaultTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setDefaultTags(defaultTags.filter(tag => tag !== tagToRemove));
  };

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };


  const createMemoriesFromUploads = async () => {
    if (uploads.length === 0) return;

    setIsProcessing(true);
    const createdMemories: Memory[] = [];

    try {
      for (const upload of uploads.filter(u => u.status === 'completed')) {
        const memoryData: CreateMemoryRequest = {
          title: upload.extractedMetadata?.title || upload.file.name,
          content: upload.content,
          memory_type: upload.extractedMetadata?.memory_type || defaultType,
          tags: upload.extractedMetadata?.tags || defaultTags,
          metadata: {
            filename: upload.file.name,
            fileType: upload.file.type,
            fileSize: upload.file.size,
            uploadedAt: new Date().toISOString()
          }
        };

        const response = await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memoryData)
        });

        if (!response.ok) {
          throw new Error(`Failed to create memory for ${upload.file.name}`);
        }

        const memory = await response.json();
        createdMemories.push(memory);
        
        if (onMemoryCreated) {
          onMemoryCreated(memory);
        }
      }

      if (onBulkUpload && createdMemories.length > 0) {
        onBulkUpload(createdMemories);
      }

      toast.success(`Successfully created ${createdMemories.length} memories`);
      setUploads([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create memories');
    } finally {
      setIsProcessing(false);
    }
  };

  const completedUploads = uploads.filter(u => u.status === 'completed');
  const hasErrors = uploads.some(u => u.status === 'error');

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          <CardTitle>Manual Memory Upload</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Default Type</Label>
              <Select value={defaultType} onValueChange={(value) => setDefaultType(value as Memory['memory_type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {memoryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Default Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add default tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {defaultTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {defaultTags.map((tag) => (
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
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".txt,.md,.json,.pdf,.doc,.docx,image/*"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              Select Files to Upload
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Supports: Text, Markdown, JSON, PDF, Word docs, Images (max 10MB each)
            </p>
          </div>
        </div>

        {/* Upload List */}
        {uploads.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Uploaded Files ({uploads.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploads.map((upload) => (
                <div key={upload.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <File className="w-4 h-4" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{upload.file.name}</span>
                        {upload.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {upload.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                        {upload.status === 'processing' && (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(upload.file.size / 1024).toFixed(2)} KB
                      </div>
                      {upload.extractedMetadata && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{upload.extractedMetadata.memory_type}</Badge>
                          {upload.extractedMetadata.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      {upload.error && (
                        <div className="text-xs text-red-500 mt-1">{upload.error}</div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUpload(upload.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Memories Button */}
        {completedUploads.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {completedUploads.length} files ready to create memories
              {hasErrors && (
                <span className="text-red-500 ml-2">
                  ({uploads.filter(u => u.status === 'error').length} failed)
                </span>
              )}
            </div>
            <Button
              onClick={createMemoriesFromUploads}
              disabled={isProcessing || completedUploads.length === 0}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create {completedUploads.length} Memories
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}