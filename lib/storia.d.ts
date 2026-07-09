import { BackendAdapter, PluginRegistry } from './index';

export interface StoriaConfig {
  backend?: 'memory' | 'filesystem' | string;
  storiaDir?: string;
  logger?: Logger;
  telemetry?: Telemetry;
  logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent';
  plugins?: Plugin[];
  retry?: RetryOptions;
  state?: { schemaVersion?: string };
  validation?: { strict?: boolean };
  workflow?: { maxRetries?: number };
  memory?: { cacheSize?: number };
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  factor?: number;
  jitter?: boolean;
  retryable?: (err: Error) => boolean;
}

export interface RunOptions {
  prompt: string;
  storyId?: string;
  personas?: { primary?: string; secondary?: string; style?: string };
  language?: string;
  metadata?: { title?: string; genre?: string[]; themes?: string[] };
}

export interface RunResult {
  success: boolean;
  storyId: string;
  intent: any;
  workflow: any;
  story?: any;
  error?: string;
  correlationId: string;
  durationMs: number;
}

export interface HealthReport {
  version: string;
  status: 'ok' | 'degraded' | 'down';
  engines: { orchestrator: boolean; stateManager: boolean; validator: boolean };
  backend: { type: string; ready: boolean };
  plugins?: string[];
  metrics?: any;
  logger?: { level: string };
  uptime: string;
}

export interface Logger {
  info(msg: string, data?: any): void;
  warn(msg: string, data?: any): void;
  error(msg: string, data?: any): void;
  debug(msg: string, data?: any): void;
  trace(msg: string, data?: any): void;
  child(context: any): Logger;
  readonly level: string;
}

export interface Telemetry {
  track(name: string, data?: any): void;
  histogram(name: string, value: number, tags?: any): void;
  gauge(name: string, value: number): void;
  increment(name: string, by?: number): void;
  startSpan(name: string, tags?: any): string;
  endSpan(spanId: string, tags?: any): number | null;
  snapshot(): any;
  on(type: string, fn: Function): Function;
  reset(): void;
}

export interface Plugin {
  name: string;
  version?: string;
  personas?: any;
  workflows?: any;
  backend?: any;
  telemetry?: any;
  hooks?: {
    onBeforeInit?: (config: StoriaConfig) => Promise<void>;
    onAfterInit?: (config: StoriaConfig) => Promise<void>;
    onBeforeRun?: (options: RunOptions) => Promise<void>;
    onAfterRun?: (result: RunResult) => Promise<void>;
    onError?: (err: Error) => Promise<void>;
    onShutdown?: () => Promise<void>;
  };
}

export class Storia {
  constructor(config?: StoriaConfig);
  run(promptOrOptions: string | RunOptions): Promise<RunResult>;
  load(storyId: string): Promise<any>;
  save(storyId: string, state?: any, reason?: string): Promise<void>;
  health(): Promise<HealthReport>;
  export(storyId: string): Promise<any>;
  import(exportData: any, newStoryId?: string): Promise<string>;
  use(plugin: Plugin): Storia;
  readonly orchestrator: any;
  readonly plugins: PluginRegistry;
  readonly config: StoriaConfig;
}

export namespace Errors {
  export class StoriaError extends Error {
    code: string;
    cause: Error | null;
    details: any;
    toJSON(): any;
  }
  export class ConfigError extends StoriaError {}
  export class StateError extends StoriaError {}
  export class StateVersionError extends StateError {}
  export class ValidationError extends StoriaError {}
  export class BackendError extends StoriaError {}
  export class BackendNotFoundError extends BackendError {}
  export class PluginError extends StoriaError {}
  export class EngineError extends StoriaError {}
  export class PipelineError extends EngineError {}
  export class PersonaError extends EngineError {}
  export class WorkflowError extends StoriaError {}
  export class RetryError extends BackendError {}
}

export namespace BackendAdapters {
  export class BackendAdapter {
    readonly type: string;
    initialize(config: any): Promise<void>;
    load(storyId: string): Promise<any>;
    save(storyId: string, state: any, reason?: string): Promise<void>;
    list(): Promise<string[]>;
    exists(storyId: string): Promise<boolean>;
    delete(storyId: string): Promise<void>;
    health(): Promise<boolean>;
  }
  export function registerBackend(name: string, adapterClass: any): void;
  export function createBackend(name: string, config: any): BackendAdapter;
  export function listBackends(): string[];
}

export class MemoryBackend extends BackendAdapters.BackendAdapter {}
export class FilesystemBackend extends BackendAdapters.BackendAdapter {}

export class PluginRegistry {
  register(plugin: Plugin): void;
  get(name: string): Plugin | null;
  list(): string[];
  clear(): void;
  runHook(hook: string, ...args: any[]): Promise<any[]>;
  getPersonaPacks(): any[];
  getWorkflowPacks(): any[];
}

export const Security: {
  validateStoryId(id: string): string;
  validatePrompt(prompt: string): string;
  validateConfig(config: any): any;
  sanitizeStoragePath(base: string, id: string): string;
  computeChecksum(data: any): string;
  verifyChecksum(data: any, checksum: string): boolean;
  validateStateSize(data: any): number;
};

export function retry<T>(fn: () => Promise<T>, opts?: RetryOptions): Promise<T>;
export { RetryError } from './retry';
export { Logger } from './logger';
export { Telemetry } from './telemetry';
