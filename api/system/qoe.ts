
import createAxios from '@/utils/request'

const systemBaseUrl = import.meta.env.VITE_SYSTEM_BASE_URL

// const qoe=false


// 获取 QoE 指标列表（模拟数据）
export async function getQoeMetricsData(params = {}, option?: RequestOption) {
  // 模拟数据，和前端指标表格一致
  console.log('Query params:', params, 'Options:', option) // 使用参数避免ESLint警告
  // return Promise.resolve({
  //   data: [
  //     { name: '视频清晰度', value: '76', unit: '分', status: '良好' },
  //     { name: '视频流畅度', value: '82', unit: '分', status: '优秀' },
  //     { name: '视频卡顿率', value: '0.8', unit: '%', status: '正常' },
  //     { name: '码率', value: '1.5', unit: 'Mbps', status: '正常' },
  //     { name: '丢包', value: '0.2', unit: '%', status: '正常' },
  //     { name: '抖动', value: '23', unit: 'ms', status: '警告' },
  //   ]
  // })
  // if(qoe){
  //   return Promise.resolve({
  //     data: [
  //       { name: '视频清晰度', value: '62', unit: '分', status: '良好' },
  //       { name: '视频流畅度', value: '82', unit: '分', status: '优秀' },
  //       { name: '视频卡顿率', value: '1.2', unit: '%', status: '正常' },
  //       { name: '码率', value: '1.57', unit: 'Mbps', status: '正常' },
  //       { name: '丢包', value: '0.36', unit: '%', status: '正常' },
  //       { name: '抖动', value: '23', unit: 'ms', status: '警告' },
  //     ]
  //   })
  // }else{
  //   return Promise.resolve({
  //     data: [
  //       { name: '视频清晰度', value: '32', unit: '分', status: '良好' },
  //       { name: '视频流畅度', value: '24', unit: '分', status: '优秀' },
  //       { name: '视频卡顿率', value: '11.3', unit: '%', status: '正常' },
  //       { name: '码率', value: '0.9', unit: 'Mbps', status: '正常' },
  //       { name: '丢包', value: '0.7', unit: '%', status: '正常' },
  //       { name: '抖动', value: '26', unit: 'ms', status: '警告' },
  //     ]
  //   })

  // }
  return createAxios(option).get(`${systemBaseUrl}/api/system/qoe/metric`, params)
}

// 获取QoE指标趋势模拟数据
export function getQoeMetricTrendData(metricName) {
  // 均值配置
  // if(qoe){
  //   time+=3
  //   const meanMap = {
  //     '视频清晰度': 62,
  //     '视频流畅度': 82,
  //     '视频卡顿率': 1.2,
  //     '码率': 1.57,
  //     '丢包': 0.36,
  //     '抖动': 23
  //   }
  //   const meanMapLow = {
  //     '视频清晰度': 32,
  //     '视频流畅度': 24,
  //     '视频卡顿率': 11.3,
  //     '码率': 0.9,
  //     '丢包': 0.7,
  //     '抖动': 26
  //   }
  //   // trend数组为均值附近波动
  //   const mean = meanMap[metricName] ?? 0
  //   let trend
  //   if (metricName === '视频卡顿率') {
  //     const trendLow = [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0]
  //     // trend的前(50-time)个为trendLow的后(50-time)个，后time个为0
  //     trend = trendLow.slice(trendLow.length - (50 - time)).concat(Array(time).fill(0))
  //   } else {
  //     // 前(50-time)个用meanMapLow，后time个用meanMap
  //     const lowMean = meanMapLow[metricName] ?? 0
  //     const lowArr = Array.from({ length: 50 - time }, () => {
  //       const delta = lowMean * (Math.random() * 0.4 - 0.2)
  //       return Number((lowMean + delta).toFixed(2))
  //     })
  //     const highArr = Array.from({ length: time }, () => {
  //       const delta = mean * (Math.random() * 0.4 - 0.2)
  //       return Number((mean + delta).toFixed(2))
  //     })
  //     trend = lowArr.concat(highArr)
  //   }
    
  //   return new Promise((resolve) => {
  //     setTimeout(() => {
  //       resolve({
  //         data: {
  //           data: { trend }
  //         }
  //       })
  //     }, 100)
  //   })
  // }else{
  //   const meanMap = {
  //     '视频清晰度': 32,
  //     '视频流畅度': 24,
  //     '视频卡顿率': 11.3,
  //     '码率': 0.9,
  //     '丢包': 0.7,
  //     '抖动': 26
  //   }
  //   // trend数组为均值附近波动
  //   const mean = meanMap[metricName] ?? 0
  //   let trend
  //   if (metricName === '视频卡顿率') {
  //     // 卡顿率为百分比，计算1的数量
  //     // const percent = Math.max(0, Math.min(1, mean / 100))
  //     // const ones = Math.round(percent * 50)
  //     trend = [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0]
  //     // 随机打乱顺序
  //     // for (let i = trend.length - 1; i > 0; i--) {
  //     //   const j = Math.floor(Math.random() * (i + 1))
  //     //   ;[trend[i], trend[j]] = [trend[j], trend[i]]
  //     // }
  //   } else {
  //     trend = Array.from({ length: 50 }, () => {
  //       let delta = 0

  //       delta = mean * (Math.random() * 0.4 - 0.2)
        
  //       return Number((mean + delta).toFixed(2))
  //     })
  //   }
  //   return new Promise((resolve) => {
  //     setTimeout(() => {
  //       resolve({
  //         data: {
  //           data: { trend }
  //         }
  //       })
  //     }, 100)
  //   })
  // }
  // 真实API调用（注释掉）
  return createAxios().get(`${systemBaseUrl}/api/system/qoe/metrictrend/${metricName}`)
}
// QoE树查询
export function queryQoeTree(params = {}) {
  // 临时返回模拟树形数据
  console.log('Query tree params:', params) // 使用参数避免ESLint警告
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          list: [
            {
              id: 1,
              name: '设备组1',
              deviceName: '设备组1',
              parentId: null,
              children: []
            },
            {
              id: 2,
              name: '摄像头设备001',
              deviceName: '摄像头设备001',
              parentId: 1,
              children: []
            },
            {
              id: 3,
              name: '摄像头设备002',
              deviceName: '摄像头设备002',
              parentId: 1,
              children: []
            },
            {
              id: 4,
              name: '设备组2',
              deviceName: '设备组2',
              parentId: null,
              children: []
            }
          ]
        }
      })
    }, 100)
  })
  // 真实API调用（注释掉）
  // return createAxios().get(`${systemBaseUrl}/api/system/qoe/tree`, { params })
}

