<template>
  <div class="trend-root">
    <div class="content-wrapper-vertical">
      
      <div class="monitor-panel top-panel">
        <div class="panel-header">
          <h3 class="panel-title">QoE 趋势分析</h3>
          <div class="controls">
            <el-select 
              v-model="currentQoeMetricName" 
              class="custom-select" 
              placeholder="选择指标"
              @change="handleQoeMetricChange"
            >
              <el-option 
                v-for="item in qoeMetricsOptions" 
                :key="item.name" 
                :label="item.name" 
                :value="item.name" 
              />
            </el-select>
            <el-button type="primary" :icon="Refresh" @click="refreshQoeChart" class="action-btn">刷新</el-button>
          </div>
        </div>
        
        <div class="chart-wrapper">
          <div ref="qoeChartRef" class="chart-container"></div>
        </div>
      </div>

      <div class="monitor-panel bottom-panel">
        <div class="panel-header">
          <h3 class="panel-title">实体指标趋势分析</h3>
          <div class="controls">
            <el-select v-model="entityType" class="custom-select" @change="handleTypeChange" placeholder="类型">
              <el-option label="网络" value="network" />
              <el-option label="容器" value="container" />
            </el-select>
            
            <el-select 
              v-model="currentEntityId" 
              class="custom-select entity-select" 
              placeholder="选择实体"
              @change="handleEntityChange"
            >
              <el-option 
                v-for="item in entityList" 
                :key="item.id || item.networkName || item.containerName" 
                :label="entityType === 'network' ? item.networkName : item.containerName"
                :value="item.id || item.networkName || item.containerName" 
              />
            </el-select>

            <el-select 
              v-model="currentEntityMetricProp" 
              class="custom-select" 
              placeholder="选择监测指标"
              @change="refreshEntityChart"
            >
              <el-option 
                v-for="field in currentMetricFields" 
                :key="field.prop" 
                :label="field.label"
                :value="field.prop" 
              />
            </el-select>

            <el-button type="primary" :icon="Refresh" @click="refreshEntityChart" class="action-btn">刷新</el-button>
          </div>
        </div>

        <div class="chart-wrapper">
          <div ref="entityChartRef" class="chart-container"></div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, toRef } from 'vue'
import { getQoeMetricsData, getQoeMetricTrendData } from '@/api/system/qoe'
import { 
  queryNetworkList, 
  queryContainerList, 
  queryLastWindowNetworkMetrics, 
  queryLastWindowContainerMetrics 
} from '@/api/system/anomaly'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useEcharts } from '@/utils'
import { useCssVar } from '@vueuse/core'

// ================= 通用工具 =================

// 生成更自然的模拟波动数据
const generateMockData = (length = 15, base = 50, fluctuation = 20) => {
  return Array.from({ length }, () => {
    const random = Math.random() * fluctuation - (fluctuation / 2)
    return Number((base + random).toFixed(2))
  })
}

// ================= QoE 趋势逻辑 (Top Panel) =================

const qoeMetricsOptions = ref<any[]>([])
const currentQoeMetricName = ref('')

// QoE图表配置
const qoeColor = ref({
  type: 'linear',
  x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [
    { offset: 0, color: useCssVar('--el-color-primary-light-7').value },
    { offset: 1, color: useCssVar('--el-color-primary').value }
  ]
})

const qoeOption = ref({
  color: qoeColor.value,
  title: {
    text: 'QoE 趋势示例',
    textStyle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    left: 'center',
    top: '10px'
  },
  tooltip: { 
    trigger: 'axis', 
    axisPointer: { type: 'shadow' },
    textStyle: { fontSize: 20 }
  },
  grid: { left: '3%', right: '4%', bottom: '5%', top: '15%', containLabel: true },
  xAxis: [
    {
      type: 'category',
      boundaryGap: false,
      data: Array.from({ length: 15 }, (_, i) => `${i + 1}s`),
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#666', fontSize: 20, fontWeight: 'bold' },
      axisTick: { show: false }
    }
  ],
  yAxis: [
    {
      type: 'value',
      name: '',
      nameTextStyle: { color: '#666', fontSize: 20, padding: [0, 30, 0, 0], fontWeight: 'bold' },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#666', fontSize: 20, fontWeight: 'bold' },
      splitLine: { lineStyle: { color: '#eee', type: 'dashed' } }
    }
  ],
  series: [
    {
      symbolSize: 8,
      symbol: 'circle',
      smooth: true,
      name: '数值',
      type: 'line',
      areaStyle: { opacity: 0.3 },
      lineStyle: { width: 4 },
      // 默认给一个模拟数据，防止空白
      data: generateMockData(15, 3.5, 1) 
    }
  ]
})

