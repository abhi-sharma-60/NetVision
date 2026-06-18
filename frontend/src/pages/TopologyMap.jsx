import React, { useMemo, useEffect } from 'react';
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
  <div className="bg-surface border border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] rounded-xl p-3 min-w-[150px]">
    <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-primary border-0" />
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/20 rounded-lg text-primary">
        <Monitor className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs font-bold text-text-main">Local Device</div>
        <div className="text-[10px] font-mono text-text-muted">{data.label}</div>
      </div>
    </div>
  </div>
);

const RouterNode = ({ data }) => (
  <div className="bg-surface border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.4)] rounded-xl p-4 min-w-[180px]">
    <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-purple-500 border-0" />
    <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-purple-500 border-0" />
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-purple-500/20 rounded-lg text-purple-400">
        <RouterIcon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-sm font-bold text-text-main">Core Gateway</div>
        <div className="text-xs font-mono text-purple-400">Enterprise Edge</div>
      </div>
    </div>
  </div>
);

const ServerNode = ({ data }) => (
  <div className="bg-surface border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)] rounded-xl p-3 min-w-[150px]">
    <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-orange-500 border-0" />
    <div className="flex items-center gap-3">
      <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500">
        <Server className="w-5 h-5" />
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
    const newNodes = [
      { id: 'router', type: 'routerNode', position: { x: 450, y: 300 }, data: { label: 'Gateway' } }
    ];
    const newEdges = [];

    // Extract unique IPs from the last 50 packets
    livePackets.forEach(p => {
      if (p.src_ip) ips.add(p.src_ip);
      if (p.dst_ip) ips.add(p.dst_ip);
    });

    let clientY = 50;
    let serverY = 50;

    const uniqueIps = Array.from(ips);
    
    uniqueIps.forEach(ip => {
      const internal = isInternal(ip);
      if (internal) {
        newNodes.push({
          id: ip,
          type: 'clientNode',
          position: { x: 50, y: clientY },
          data: { label: ip }
        });
        clientY += 100;
        
        newEdges.push({
          id: `edge-client-${ip}`,
          source: ip,
          target: 'router',
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 }
        });
      } else {
        newNodes.push({
          id: ip,
          type: 'serverNode',
          position: { x: 850, y: serverY },
          data: { label: ip }
        });
        serverY += 100;
        
        newEdges.push({
          id: `edge-server-${ip}`,
          source: 'router',
          target: ip,
          animated: true,
          style: { stroke: '#f97316', strokeWidth: 2 }
        });
      }
    });

    // Only update if the number of unique IPs changed to avoid constant layout jumping,
    // or we can just blindly update if we want real-time. Since XY flow keeps nodes static if IDs match,
    // it's safe to call setNodes.
    setNodes(newNodes);
    setEdges(newEdges);
  }, [livePackets, setNodes, setEdges]);

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-text-main mb-2">Network Topology</h2>
        <p className="text-text-muted">Live mapping of connected internal devices and external servers.</p>
      </div>

      <div className="flex-1 bg-surface border border-border rounded-2xl shadow-md overflow-hidden relative">
        {nodes.length > 0 && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background/30"
          >
            <Background color="var(--border-subtle)" gap={24} size={2} />
            <Controls className="bg-surface border-border fill-text-main" />
            <MiniMap 
              className="bg-surface border border-border rounded-xl shadow-lg"
              nodeColor={(n) => {
                if (n.type === 'routerNode') return '#a855f7';
                if (n.type === 'clientNode') return '#3b82f6';
                return '#f97316';
              }}
              maskColor="var(--bg-background)"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
