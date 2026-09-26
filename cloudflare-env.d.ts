interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = D1Result>(statements: D1PreparedStatement[]): Promise<T[]>;
}

interface R2HTTPMetadata {
  contentType?: string;
}

interface R2PutOptions {
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
}

interface R2ObjectBody {
  body: ReadableStream;
  httpEtag: string;
  writeHttpMetadata(headers: Headers): void;
}

interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | Blob, options?: R2PutOptions): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
}

interface CloudflareEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
  IISPC_ADMIN_USER_IDS?: string;
}

declare module "cloudflare:workers" {
  export const env: CloudflareEnv;
}
