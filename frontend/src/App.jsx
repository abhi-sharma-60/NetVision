import React from 'react';
import { Activity, Shield, Wifi, Server } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl">
            <Activity className="text-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">NetVision AI</h1>
            <p className="text-sm text-gray-400">Intelligent Network Monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-full border border-gray-700">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium">System Online</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-gray-800 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-secondary/20 rounded-lg">
                <Wifi className="text-secondary w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-200">Active Connections</h3>
            </div>
            <p className="text-4xl font-bold">0</p>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-gray-800 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-danger/20 rounded-lg">
                <Shield className="text-danger w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-200">Threats Blocked</h3>
            </div>
            <p className="text-4xl font-bold">0</p>
          </div>
        </div>

        {/* Center Column - Main Chart / Map */}
        <div className="lg:col-span-3 bg-surface p-6 rounded-2xl border border-gray-800 shadow-xl min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <Server className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-400">Waiting for live traffic...</h2>
            <p className="text-sm text-gray-500 mt-2">Connect to the backend sniffer to visualize packets.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
