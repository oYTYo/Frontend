/**
 * 图表颜色配置
 * 统一管理所有图表和颜色条的颜色方案
 */

export interface ColorItem {
  color: string
  text: string
}

// 统一的颜色配置 - 更协调的现代配色方案
export const COLOR_SCHEME: ColorItem[] = [
  { color: '#5B8FF9', text: '设备状态' }, // 现代蓝色
  { color: '#5AD8A6', text: '网络质量' }, // 清新绿色
  { color: '#FF6B6B', text: '流媒体' },   // 活力橙红色
  { color: '#FFD93D', text: '系统监控' }  // 明亮黄色
]

// 导出颜色数组（用于图表）
export const CHART_COLORS = COLOR_SCHEME.map(item => item.color)

// 导出颜色项（用于颜色条）
export const COLOR_ITEMS = COLOR_SCHEME

// 可选：导出单个颜色（如果需要单独使用）
export const DEVICE_STATUS_COLOR = COLOR_SCHEME[0].color    // #5B8FF9
export const NETWORK_QUALITY_COLOR = COLOR_SCHEME[1].color  // #5AD8A6
export const STREAM_QUALITY_COLOR = COLOR_SCHEME[2].color   // #FF6B6B
export const SYSTEM_MONITOR_COLOR = COLOR_SCHEME[3].color   // #FFD93D

// 可选：提供其他颜色主题
export const ALTERNATIVE_COLOR_SCHEME: ColorItem[] = [
  { color: '#1890FF', text: '设备状态' }, // 蚂蚁蓝
  { color: '#52C41A', text: '网络质量' }, // 极光绿
  { color: '#FA541C', text: '流媒体' },   // 火山橙
  { color: '#FAAD14', text: '系统监控' }  // 日暮黄
]

// 深色主题颜色方案
export const DARK_COLOR_SCHEME: ColorItem[] = [
  { color: '#177DDC', text: '设备状态' }, // 深蓝
  { color: '#49AA19', text: '网络质量' }, // 深绿
  { color: '#D84A1B', text: '流媒体' },   // 深橙
  { color: '#D89614', text: '系统监控' }  // 深黄
]