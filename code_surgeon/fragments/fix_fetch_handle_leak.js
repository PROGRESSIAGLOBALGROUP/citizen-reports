async function fetchWithTimeout(url, timeoutMs, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    // CRITICAL: Consume response body to close connection
    // This prevents TCPWRAP open handle leak in Node.js fetch
    if (!response.bodyUsed) {
      await response.arrayBuffer(); // Force body consumption
    }
    return response;
  } finally {
    clearTimeout(timer);
  }
}
