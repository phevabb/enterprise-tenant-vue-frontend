import axios from 'axios'

const configuredTenantApiUrl =
  import.meta.env.VITE_TENANT_API_BASE_URL ||
  'http://127.0.0.1:9001/api'

// Production URL:
// const configuredTenantApiUrl =
//   'https://your-production-domain.com/api'

const tenantRootUrl =
  configuredTenantApiUrl.replace(
    /\/api\/?$/,
    '/'
  )

const tenantInternalApi =
  axios.create({
    baseURL: tenantRootUrl,

    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

tenantInternalApi.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('token') ||
      ''

    const tenantCode =
      localStorage.getItem('tenantCode') ||
      ''

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`
    }

    if (tenantCode) {
      config.headers['X-Tenant-Code'] =
        tenantCode
    }

    return config
  },

  (error) => {
    return Promise.reject(error)
  }
)

export default tenantInternalApi
