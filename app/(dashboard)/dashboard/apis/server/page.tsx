'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Server,
  Terminal,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Play,
  Square,
  RotateCcw,
  FileText,
  Folder,
  Download,
  Upload,
  Trash2,
  Plus,
  Activity,
  Settings,
  Monitor
} from 'lucide-react';

interface ServerStats {
  cpu: number;
  memory: number;
  disk: number;
  network: { in: number; out: number };
  uptime: string;
}

interface ServerInfo {
  id: string;
  name: string;
  ip: string;
  os: string;
  status: 'running' | 'stopped' | 'restarting';
  stats: ServerStats;
}

// Mock server data - replace with real API calls
const mockServers: ServerInfo[] = [
  {
    id: 'vps-1',
    name: 'Production Server',
    ip: '159.89.123.45',
    os: 'Ubuntu 22.04 LTS',
    status: 'running',
    stats: {
      cpu: 23,
      memory: 67,
      disk: 45,
      network: { in: 1.2, out: 0.8 },
      uptime: '7 days, 3 hours'
    }
  },
  {
    id: 'vps-2',
    name: 'Development Server',
    ip: '142.93.67.89',
    os: 'Ubuntu 20.04 LTS',
    status: 'running',
    stats: {
      cpu: 12,
      memory: 34,
      disk: 23,
      network: { in: 0.5, out: 0.3 },
      uptime: '2 days, 14 hours'
    }
  }
];

const mockFiles = [
  { name: 'api-server.js', type: 'file', size: '2.3 KB', modified: '2 hours ago' },
  { name: 'package.json', type: 'file', size: '1.1 KB', modified: '1 day ago' },
  { name: 'configs', type: 'folder', size: '-', modified: '3 hours ago' },
  { name: 'logs', type: 'folder', size: '-', modified: '1 hour ago' },
  { name: '.env', type: 'file', size: '0.5 KB', modified: '2 days ago' }
];

