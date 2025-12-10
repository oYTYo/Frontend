import createAxios from '@/utils/request'

const systemBaseUrl = import.meta.env.VITE_SYSTEM_BASE_URL

// QoE树查询
export function queryQoeTree(params = {}) {
  return createAxios().get(`${systemBaseUrl}/api/system/qoe/tree`, { params })
}

// QoE列表查询
export function queryQoeList(params = {}, option?: RequestOption) {
  return createAxios(option).post(`${systemBaseUrl}/api/system/qoe/query`, params)
}

// 保存QoE
export function postSaveQoe(params = {}, option?: RequestOption) {
  return createAxios(option).post(`${systemBaseUrl}/api/system/qoe/save`, params)
}

// 获取QoE详情
export function getQoeById(id: number) {
  return createAxios().get(`${systemBaseUrl}/api/system/qoe/get/${id}`)
}

// 批量删除QoE
export function delQoeByIds(ids: string, option?: RequestOption) {
  return createAxios(option).delete(`${systemBaseUrl}/api/system/qoe/del`, { params: { ids } })
}
