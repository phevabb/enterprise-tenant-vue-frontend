export const getTenantSlug = () => {
  const host = window.location.hostname
  const parts = host.split('.')

  // ras.localhost → ras
  if (parts.length > 1 && parts[0] !== 'localhost') {
    return parts[0]
  }

  // fallback (optional)
  return localStorage.getItem('tenantSlug')
}