// 【关键修复】直接从 useEcharts 解构出 domRef 并命名为 qoeChartRef
// 这样模板中的 ref="qoeChartRef" 就会直接关联到这个 hook 内部管理的 DOM 引用
const { domRef: qoeChartRef, setOption: setQoeOption } = useEcharts(toRef(qoeOption))

// 初始化QoE数据
const initQoe = async () => {
  try {
    const res = await getQoeMetricsData()
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || [])
    qoeMetricsOptions.value = list
    
    if (list.length > 0) {
      currentQoeMetricName.value = list[0].name
      await refreshQoeChart()
    } else {
      await refreshQoeChart()
    }
  } catch (e) {
    console.error(e)
    await refreshQoeChart()
  }
}

const handleQoeMetricChange = () => {
  refreshQoeChart()
}

const refreshQoeChart = async () => {
  let trendData: number[] = []
  const metricName = currentQoeMetricName.value || '示例指标'

  if (currentQoeMetricName.value) {
    try {
      const res = await getQoeMetricTrendData(currentQoeMetricName.value)
      trendData = res?.data?.data?.trend || []
    } catch (e) {
      console.error(e)
    }
  }

  // 如果没有数据，使用模拟数据
  if (!trendData || trendData.length === 0) {
    trendData = generateMockData(15, 3.8, 1.2) // 生成 15 个点，基准值 3.8
    if (!currentQoeMetricName.value) ElMessage.info('暂无真实数据，已显示模拟趋势')
  } else {
    ElMessage.success('QoE趋势已更新')
  }
  
  // 更新图表数据
  qoeOption.value.title.text = `${metricName} - 趋势分析`
  qoeOption.value.series[0].data = trendData
  qoeOption.value.xAxis[0].data = Array.from({ length: trendData.length }, (_, i) => `${i + 1}s`)

  // 根据指标调整Y轴
  const yAxisConfig = getAxisConfig(metricName)
  qoeOption.value.yAxis[0].name = yAxisConfig.name
  qoeOption.value.yAxis[0].min = yAxisConfig.min
  qoeOption.value.yAxis[0].max = yAxisConfig.max

  setQoeOption(qoeOption.value)
}

// 辅助：获取轴配置
const getAxisConfig = (name: string) => {
  const map: Record<string, { name: string; min: number | null; max: number | null }> = {
    '视频清晰度': { name: '分', min: 0, max: 100 },
    '视频流畅度': { name: '分', min: 0, max: 100 },
    '视频卡顿率': { name: '%', min: 0, max: 5 },
    '码率': { name: 'Mbps', min: 0, max: 10 },
    '丢包': { name: '%', min: 0, max: 100 },
    '抖动': { name: 'ms', min: 0, max: 100 },
    '吞吐量': { name: 'Mbps', min: 0, max: 1000 }
  }
  return map[name] || { name: '数值', min: null, max: null }
}


// ================= 实体趋势逻辑 (Bottom Panel) =================

const entityType = ref('network') // network | container
const entityList = ref<any[]>([])
const currentEntityId = ref('')
const currentEntityObj = ref<any>(null)
const currentEntityMetricProp = ref('')

