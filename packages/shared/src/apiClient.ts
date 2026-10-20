/**
 * Resilient API Client
 * Ensures that responses are verified for JSON content-type and valid HTTP status
 * before parsing, preventing "Unexpected token '<'" exceptions.
 */
export async function safeApiFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string; message?: string; [key: string]: any }> {
  try {
    const response = await fetch(input, init);
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const text = await response.text();
      // Strip any HTML tags to extract a clean human-readable error message
      const snippet = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
      return {
        success: false,
        error: `Server responded with ${response.status} (${response.statusText || 'Error'}): ${snippet || 'Endpoint returned HTML instead of JSON. Ensure backend is running.'}`,
      };
    }

    const data = await response.json();
    if (!response.ok && !data.error) {
      data.error = `HTTP Error ${response.status}: ${response.statusText}`;
      data.success = false;
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network request failed. Please check your connection.',
    };
  }
}
