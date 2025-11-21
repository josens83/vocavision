// Phase 2-7: Structured Logging System
// Benchmarking: Winston, Pino, DataDog logs

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  user?: {
    id?: string;
    email?: string;
  };
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  };
  performance?: {
    duration?: number;
    memory?: number;
  };
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxBufferSize: number;
  flushInterval: number; // ms
}

const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableRemote: false,
  maxBufferSize: 100,
  flushInterval: 30000, // 30s
};

class Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.enableRemote) {
      this.startAutoFlush();
    }
  }

  /**
   * Log message
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    // Check if level is enabled
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
    };

    // Add to buffer
    this.buffer.push(entry);

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Flush if buffer is full
    if (this.buffer.length >= this.config.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Debug log
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Info log
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Warning log
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Error log
   */
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      metadata,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };

    this.buffer.push(entry);

    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Flush errors immediately
    if (this.config.enableRemote) {
      this.flush();
    }
  }

  /**
   * Fatal error log
   */
  fatal(message: string, error?: Error, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.FATAL,
      message,
      metadata,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };

    this.buffer.push(entry);

    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Flush fatal errors immediately
    this.flush();
  }

  /**
   * Log to console with appropriate styling
   */
  private logToConsole(entry: LogEntry): void {
    const { level, message, metadata, error } = entry;

    const styles = {
      [LogLevel.DEBUG]: 'color: #6b7280',
      [LogLevel.INFO]: 'color: #3b82f6',
      [LogLevel.WARN]: 'color: #f59e0b; font-weight: bold',
      [LogLevel.ERROR]: 'color: #ef4444; font-weight: bold',
      [LogLevel.FATAL]: 'color: #dc2626; font-weight: bold; font-size: 16px',
    };

    const prefix = `[${entry.timestamp}] [${level}]`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`%c${prefix} ${message}`, styles[level], metadata || '');
        break;
      case LogLevel.INFO:
        console.log(`%c${prefix} ${message}`, styles[level], metadata || '');
        break;
      case LogLevel.WARN:
        console.warn(`%c${prefix} ${message}`, styles[level], metadata || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(`%c${prefix} ${message}`, styles[level], metadata || '', error || '');
        break;
    }
  }

  /**
   * Check if log level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const configLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= configLevelIndex;
  }

  /**
   * Flush logs to remote endpoint
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const logsToSend = [...this.buffer];
    this.buffer = [];

    if (!this.config.enableRemote || !this.config.remoteEndpoint) {
      return;
    }

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
      });
    } catch (error) {
      console.error('[Logger] Failed to send logs:', error);
      // Put logs back in buffer
      this.buffer.unshift(...logsToSend);
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Stop auto-flush timer
   */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Clear buffer
   */
  clearBuffer(): void {
    this.buffer = [];
  }
}

// Global logger instance
export const logger = new Logger();

/**
 * Context logger - Add context to all logs
 */
export function createContextLogger(context: string, metadata?: Record<string, any>) {
  return {
    debug: (message: string, meta?: Record<string, any>) =>
      logger.debug(`[${context}] ${message}`, { ...metadata, ...meta }),

    info: (message: string, meta?: Record<string, any>) =>
      logger.info(`[${context}] ${message}`, { ...metadata, ...meta }),

    warn: (message: string, meta?: Record<string, any>) =>
      logger.warn(`[${context}] ${message}`, { ...metadata, ...meta }),

    error: (message: string, error?: Error, meta?: Record<string, any>) =>
      logger.error(`[${context}] ${message}`, error, { ...metadata, ...meta }),

    fatal: (message: string, error?: Error, meta?: Record<string, any>) =>
      logger.fatal(`[${context}] ${message}`, error, { ...metadata, ...meta }),
  };
}

/**
 * Performance logger
 */
export class PerformanceLogger {
  private startTime: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = performance.now();
  }

  end(metadata?: Record<string, any>): void {
    const duration = performance.now() - this.startTime;
    logger.info(`Performance: ${this.name}`, {
      ...metadata,
      duration: `${duration.toFixed(2)}ms`,
    });
  }
}

/**
 * Measure function execution time
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const perf = new PerformanceLogger(name);
  try {
    const result = await fn();
    perf.end({ status: 'success' });
    return result;
  } catch (error) {
    perf.end({ status: 'error' });
    throw error;
  }
}

console.log('[Logger] Initialized');
