import axios from 'axios'

const configuredTenantApiUrl =
  import.meta.env.VITE_TENANT_API_BASE_URL

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

    const tenantCode =
      localStorage.getItem('tenantCode') || ''

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
