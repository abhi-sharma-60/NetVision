import React, { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Monitor, Server, Router as RouterIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const isInternal = (ip) => {
  if (!ip) return false;
  if (ip.startsWith('127.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('10.')) return true;
  if (ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) return true;
  return false;
};

// --- Custom Nodes ---
const ClientNode = ({ data }) => (
  <div className="glass-panel border-primary/40 rounded-xl p-3 min-w-[160px] relative group cursor-pointer transition-colors hover:border-primary/80">
    <div className="absolute inset-0 bg-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-primary border-0" />
    <div className="flex items-center gap-3 relative z-10">
      <div className="p-2 bg-primary/20 rounded-lg text-primary relative">
        <div className="absolute inset-0 bg-primary/40 blur-md rounded-lg animate-pulse"></div>
        <Monitor className="w-5 h-5 relative z-10" />
      </div>
      <div>
        <div className="text-xs font-bold text-text-main">Local Device</div>
        <div className="text-[10px] font-mono text-text-muted">{data.label}</div>
      </div>
    </div>
  </div>
);

const RouterNode = ({ data }) => (
  <div className="glass-panel border-purple-500/40 rounded-xl p-4 min-w-[200px] relative group cursor-pointer transition-colors hover:border-purple-500/80">
    <div className="absolute inset-0 bg-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-purple-500 border-0" />
    <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-purple-500 border-0" />
    <div className="flex items-center gap-4 relative z-10">
      <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400 relative">
        <div className="absolute inset-0 bg-purple-500/40 blur-lg rounded-lg animate-pulse"></div>
        <RouterIcon className="w-6 h-6 relative z-10" />
      </div>
      <div>
        <div className="text-sm font-bold text-text-main tracking-wide">Core Gateway</div>
        <div className="text-xs font-mono text-purple-400">Enterprise Edge</div>
      </div>
    </div>
  </div>
);

const ServerNode = ({ data }) => (
  <div className="glass-panel border-orange-500/40 rounded-xl p-3 min-w-[160px] relative group cursor-pointer transition-colors hover:border-orange-500/80">
    <div className="absolute inset-0 bg-orange-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-orange-500 border-0" />
    <div className="flex items-center gap-3 relative z-10">
      <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500 relative">
        <div className="absolute inset-0 bg-orange-500/40 blur-md rounded-lg animate-pulse"></div>
        <Server className="w-5 h-5 relative z-10" />
      </div>
      <div>
        <div className="text-xs font-bold text-text-main">External Host</div>
        <div className="text-[10px] font-mono text-text-muted">{data.label}</div>
      </div>
    </div>
  </div>
);

const nodeTypes = {
  clientNode: ClientNode,
  routerNode: RouterNode,
  serverNode: ServerNode,
};

// --- Main Component ---
export default function TopologyMap() {
  const { livePackets } = useOutletContext();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const ips = new Set();
    
    // Default Gateway router node
    const baseNodes = [
      { id: 'router', type: 'routerNode', position: { x: 500, y: 350 }, data: { label: 'Gateway' } }
    ];
    const newEdges = [];

    livePackets.forEach(p => {
      if (p.src_ip) ips.add(p.src_ip);
      if (p.dst_ip) ips.add(p.dst_ip);
    });

    let clientY = 100;
    let serverY = 100;

    const uniqueIps = Array.from(ips);
    
    uniqueIps.forEach(ip => {
      const internal = isInternal(ip);
      if (internal) {
        baseNodes.push({
          id: ip,
          type: 'clientNode',
          position: { x: 100, y: clientY },
          data: { label: ip }
        });
        clientY += 120;
        
        newEdges.push({
          id: `edge-client-${ip}`,
          source: ip,
          target: 'router',
          animated: true,
          style: { stroke: 'var(--color-primary)', strokeWidth: 2, opacity: 0.6 }
        });
      } else {
        baseNodes.push({
          id: ip,
          type: 'serverNode',
          position: { x: 900, y: serverY },
          data: { label: ip }
        });
        serverY += 120;
        
        newEdges.push({
          id: `edge-server-${ip}`,
          source: 'router',
          target: ip,
          animated: true,
          style: { stroke: 'var(--color-warning)', strokeWidth: 2, opacity: 0.6 }
        });
      }
    });

    setNodes((prevNodes) => {
      const prevNodesMap = new Map(prevNodes.map(n => [n.id, n]));
      return baseNodes.map(n => {
        if (prevNodesMap.has(n.id)) {
          const prevNode = prevNodesMap.get(n.id);
          return { ...n, position: prevNode.position, selected: prevNode.selected, dragging: prevNode.dragging };
        }
        return n;
      });
    });

    setEdges(newEdges);
  }, [livePackets, setNodes, setEdges]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      
      {/* Floating Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-8 z-10 glass-panel px-6 py-4 rounded-2xl pointer-events-none"
      >
        <h2 className="text-2xl font-light text-text-main tracking-tight">Network <span className="font-semibold text-primary">Topology</span></h2>
        <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-semibold">Live Traffic Vectors</p>
      </motion.div>

      {/* Main Canvas */}
      <div className="w-full h-full">
        {nodes.length > 0 && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            className="mesh-bg"
          >
            <Background color="var(--text-muted)" gap={32} size={1} opacity={0.2} />
            
            <Controls className="glass-panel border-border fill-text-main !shadow-2xl rounded-xl overflow-hidden m-6" />
            
            <MiniMap 
              position="top-right"
              className="glass-panel border-border !rounded-2xl shadow-2xl m-6"
              nodeColor={(n) => {
                if (n.type === 'routerNode') return 'var(--color-purple-500)';
                if (n.type === 'clientNode') return 'var(--color-primary)';
                return 'var(--color-warning)';
              }}
              maskColor="var(--bg-surface-glass)"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
