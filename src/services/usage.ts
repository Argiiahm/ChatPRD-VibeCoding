export interface RequestLog {
  timestamp: number;
  status: 'success' | 'error';
  errorType?: string;
  model: string;
}

const STORAGE_KEY = 'chatprd_usage_logs';

export const UsageTracker = {
  getLogs(): RequestLog[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  logRequest(status: 'success' | 'error', model: string, errorType?: string) {
    const logs = this.getLogs();
    const newLog: RequestLog = {
      timestamp: Date.now(),
      status,
      model,
      errorType
    };
    
    // Keep only last 100 logs
    const updatedLogs = [newLog, ...logs].slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
  },

  getStats() {
    const logs = this.getLogs();
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    return {
      totalRequests: logs.length,
      successCount: logs.filter(l => l.status === 'success').length,
      errorCount: logs.filter(l => l.status === 'error').length,
      requestsLastMinute: logs.filter(l => l.timestamp > oneMinuteAgo).length,
      requestsLastHour: logs.filter(l => l.timestamp > oneHourAgo).length,
      last429: logs.find(l => l.errorType?.includes('429'))?.timestamp || null,
    };
  },

  clearLogs() {
    localStorage.removeItem(STORAGE_KEY);
  }
};
