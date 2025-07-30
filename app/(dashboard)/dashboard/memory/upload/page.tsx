'use client';

import { useState } from 'react';
import { MemoryUploader } from '@/components/memory/MemoryUploader';
import { MemoryList } from '@/components/memory/MemoryList';
import { Memory } from '@/lib/memory/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, History, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MemoryUploadPage() {
  const [uploadedMemories, setUploadedMemories] = useState<Memory[]>([]);
  const [uploadHistory, setUploadHistory] = useState<{
    id: string;
    timestamp: Date;
    count: number;
    files: string[];
  }[]>([]);

  const handleMemoryCreated = (memory: Memory) => {
    setUploadedMemories(prev => [memory, ...prev]);
    toast.success(`Memory "${memory.title}" created successfully`);
  };

  const handleBulkUpload = (memories: Memory[]) => {
    setUploadedMemories(prev => [...memories, ...prev]);
    
    // Add to upload history
    const historyEntry = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date(),
      count: memories.length,
      files: memories.map(m => m.metadata?.filename || m.title).filter(Boolean) as string[]
    };
    
    setUploadHistory(prev => [historyEntry, ...prev]);
    toast.success(`Successfully uploaded ${memories.length} memories`);
  };

  const clearHistory = () => {
    setUploadHistory([]);
    toast.info('Upload history cleared');
  };

  const clearUploaded = () => {
    setUploadedMemories([]);
    toast.info('Uploaded memories list cleared');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Memory Upload Center</h1>
          <p className="text-gray-600 mt-1">Upload files and documents to create memories automatically</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {uploadedMemories.length} Uploaded
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <History className="w-3 h-3" />
            {uploadHistory.length} Sessions
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-1" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="uploaded">
            <FileText className="w-4 h-4 mr-1" />
            Uploaded Memories ({uploadedMemories.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-1" />
            Upload History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <MemoryUploader
            onMemoryCreated={handleMemoryCreated}
            onBulkUpload={handleBulkUpload}
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{uploadedMemories.length}</p>
                    <p className="text-sm text-gray-600">Total Uploaded</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {uploadedMemories.reduce((acc, m) => {
                        const types = new Set(acc);
                        types.add(m.memory_type);
                        return Array.from(types);
                      }, [] as string[]).length}
                    </p>
                    <p className="text-sm text-gray-600">Memory Types</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{uploadHistory.length}</p>
                    <p className="text-sm text-gray-600">Upload Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Supported Formats</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Text files (.txt, .md)</li>
                    <li>• JSON data (.json)</li>
                    <li>• Documents (.pdf, .doc, .docx)</li>
                    <li>• Images (for metadata extraction)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Best Practices</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Use descriptive filenames</li>
                    <li>• Set appropriate default type and tags</li>
                    <li>• Keep files under 10MB</li>
                    <li>• Review extracted metadata before creating</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uploaded" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recently Uploaded Memories</h2>
            {uploadedMemories.length > 0 && (
              <Button variant="outline" onClick={clearUploaded}>
                Clear List
              </Button>
            )}
          </div>

          <MemoryList
            memories={uploadedMemories}
            showActions={false}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upload History</h2>
            {uploadHistory.length > 0 && (
              <Button variant="outline" onClick={clearHistory}>
                Clear History
              </Button>
            )}
          </div>

          {uploadHistory.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upload history</h3>
                <p className="text-gray-600">Your upload sessions will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {uploadHistory.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="font-medium">
                            {entry.count} memories uploaded
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {entry.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{entry.files.length} files</Badge>
                    </div>
                    {entry.files.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Files:</p>
                        <div className="flex flex-wrap gap-1">
                          {entry.files.slice(0, 5).map((filename, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {filename}
                            </Badge>
                          ))}
                          {entry.files.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{entry.files.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}