// 字段定义
const containerMetricFields = [
  { prop: 'processes', label: '进程数' },
  { prop: 'cpuUsage', label: 'CPU使用率' },
  { prop: 'memory', label: '内存使用' },
  { prop: 'writesBytes', label: '写入字节' },
  { prop: 'readsBytes', label: '读取字节' },
  { prop: 'receiveBytes', label: '接收字节' },
  { prop: 'transmitBytes', label: '传输字节' },
  { prop: 'receivePackets', label: '接收包数' },
  { prop: 'transmitPackets', label: '传输包数' }
]

const networkMetricFields = [
  { prop: 'jitter', label: '网络抖动' },
  { prop: 'throughout', label: '网络吞吐量' },
  { prop: 'packetLoss', label: '网络丢包率' },
  { prop: 'rtt', label: '网络延时' }
]

const currentMetricFields = computed(() => 
  entityType.value === 'network' ? networkMetricFields : containerMetricFields
)

// 实体图表配置
const entityOption = ref({
  color: qoeColor.value,
  title: {
    text: '实体指标趋势示例',
    textStyle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    left: 'center',
    top: '10px'
  },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, textStyle: { fontSize: 20 } },
  grid: { left: '3%', right: '4%', bottom: '5%', top: '15%', containLabel: true },
  xAxis: [
    {
      type: 'category',
      boundaryGap: false,
      data: Array.from({ length: 15 }, (_, i) => `${i + 1}s`),
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#666', fontSize: 20, fontWeight: 'bold' },
      axisTick: { show: false }
    }
  ],
  yAxis: [
    {
      type: 'value',
      nameTextStyle: { color: '#666', fontSize: 20, padding: [0, 30, 0, 0], fontWeight: 'bold' },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#666', fontSize: 20, fontWeight: 'bold' },
      splitLine: { lineStyle: { color: '#eee', type: 'dashed' } }
    }
  ],
  series: [
    {
      symbolSize: 8,
      symbol: 'circle',
      smooth: true,
      name: '数值',
      type: 'line',
      areaStyle: { opacity: 0.3 },
      lineStyle: { width: 4 },
      // 默认模拟数据
      data: generateMockData(15, 60, 30)
    }
  ]
})

// 【关键修复】同上，解构 entityChartRef 并绑定到下方的图表容器
const { domRef: entityChartRef, setOption: setEntityOption } = useEcharts(toRef(entityOption))

// 初始化实体数据
const initEntity = async () => {
  await fetchEntityList()
}

const fetchEntityList = async () => {
  try {
    const api = entityType.value === 'network' ? queryNetworkList : queryContainerList
    const res = await api({ currentPage: 1, pageSize: 100 })
    entityList.value = res.data?.list || []
    
    // 重置选择
    if (entityList.value.length > 0) {
      const first = entityList.value[0]
      currentEntityId.value = first.id || (entityType.value === 'network' ? first.networkName : first.containerName)
      handleEntityChange(currentEntityId.value)
    } else {
      currentEntityId.value = ''
      currentEntityObj.value = null
      refreshEntityChart()
    }
    
    // 默认选中第一个指标
    if (currentMetricFields.value.length > 0 && !currentEntityMetricProp.value) {
      currentEntityMetricProp.value = currentMetricFields.value[0].prop
    }
    
    if(entityList.value.length > 0) {
      await refreshEntityChart()
    }
  } catch (e) {
    console.error(e)
    refreshEntityChart()
  }
}

const handleTypeChange = () => {
  currentEntityMetricProp.value = '' 
  fetchEntityList()
}

const handleEntityChange = (val: string) => {
  const target = entityList.value.find(item => 
    (item.id === val) || 
    (entityType.value === 'network' ? item.networkName === val : item.containerName === val)
  )
  currentEntityObj.value = target
  refreshEntityChart()
}

