import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Trash2,
  X,
  Zap
} from 'lucide-react';
import { UsageTracker } from '../services/usage';

interface UsageStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

const UsageStats: React.FC<UsageStatsProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState(UsageTracker.getStats());
  const [logs, setLogs] = useState(UsageTracker.getLogs());

  useEffect(() => {
    if (isOpen) {
      setStats(UsageTracker.getStats());
      setLogs(UsageTracker.getLogs());
    }
  }, [isOpen]);

  const handleClear = () => {
    if (window.confirm('Hapus semua log riwayat penggunaan?')) {
      UsageTracker.clearLogs();
      setStats(UsageTracker.getStats());
      setLogs(UsageTracker.getLogs());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1E1D1B] border border-[#3A3834] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#3A3834] flex items-center justify-between bg-[#1E1D1B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4A373]/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#D4A373]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">API Usage</h2>
              <p className="text-[13px] text-[#88857F]">Monitor your request limits and health</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleClear}
              className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-[#88857F] hover:text-red-400"
              title="Clear Logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[#2B2A27] rounded-full transition-colors text-[#88857F] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-[#2B2A27]/50 border border-[#3A3834] rounded-2xl p-4 space-y-1">
              <p className="text-[11px] text-[#88857F] uppercase tracking-wider font-bold">Requests (Min)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{stats.requestsLastMinute}</span>
                <span className="text-[12px] text-[#88857F]">/ 15</span>
              </div>
              <div className="w-full bg-[#1E1D1B] h-1 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${stats.requestsLastMinute > 10 ? 'bg-amber-500' : 'bg-[#D4A373]'}`}
                  style={{ width: `${Math.min((stats.requestsLastMinute / 15) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-[#2B2A27]/50 border border-[#3A3834] rounded-2xl p-4 space-y-1">
              <p className="text-[11px] text-[#88857F] uppercase tracking-wider font-bold">Success Rate</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {stats.totalRequests > 0 ? Math.round((stats.successCount / stats.totalRequests) * 100) : 0}%
                </span>
              </div>
              <p className="text-[10px] text-[#88857F]">{stats.successCount} of {stats.totalRequests} OK</p>
            </div>

            <div className="bg-[#2B2A27]/50 border border-[#3A3834] rounded-2xl p-4 space-y-1 col-span-2 md:col-span-1">
              <p className="text-[11px] text-[#88857F] uppercase tracking-wider font-bold">Last 429 Error</p>
              <div className="flex items-center gap-2 py-1">
                <Clock className="w-4 h-4 text-[#88857F]" />
                <span className="text-[13px] text-white">
                  {stats.last429 ? new Date(stats.last429).toLocaleTimeString() : 'None'}
                </span>
              </div>
              <p className="text-[10px] text-amber-500/80">{stats.last429 ? 'Wait 60s if recent' : 'All clear'}</p>
            </div>
          </div>

          {/* Activity Log */}
          <div className="space-y-3">
            <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#D4A373]" /> Recent Activity
            </h3>
            <div className="bg-[#151413] border border-[#3A3834] rounded-2xl overflow-hidden shadow-inner">
              {logs.length === 0 ? (
                <div className="p-12 text-center text-[#88857F] text-[13px]">No request activity logged yet.</div>
              ) : (
                <div className="divide-y divide-[#3A3834]">
                  {logs.map((log, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-[#2B2A27]/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {log.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <div>
                          <p className="text-[13px] font-medium text-[#EBEBE6]">
                            {log.status === 'success' ? 'PRD Generated' : 'Request Failed'}
                          </p>
                          <p className="text-[11px] text-[#88857F]">{log.model}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-[#EBEBE6]">{new Date(log.timestamp).toLocaleTimeString()}</p>
                        {log.errorType && (
                          <p className="text-[10px] text-red-400/70 max-w-[120px] truncate" title={log.errorType}>
                            {log.errorType}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quota Info */}
          <div className="bg-[#D4A373]/5 border border-[#D4A373]/20 rounded-2xl p-4 flex gap-4">
            <div className="w-10 h-10 bg-[#D4A373]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-[#D4A373]" />
            </div>
            <div>
              <h4 className="text-[14px] font-semibold text-white">Free Tier Limits</h4>
              <p className="text-[12px] text-[#88857F] leading-relaxed">
                Gemini 2.0 Flash (Free Tier) typically allows up to <strong>15 requests per minute (RPM)</strong> and <strong>1,000,000 tokens per minute (TPM)</strong>. Exceeding these will result in a 429 error.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#3A3834] bg-[#2B2A27]/30 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-[#2B2A27] text-white font-medium rounded-xl hover:bg-[#3A3834] transition-all border border-[#3A3834]"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UsageStats;
