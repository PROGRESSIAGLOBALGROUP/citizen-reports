async function apiCall(url, options = {}) {
  if (USE_MOCK) {
    console.log(`🔧 Usando mock para: ${url}`);
    return mockFetch(url, options);
  }
  
  // Intentar llamada real sin fallback automático
  const response = await fetch(url, options);
  
  // Si falla, lanzar error en lugar de usar mock silenciosamente
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API error ${response.status} para ${url}:`, errorText);
    throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
  }
  
  return response;
}