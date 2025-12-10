/**
 * 静态菜单，只有在开发环境显示
 */
export const devMenus = [
  {
    id: -9,
    title: '首页',
    name: 'home',
    path: 'home',
    component: '/src/views/home/index.vue',
    type: 'menu',
    handleType: 'route',
    icon: 'el|menu',
    cache: true,
    enabled: true
  },

  // ====== 这里开始：按你的新结构改成同级 ======

  {
    id: -5,
    title: '设备管理',
    name: 'dept',
    path: 'dept',
    component: '/src/views/system/dept/index.vue',
    type: 'menu',
    handleType: 'route',
    icon: 'el|OfficeBuilding',
    cache: true,
    enabled: true
  },
  {
    id: -6,
    title: 'QoE分析',
    name: 'qoe-analysis',
    path: 'qoe-analysis',
    component: '/src/views/system/qoe-analysis/index.vue',
    type: 'menu',
    handleType: 'route',
    icon: 'el|User',
    cache: true,
    enabled: true
  },
  {
    id: -7,
    title: '异常检测',
    name: 'anomaly-detection',
    path: 'anomaly-detection',
    component: '/src/views/system/anomaly-detection/index.vue',
    type: 'menu',
    handleType: 'route',
    icon: 'el|User',
    cache: true,
    enabled: true
  },
  {
    id: -101,
    title: '指标监控',
    name: 'metric-monitor',
    path: 'metric-monitor',
    component: '/src/views/system/metric-monitor/index.vue',
    type: 'menu',
    handleType: 'route',
    icon: 'el|User',
    cache: true,
    enabled: true
  },
  {
    id: -102,
    title: '趋势分析',
    name: 'trend-analysis',
    path: 'trend-analysis',
    component: '/src/views/system/trend-analysis/index.vue',
    type: 'menu',
    handleType: 'route',
    icon: 'el|User',
    cache: true,
    enabled: true
  }

  // ====== 这里结束 ======
]
