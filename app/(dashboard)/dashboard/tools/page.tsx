"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Check, X } from 'lucide-react';

interface Tool {
  name: string;
  description: string;
  connected: boolean;
  docsUrl?: string;
}

const initialTools: Tool[] = [
  {
    name: 'GitHub',
    description: 'Import repositories and manage pull requests',
    connected: false,
    docsUrl: 'https://docs.github.com/rest'
  },
  {
    name: 'Slack',
    description: 'Send notifications and receive alerts',
    connected: true,
    docsUrl: 'https://api.slack.com/'
  },
  {
    name: 'Notion',
    description: 'Sync pages and databases',
    connected: false,
    docsUrl: 'https://developers.notion.com/'
  }
];

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>(initialTools);

  function toggleConnect(toolName: string) {
    setTools((prev) =>
      prev.map((t) => (t.name === toolName ? { ...t, connected: !t.connected } : t))
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg lg:text-2xl font-medium">Connected Tools</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Card key={tool.name} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">{tool.name}</CardTitle>
              <div className="flex items-center gap-2">
                {tool.connected ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-red-600" />
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      Disconnected
                    </Badge>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{tool.description}</p>
              <div className="flex items-center justify-between">
                {tool.docsUrl && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={tool.docsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Docs
                    </a>
                  </Button>
                )}
                <Button size="sm" onClick={() => toggleConnect(tool.name)}>
                  {tool.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}