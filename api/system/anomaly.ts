
import createAxios from '@/utils/request'

const systemBaseUrl = import.meta.env.VITE_SYSTEM_BASE_URL


export function queryNetworkList(params = {}, option?: RequestOption) {
    // 临时返回模拟数据，后续可以替换为真实API调用
    console.log('Query params:', params, 'Options:', option) // 使用参数避免ESLint警告
    // 真实API调用（注释掉）
    return createAxios(option).get(`${systemBaseUrl}/api/system/anomaly/query/network`, params)
  }

export function queryContainerList(params = {}, option?: RequestOption) {
  // 临时返回模拟数据，后续可以替换为真实API调用
  console.log('Query params:', params, 'Options:', option) // 使用参数避免ESLint警告
  // 真实API调用（注释掉）
  return createAxios(option).get(`${systemBaseUrl}/api/system/anomaly/query/container`, params)
}

export function queryNetworkMetricsbyNetwork(params = {}, option?: RequestOption) {
  return createAxios(option).get(
    `${systemBaseUrl}/api/system/anomaly/query/networkmetricsanderrorsbykey`,
    { params }
  )
}

export function queryContainerMetricsbyContainer(params = {}, option?: RequestOption) {
  return createAxios(option).get(
    `${systemBaseUrl}/api/system/anomaly/query/containermetricsanderrorsbykey`,
    { params }
  )
}

export function queryLastWindowNetworkMetrics(params = {}, option?: RequestOption) {
  return createAxios(option).get(
    `${systemBaseUrl}/api/system/anomaly/query/lastwindownetwork`,
    { params }
  )
}

export function queryLastWindowContainerMetrics(params = {}, option?: RequestOption) {
  return createAxios(option).get(
    `${systemBaseUrl}/api/system/anomaly/query/lastwindowcontainer`,
    { params }
  )
}