export default function ServerManagementPage() {
  const [selectedServer, setSelectedServer] = useState<string>(mockServers[0].id);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-72-generic x86_64)',
    'Last login: Sun Jul 27 06:15:32 2025 from 192.168.1.100',
    'user@production-server:~$ '
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [currentPath, setCurrentPath] = useState('/home/user');
  const [isExecuting, setIsExecuting] = useState(false);

  const getSelectedServer = () => {
    return mockServers.find(server => server.id === selectedServer) || mockServers[0];
  };

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;
    
    setIsExecuting(true);
    setTerminalOutput(prev => [...prev, `user@production-server:${currentPath}$ ${command}`]);
    
    // Simulate command execution
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock command responses
    let response = '';
    switch (command.toLowerCase().trim()) {
      case 'ls':
      case 'ls -la':
        response = 'total 48\ndrwxr-xr-x 5 user user 4096 Jul 27 06:30 .\ndrwxr-xr-x 3 root root 4096 Jul 20 10:15 ..\n-rw-r--r-- 1 user user  220 Jul 20 10:15 .bash_logout\n-rw-r--r-- 1 user user 3771 Jul 20 10:15 .bashrc\ndrwxr-xr-x 3 user user 4096 Jul 27 06:25 api-server\n-rw-r--r-- 1 user user  807 Jul 20 10:15 .profile';
        break;
      case 'pwd':
        response = currentPath;
        break;
      case 'whoami':
        response = 'user';
        break;
      case 'uptime':
        response = '06:30:45 up 7 days,  3:15,  1 user,  load average: 0.23, 0.45, 0.67';
        break;
      case 'df -h':
        response = 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/vda1        25G   11G   13G  45% /\n/dev/vda15      105M  6.1M   99M   6% /boot/efi';
        break;
      case 'free -h':
        response = '               total        used        free      shared  buff/cache   available\nMem:           1.9Gi       1.3Gi       123Mi        32Mi       512Mi       456Mi\nSwap:          1.0Gi       256Mi       768Mi';
        break;
      case 'ps aux':
        response = 'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot           1  0.0  0.1 168404 11728 ?        Ss   Jul20   0:05 /sbin/init\nuser        1234  2.3  5.2 574128 98456 ?        Sl   06:25   0:15 node api-server.js';
        break;
      default:
        if (command.startsWith('cd ')) {
          const newPath = command.substring(3).trim();
          if (newPath === '..') {
            setCurrentPath(prev => prev.split('/').slice(0, -1).join('/') || '/');
          } else if (newPath.startsWith('/')) {
            setCurrentPath(newPath);
          } else {
            setCurrentPath(prev => `${prev}/${newPath}`.replace('//', '/'));
          }
          response = '';
        } else if (command.includes('systemctl')) {
          response = command.includes('status') ? 
            '● api-server.service - API Server\n   Loaded: loaded (/etc/systemd/system/api-server.service)\n   Active: active (running) since Sun 2025-07-20 10:30:00 UTC; 7 days ago' :
            'Command executed successfully';
        } else {
          response = `Command '${command}' executed successfully`;
        }
    }
    
    if (response) {
      setTerminalOutput(prev => [...prev, response]);
    }
    setTerminalOutput(prev => [...prev, `user@production-server:${currentPath}$ `]);
    setCurrentCommand('');
    setIsExecuting(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isExecuting) {
      executeCommand(currentCommand);
    }
  };

  const serverActions = [
    { id: 'start', label: 'Start', icon: Play, color: 'bg-green-500' },
    { id: 'stop', label: 'Stop', icon: Square, color: 'bg-red-500' },
    { id: 'restart', label: 'Restart', icon: RotateCcw, color: 'bg-blue-500' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">VPS Server Management</h1>
          <p className="text-gray-600 mt-1">
            Control and monitor your virtual private servers
          </p>
        </div>
        <Select value={selectedServer} onValueChange={setSelectedServer}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mockServers.map(server => (
              <SelectItem key={server.id} value={server.id}>
                <div className="flex items-center space-x-2">
                  <Server className="h-4 w-4" />
                  <span>{server.name}</span>
                  <Badge variant={server.status === 'running' ? 'default' : 'secondary'}>
                    {server.status}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="terminal">Terminal</TabsTrigger>
          <TabsTrigger value="files">File Manager</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Server Info */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="h-5 w-5 mr-2" />
                  Server Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-medium">{getSelectedServer().name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">IP:</span>
                    <span className="text-sm font-mono">{getSelectedServer().ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">OS:</span>
                    <span className="text-sm">{getSelectedServer().os}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant={getSelectedServer().status === 'running' ? 'default' : 'secondary'}>
                      {getSelectedServer().status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Uptime:</span>
                    <span className="text-sm">{getSelectedServer().stats.uptime}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {serverActions.map(action => (
                    <Button 
                      key={action.id} 
                      variant="outline" 
                      className="w-full justify-start"
                      disabled={getSelectedServer().status === 'restarting'}
                    >
                      <action.icon className="h-4 w-4 mr-2" />
                      {action.label} Server
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resource Usage */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Resource Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Cpu className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="text-sm font-medium">CPU</span>
                        </div>
                        <span className="text-sm">{getSelectedServer().stats.cpu}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${getSelectedServer().stats.cpu}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <MemoryStick className="h-4 w-4 mr-2 text-green-500" />
                          <span className="text-sm font-medium">Memory</span>
                        </div>
                        <span className="text-sm">{getSelectedServer().stats.memory}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${getSelectedServer().stats.memory}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <HardDrive className="h-4 w-4 mr-2 text-purple-500" />
                          <span className="text-sm font-medium">Disk</span>
                        </div>
                        <span className="text-sm">{getSelectedServer().stats.disk}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${getSelectedServer().stats.disk}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Network className="h-4 w-4 mr-2 text-orange-500" />
                          <span className="text-sm font-medium">Network</span>
                        </div>
                        <span className="text-sm">
                          ↓{getSelectedServer().stats.network.in} MB/s ↑{getSelectedServer().stats.network.out} MB/s
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Terminal Tab */}
        <TabsContent value="terminal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Terminal className="h-5 w-5 mr-2" />
                SSH Terminal - {getSelectedServer().name}
              </CardTitle>
              <CardDescription>
                Execute commands directly on your server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
                {terminalOutput.map((line, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {line}
                  </div>
                ))}
                {isExecuting && (
                  <div className="flex items-center">
                    <span className="animate-pulse">Executing...</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center space-x-2">
                <Input
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter command..."
                  disabled={isExecuting}
                  className="font-mono"
                />
                <Button 
                  onClick={() => executeCommand(currentCommand)}
                  disabled={isExecuting || !currentCommand.trim()}
                >
                  Execute
                </Button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Try commands like: ls, pwd, uptime, df -h, free -h, ps aux
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Manager Tab */}
        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Folder className="h-5 w-5 mr-2" />
                  File Manager
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    New Folder
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Browse and manage files on your server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Folder className="h-4 w-4" />
                  <span>{currentPath}</span>
                </div>
                <div className="border rounded-lg">
                  <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 font-medium text-sm border-b">
                    <span>Name</span>
                    <span>Type</span>
                    <span>Size</span>
                    <span>Modified</span>
                  </div>
                  {mockFiles.map((file, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-3 border-b last:border-b-0 hover:bg-gray-50">
                      <div className="flex items-center space-x-2">
                        {file.type === 'folder' ? (
                          <Folder className="h-4 w-4 text-blue-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{file.type}</span>
                      <span className="text-sm text-gray-600">{file.size}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{file.modified}</span>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="h-5 w-5 mr-2" />
                  System Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto font-mono text-xs">
                  <div className="space-y-1">
                    <div>[2025-07-27 06:30:15] INFO: API server started on port 3000</div>
                    <div>[2025-07-27 06:29:45] INFO: Database connection established</div>
                    <div>[2025-07-27 06:29:30] INFO: SSL certificate loaded successfully</div>
                    <div className="text-yellow-600">[2025-07-27 06:28:12] WARN: High memory usage detected (67%)</div>
                    <div>[2025-07-27 06:25:00] INFO: System backup completed</div>
                    <div className="text-red-600">[2025-07-27 06:20:33] ERROR: Failed to connect to external API</div>
                    <div>[2025-07-27 06:15:22] INFO: User authentication successful</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Process Monitor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: 'api-server.js', cpu: '2.3%', memory: '98MB', status: 'running' },
                    { name: 'nginx', cpu: '0.1%', memory: '12MB', status: 'running' },
                    { name: 'mysql', cpu: '1.2%', memory: '156MB', status: 'running' },
                    { name: 'pm2', cpu: '0.2%', memory: '34MB', status: 'running' }
                  ].map((process, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${process.status === 'running' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium">{process.name}</span>
                      </div>
                      <div className="flex space-x-4 text-sm text-gray-600">
                        <span>CPU: {process.cpu}</span>
                        <span>Memory: {process.memory}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                System Services
              </CardTitle>
              <CardDescription>
                Manage system services and daemons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'nginx', description: 'Web Server', status: 'active', enabled: true },
                  { name: 'mysql', description: 'Database Server', status: 'active', enabled: true },
                  { name: 'api-server', description: 'Custom API Service', status: 'active', enabled: true },
                  { name: 'ssh', description: 'SSH Daemon', status: 'active', enabled: true },
                  { name: 'firewall', description: 'UFW Firewall', status: 'active', enabled: true }
                ].map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`h-3 w-3 rounded-full ${service.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-gray-600">{service.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                        {service.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        {service.status === 'active' ? 'Stop' : 'Start'}
                      </Button>
                      <Button variant="outline" size="sm">
                        Restart
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}