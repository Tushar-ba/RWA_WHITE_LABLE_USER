export interface LogData {
  message: string;
  data?: any;
  timestamp?: Date;
}

export class Logger {
  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  static info(message: string, data?: any): void {
    console.log(`[INFO] ${this.formatTimestamp()} - ${message}`, data ? data : '');
  }

  static error(message: string, error?: any): void {
    console.error(`[ERROR] ${this.formatTimestamp()} - ${message}`, error ? error : '');
  }

  static warn(message: string, data?: any): void {
    console.warn(`[WARN] ${this.formatTimestamp()} - ${message}`, data ? data : '');
  }

  static debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${this.formatTimestamp()} - ${message}`, data ? data : '');
    }
  }

  static api(method: string, path: string, statusCode: number, duration: number, response?: any): void {
    let logLine = `${method} ${path} ${statusCode} in ${duration}ms`;
    
    if (response) {
      logLine += ` :: ${JSON.stringify(response)}`;
    }

    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + "…";
    }

    console.log(`[API] ${this.formatTimestamp()} - ${logLine}`);
  }
}