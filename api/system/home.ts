
import createAxios from '@/utils/request'

const systemBaseUrl = import.meta.env.VITE_SYSTEM_BASE_URL

// 获取首页图表数据
export function getHomeChartData(params = {}) {
  // 临时返回模拟数据
  console.log('Query chart data params:', params) // 使用参数避免ESLint警告
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          devices: [
            {
              id: 1,
              deviceCode: 'IPC000001',
              deviceName: '摄像头设备001',
              qoeScore: 85,
              performanceScore: 78,
              status: 'online'
            },
            {
              id: 2,
              deviceCode: 'IPC000002',
              deviceName: '摄像头设备002',
              qoeScore: 72,
              performanceScore: 89,
              status: 'online'
            },
            {
              id: 3,
              deviceCode: 'IPC000003',
              deviceName: '摄像头设备003',
              qoeScore: 91,
              performanceScore: 65,
              status: 'online'
            },
            {
              id: 4,
              deviceCode: 'IPC000004',
              deviceName: '摄像头设备004',
              qoeScore: 68,
              performanceScore: 93,
              status: 'offline'
            }
          ]
        }
      })
    }, 100)
  })
  // 真实API调用（注释掉）
  // return createAxios().get(`${systemBaseUrl}/api/system/home/chart-data`, { params })
}

// 获取设备状态统计
export function getDeviceStatusStats(params = {}) {
  // 临时返回模拟数据
  console.log('Query device status params:', params) // 使用参数避免ESLint警告
  // return new Promise((resolve) => {
  //   setTimeout(() => {
  //     resolve({
  //       data: {
  //         deviceStatus: {
  //           online: 85,
  //           offline: 15,
  //           total: 100
  //         },
  //         networkQuality: {
  //           excellent: 72,
  //           good: 20,
  //           fair: 8
  //         },
  //         streamQuality: {
  //           hd: 91,
  //           sd: 7,
  //           ld: 2
  //         },
  //         systemMonitor: {
  //           normal: 68,
  //           warning: 25,
  //           error: 7
  //         }
  //       }
  //     })
  //   }, 100)
  // })
  // 真实API调用（注释掉）
  return createAxios().get(`${systemBaseUrl}/api/system/home/device-stats`, { params })
}

// 获取实时性能指标
export function getPerformanceMetrics(params = {}) {
  // 临时返回模拟数据
  console.log('Query performance metrics params:', params) // 使用参数避免ESLint警告
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          metrics: [
            {
              deviceCode: 'IPC000001',
              cpuUsage: 78,
              memoryUsage: 65,
              networkLatency: 12,
              bandwidth: 2048
            },
            {
              deviceCode: 'IPC000002',
              cpuUsage: 89,
              memoryUsage: 72,
              networkLatency: 8,
              bandwidth: 1024
            },
            {
              deviceCode: 'IPC000003',
              cpuUsage: 65,
              memoryUsage: 58,
              networkLatency: 15,
              bandwidth: 4096
            },
            {
              deviceCode: 'IPC000004',
              cpuUsage: 93,
              memoryUsage: 88,
              networkLatency: 25,
              bandwidth: 512
            }
          ]
        }
      })
    }, 100)
  })
  // 真实API调用（注释掉）
  // return createAxios().get(`${systemBaseUrl}/api/system/home/performance-metrics`, { params })
}

// 获取设备列表（用于图表横坐标）
export function getDeviceList(params = {}) {
  // 临时返回模拟数据
  console.log('Query device list params:', params) // 使用参数避免ESLint警告
  // return new Promise((resolve) => {
  //   setTimeout(() => {
  //     const deviceCount = 4; // 模拟设备数量
  //     resolve({
  //       data: {
  //         devices: ['IPC000001', 'IPC000002', 'IPC000003', 'IPC000004'],
  //         indexA: Array.from({ length: deviceCount }, () => Math.floor(Math.random() * 41) + 60), // 60~100
  //         indexB: Array.from({ length: deviceCount }, () => Math.floor(Math.random() * 41) + 60) // 60~100
  //       }
  //     })
  //   }, 100)
  // })
  // 真实API调用（注释掉）
  return createAxios().get(`${systemBaseUrl}/api/system/home/device-list`, { params })
}
// 获取异常类型与持续时间（opsBar表格数据）
export function getOpsBarData(params = {}) {
  // 真实API调用
  return createAxios().get(`${systemBaseUrl}/api/system/home/ops-bar-data`, { params })
}