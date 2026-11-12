import { APIRequestContext, APIResponse, request } from '@playwright/test';

export class ApiClient {
  private readonly baseURL: string;
  private context!: APIRequestContext;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async init(): Promise<void> {
    const bearerToken = process.env.BEARER_TOKEN;
    const xApiKey = process.env.X_API_KEY;

    if (!bearerToken) {
      throw new Error('BEARER_TOKEN environment variable is not set.');
    }
    if (!xApiKey) {
      throw new Error('X_API_KEY environment variable is not set.');
    }

    this.context = await request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: {
        authorization: `Bearer ${bearerToken}`,
        'x-api-key': xApiKey,
      },
      // Ignore HTTPS certificate verification errors (common in corporate/staging environments).
      // In production, this should only be set if the API uses a self-signed or internal CA cert.
      ignoreHTTPSErrors: true,
    });
  }

  get requestContext(): APIRequestContext {
    return this.context;
  }

  private ensureInitialized(): void {
    if (!this.context) {
      throw new Error('APIRequestContext is not initialized. Call init() before using the client.');
    }
  }

  async get(path: string): Promise<APIResponse> {
    this.ensureInitialized();
    return this.context.get(path);
  }

  async post(path: string, data?: unknown): Promise<APIResponse> {
    this.ensureInitialized();
    return this.context.post(path, { data });
  }

  async put(path: string, data?: unknown): Promise<APIResponse> {
    this.ensureInitialized();
    return this.context.put(path, { data });
  }

  async delete(path: string): Promise<APIResponse> {
    this.ensureInitialized();
    return this.context.delete(path);
  }

  async dispose(): Promise<void> {
    if (this.context) {
      await this.context.dispose();
    }
  }
}