export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryableErrorCodes?: (string | number)[];
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 8000;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation(attempt);
    } catch (error: any) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable
      const status = error?.status || error?.statusCode || error?.response?.status;
      const isRateLimitOrServer =
        status === 429 || (typeof status === 'number' && status >= 500 && status <= 504);

      if (options.retryableErrorCodes && !options.retryableErrorCodes.includes(status)) {
        throw error;
      } else if (!options.retryableErrorCodes && status && !isRateLimitOrServer) {
        throw error;
      }

      // Calculate exponential delay with jitter
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * 300);
      const delayMs = Math.min(maxDelayMs, exponentialDelay + jitter);

      if (options.onRetry) {
        options.onRetry(error, attempt + 1, delayMs);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