// QoE列表查询
export function queryQoeList(params = {}, option?: RequestOption) {
  // 临时返回模拟数据，后续可以替换为真实API调用
  console.log('Query params:', params, 'Options:', option) // 使用参数避免ESLint警告
  // return new Promise((resolve) => {
  //   setTimeout(() => {
  //     resolve({
  //       data: {
  //         list: [
  //           {
  //             id: 1,
  //             ipcNumber: 'IPC009',
  //             streamId: 'STREAM001',
  //             ipAddress: '192.168.1.100',
  //             deviceName: '摄像头设备001',
  //             accessProtocol: 'RTSP',
  //             qoeEnabled: true,
  //             clientAddress: '192.168.1.200',
  //             transportProtocol: 'TCP',
  //             averageBitrate: '2048kbps',
  //             createTime: '2025-01-15 10:30:00',
  //             enabled: true,
  //             updateTime: '2025-01-15 10:30:00',
  //             remark: '测试设备'
  //           },
  //           {
  //             id: 2,
  //             ipcNumber: 'IPC002',
  //             streamId: 'STREAM002',
  //             ipAddress: '192.168.1.101',
  //             deviceName: '摄像头设备002',
  //             accessProtocol: 'HTTP',
  //             qoeEnabled: false,
  //             clientAddress: '192.168.1.201',
  //             transportProtocol: 'UDP',
  //             averageBitrate: '1024kbps',
  //             createTime: '2025-01-15 11:00:00',
  //             enabled: true,
  //             updateTime: '2025-01-15 11:00:00',
  //             remark: '演示设备'
  //           }
  //         ],
  //         total: 2
  //       }
  //     })
  //   }, 100)
  // })
  // 真实API调用（注释掉）
  return createAxios(option).get(`${systemBaseUrl}/api/system/qoe/query`, params)
}

// 保存QoE
export function postSaveQoe(params = {}, option?: RequestOption) {
  // 临时返回模拟成功响应
  console.log('Save params:', params, 'Options:', option) // 使用参数避免ESLint警告

  // return new Promise((resolve) => {
  //   setTimeout(() => {
  //     resolve({
  //       data: {
  //         success: true,
  //         message: '保存成功'
  //       }
  //     })
  //   }, 100)
  // })
  // 真实API调用（注释掉）
  return createAxios(option).post(`${systemBaseUrl}/api/system/qoe/change`, params)
}

// 获取QoE详情
export function getQoeById(id: number) {
  // 临时返回模拟数据
  // return new Promise((resolve) => {
  //   setTimeout(() => {
  //     resolve({
  //       data: {
  //         id: id,
  //         ipcNumber: 'IPC001',
  //         streamId: 'STREAM001',
  //         ipAddress: '192.168.1.100',
  //         deviceName: '摄像头设备001',
  //         accessProtocol: 'RTSP',
  //         qoeEnabled: true,
  //         clientAddress: '192.168.1.200',
  //         transportProtocol: 'TCP',
  //         averageBitrate: '2048kbps',
  //         createTime: '2025-01-15 10:30:00',
  //         enabled: true,
  //         remark: '测试设备'
  //       }
  //     })
  //   }, 100)
  // })
  // 真实API调用（注释掉）
  return createAxios().get(`${systemBaseUrl}/api/system/qoe/queryById/${id}`)
}

// 批量删除QoE
// 批量启用QoE
export function batchEnableQoe(ids: number[], option?: RequestOption) {
  // 真实API调用，打印返回结果
  return createAxios(option)
    .post(`${systemBaseUrl}/api/stream/key-control`, { ids })
    .then(res => {
      console.log('batchEnableQoe 返回结果:', res)
      return res
    })
}


export function delQoeByIds(ids: string, option?: RequestOption) {
  // 临时返回模拟成功响应
  console.log('Delete ids:', ids, 'Options:', option) // 使用参数避免ESLint警告
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          success: true,
          message: '删除成功'
        }
      })
    }, 100)
  })
  // 真实API调用（注释掉）
  // return createAxios(option).delete(`${systemBaseUrl}/api/system/qoe/del`, { params: { ids } })
}