'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Memory } from '@/lib/memory/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, Eye, EyeOff, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

interface MemoryNode {
  id: string;
  label: string;
  type: Memory['memory_type'];
  size: number;
  color: string;
  title: string;
}

interface MemoryEdge {
  from: string;
  to: string;
  weight: number;
  color: string;
}

interface MemoryVisualizerProps {
  memories: Memory[];
  onNodeClick?: (memory: Memory) => void;
  className?: string;
}

const typeColors = {
  context: '#3B82F6',    // blue
  project: '#10B981',    // green
  knowledge: '#8B5CF6',  // purple
  reference: '#F59E0B',  // yellow
  personal: '#EC4899',   // pink
  workflow: '#6366F1'    // indigo
};

export function MemoryVisualizer({ memories, className = '' }: MemoryVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Create nodes and edges from memories
  const createNetworkData = () => {
    const nodes: MemoryNode[] = memories.map(memory => ({
      id: memory.id,
      label: memory.title,
      type: memory.memory_type,
      size: Math.max(20, Math.min(50, memory.content.length / 20)),
      color: typeColors[memory.memory_type as keyof typeof typeColors],
      title: `${memory.title}\nType: ${memory.memory_type}\nTags: ${memory.tags?.join(', ') || 'None'}`
    }));

    const edges: MemoryEdge[] = [];
    
    // Create edges based on shared tags and similar types
    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const memA = memories[i];
        const memB = memories[j];
        
        let weight = 0;
        
        // Same type connection
        if (memA.memory_type === memB.memory_type) {
          weight += 0.3;
        }
        
        // Shared tags connection
        const tagsA = memA.tags || [];
        const tagsB = memB.tags || [];
        const sharedTags = tagsA.filter(tag => tagsB.includes(tag));
        weight += sharedTags.length * 0.4;
        
        // Content similarity (simple keyword matching)
        const wordsA = memA.content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const wordsB = memB.content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const commonWords = wordsA.filter(word => wordsB.includes(word));
        weight += Math.min(commonWords.length * 0.1, 0.5);
        
        if (weight > 0.2) {
          edges.push({
            from: memA.id,
            to: memB.id,
            weight,
            color: `rgba(128, 128, 128, ${Math.min(weight, 0.8)})`
          });
        }
      }
    }

    return { nodes, edges };
  };

  const drawNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { nodes, edges } = createNetworkData();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context for transformations
    ctx.save();
    
    // Apply zoom and pan
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoomLevel, zoomLevel);
    
    // Position nodes using a simple force-directed layout
    const positions = new Map<string, { x: number; y: number }>();
    const centerX = canvas.width / 2 / zoomLevel;
    const centerY = canvas.height / 2 / zoomLevel;
    
    // Initial circular positioning
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const radius = Math.min(200, 50 + nodes.length * 8);
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    });

    // Draw edges
    ctx.lineWidth = 2;
    edges.forEach(edge => {
      const fromPos = positions.get(edge.from);
      const toPos = positions.get(edge.to);
      
      if (fromPos && toPos) {
        ctx.strokeStyle = edge.color;
        ctx.lineWidth = edge.weight * 3;
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = positions.get(node.id);
      if (!pos) return;

      // Node circle
      ctx.fillStyle = node.color;
      ctx.strokeStyle = selectedNode === node.id ? '#000' : '#fff';
      ctx.lineWidth = selectedNode === node.id ? 3 : 2;
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, node.size, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Node labels
      if (showLabels) {
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label,
          pos.x,
          pos.y + node.size + 15
        );
      }

      // Type badge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.type.toUpperCase(), pos.x, pos.y + 3);
    });

    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  };

  const resetView = () => {
    setZoomLevel(1);
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawNetwork();
    }
  }, [memories, selectedNode, showLabels, zoomLevel, offset, drawNetwork]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawNetwork();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawNetwork]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            <CardTitle>Memory Network Visualizer</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLabels(!showLabels)}
            >
              {showLabels ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetView}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeColors).map(([type, color]) => (
            <Badge key={type} style={{ backgroundColor: color, color: 'white' }}>
              {type}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef}
          className="relative h-96 border rounded-lg bg-gray-50 overflow-hidden cursor-grab"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          {memories.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <p>No memories to visualize</p>
            </div>
          )}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>• Nodes represent memories, sized by content length</p>
          <p>• Connections show relationships through shared tags and content similarity</p>
          <p>• Colors indicate memory types</p>
          <p>• Drag to pan, use zoom controls to navigate</p>
        </div>
      </CardContent>
    </Card>
  );
}