const refreshEntityChart = async () => {
  let newData: number[] = []
  let chartTitle = ''

  // 1. 尝试获取真实数据
  if (currentEntityObj.value && currentEntityMetricProp.value) {
    try {
      let params = {}
      if (entityType.value === 'network') {
        params = {
          streamIp: currentEntityObj.value.networkName,
          metric: currentEntityMetricProp.value
        }
      } else {
        params = {
          containerName: currentEntityObj.value.containerName,
          metric: currentEntityMetricProp.value
        }
      }

      const fetchApi = entityType.value === 'network' ? queryLastWindowNetworkMetrics : queryLastWindowContainerMetrics
      const res = await fetchApi(params)
      newData = res.data?.data || []
      
      const metricLabel = currentMetricFields.value.find(f => f.prop === currentEntityMetricProp.value)?.label || ''
      chartTitle = `${metricLabel} - 趋势分析`
      
      if (newData.length > 0) {
        ElMessage.success('实体指标趋势已更新')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // 2. 如果没有真实数据，使用模拟数据
  if (!newData || newData.length === 0) {
    newData = generateMockData(15, 50, 40) // 生成波动数据
    const label = currentMetricFields.value.find(f => f.prop === currentEntityMetricProp.value)?.label
    chartTitle = label ? `${label} - 模拟趋势` : '实体指标趋势示例'
  }

  // 3. 更新图表配置
  entityOption.value.title.text = chartTitle
  entityOption.value.series[0].data = newData
  
  if (newData.length > 0) {
    entityOption.value.xAxis[0].data = Array.from({ length: newData.length }, (_, i) => `${i * 15}s`)
    
    // Y轴自适应
    const values = newData.map(Number)
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    
    // 如果数据全是0，给一个固定范围
    if (minVal === 0 && maxVal === 0) {
      entityOption.value.yAxis[0].min = 0
      entityOption.value.yAxis[0].max = 100
    } else {
      entityOption.value.yAxis[0].min = Math.floor(minVal * 0.8)
      entityOption.value.yAxis[0].max = Math.ceil(maxVal * 1.2)
    }
  } else {
    entityOption.value.xAxis[0].data = []
  }

  setEntityOption(entityOption.value)
}

// 生命周期
onMounted(() => {
  initQoe()
  initEntity()
})

</script>

<style lang="scss" scoped>
.trend-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
  background-color: var(--layout-bg-color);
}

.content-wrapper-vertical {
  display: flex;
  flex-direction: column; /* 垂直布局 */
  flex: 1;
  gap: 15px; /* 上下间距 */
  height: 100%;
  overflow: hidden;
}

.monitor-panel {
  flex: 1; /* 上下各占50% */
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--el-border-color-extra-light);
  overflow: hidden;
}

/* 头部标题与控件 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 3px solid transparent;
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3)) bottom/100% 3px no-repeat;
  flex-shrink: 0;

  .panel-title {
    margin: 0;
    font-size: 40px; /* 大标题 */
    font-weight: 700;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    
    &::before {
      content: '📈';
      margin-right: 10px;
      font-size: 40px;
    }
  }

  .controls {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

/* 图表容器 */
.chart-wrapper {
  flex: 1;
  width: 100%;
  height: 0; /* 允许 flex grow */
  background: #fff;
  border-radius: 10px;
  padding: 10px;
  box-sizing: border-box;
  
  .chart-container {
    width: 100%;
    height: 100%;
  }
}

/* ================== 控件样式覆盖 (与 Metric Monitor 保持一致) ================== */

/* 按钮 */
:deep(.action-btn) {
  font-size: 24px !important;
  height: 46px !important;
  padding: 0 20px !important;
  border-radius: 8px;
  font-weight: 600;
  
  &.el-button--primary {
    background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
    border: none;
    &:hover {
      background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    }
  }
}

/* 下拉框 */
:deep(.custom-select) {
  width: 220px;
  
  &.entity-select {
    width: 300px; /* 实体名称可能较长，宽一点 */
  }
  
  .el-select__wrapper {
    height: 46px !important;
    min-height: 46px !important;
    font-size: 24px !important;
    padding: 4px 15px !important;
    border-radius: 8px;
    box-shadow: 0 0 0 1px var(--el-border-color) inset;
  }
  
  .el-select__selected-item {
    font-size: 24px !important;
    font-weight: 600;
    color: #333;
    line-height: 46px !important;
  }
  
  .el-select__placeholder {
    font-size: 24px !important;
    line-height: 46px !important;
    color: #999;
  }
}
</style>