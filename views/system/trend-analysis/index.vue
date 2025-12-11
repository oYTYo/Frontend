<template>
  <div class="main-content">
    <div class="top-panel">
      <div class="panel-header">
        <span class="title">QoE 趋势分析</span>
        <div class="controls">
           <el-select v-model="currentQoeMetricName" placeholder="选择指标" @change="handleQoeMetricChange" size="small" style="width: 120px;">
              <el-option v-for="item in qoeMetricsOptions" :key="item.name" :label="item.name" :value="item.name" />
           </el-select>
        </div>
      </div>
      <div ref="qoeChartRef" class="chart-container" style="width: 100%; height: 350px;"></div>
    </div>

    <div class="bottom-panel" style="margin-top: 20px;">
      <div class="panel-header">
        <span class="title">异常检测 - 实体指标趋势</span>
        <div class="controls">
          <el-radio-group v-model="entityType" @change="handleTypeChange" size="small">
            <el-radio-button label="network">网络</el-radio-button>
            <el-radio-button label="container">容器</el-radio-button>
          </el-radio-group>
          <el-select v-model="currentEntityId" placeholder="选择实体" @change="handleEntityChange" size="small" style="width: 150px; margin-left: 10px;">
              <el-option 
                v-for="item in entityList" 
                :key="item.id" 
                :label="entityType === 'network' ? item.networkName : item.containerName" 
                :value="item.id || (entityType === 'network' ? item.networkName : item.containerName)" 
              />
           </el-select>
           <el-select v-model="currentEntityMetricProp" placeholder="选择指标" @change="refreshEntityChart" size="small" style="width: 120px; margin-left: 10px;">
              <el-option v-for="field in currentMetricFields" :key="field.prop" :label="field.label" :value="field.prop" />
           </el-select>
        </div>
      </div>
      <div ref="entityChartRef" class="chart-container" style="width: 100%; height: 350px;"></div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getQoeMetricsData, getQoeMetricTrendData } from '@/api/system/qoe'
import { 
  queryNetworkList, 
  queryContainerList, 
  queryLastWindowNetworkMetrics, 
  queryLastWindowContainerMetrics 
} from '@/api/system/anomaly'
import { ElMessage } from 'element-plus'
import { useEcharts } from '@/utils'
import { useCssVar } from '@vueuse/core'

// ================= 1. 核心工具：生成优雅的模拟波形 =================
const generateMockData = (length = 20, base = 50, fluctuation = 30) => {
  return Array.from({ length }, () => {
    const random = Math.random() * fluctuation - (fluctuation / 2)
    return Number((base + random).toFixed(2))
  })
}

// ================= 2. QoE 趋势模块 (Top Panel) =================

const qoeMetricsOptions = ref<any[]>([])
const currentQoeMetricName = ref('')

const primaryColor = useCssVar('--el-color-primary')
const primaryLight = useCssVar('--el-color-primary-light-7')

// 【修复样式】去掉了所有显式的 fontSize: 20/24 设置，恢复默认精细风格
const qoeOption = ref({
  color: {
    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: primaryLight.value || '#e0eaff' },
      { offset: 1, color: primaryColor.value || '#409eff' }
    ]
  },
  title: {
    text: 'QoE 指标趋势',
    left: 'center',
    textStyle: { fontSize: 36, fontWeight: 'bold', color: '#333' } // 恢复正常标题大小
  },
  tooltip: { 
    trigger: 'axis', 
    axisPointer: { type: 'shadow' }
    // 移除了 textStyle: { fontSize: 20 }，恢复默认
  },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
  xAxis: [
    {
      type: 'category',
      boundaryGap: false,
      data: Array.from({ length: 20 }, (_, i) => `${i + 1}s`),
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#666' }, // 移除了 fontSize: 20
      axisTick: { show: false }
    }
  ],
  yAxis: [
    {
      type: 'value',
      name: '数值',
      nameTextStyle: { color: '#666', padding: [0, 30, 0, 0] }, // 移除了 fontSize: 20
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#666' }, // 移除了 fontSize: 20
      splitLine: { lineStyle: { color: '#eee', type: 'dashed' } }
    }
  ],
  series: [
    {
      name: '示例数据',
      type: 'line',
      smooth: true,
      symbol: 'none',
      areaStyle: { opacity: 0.2 },
      lineStyle: { width: 3 },
      data: generateMockData(20, 80, 20) 
    }
  ]
})

const { domRef: qoeChartRef, setOption: setQoeOption } = useEcharts(qoeOption)

const initQoe = async () => {
  try {
    const res = await getQoeMetricsData()
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || [])
    qoeMetricsOptions.value = list
    
    if (list.length > 0) {
      currentQoeMetricName.value = list[0].name
      await refreshQoeChart()
    } else {
      ElMessage.warning('未能获取指标列表，显示示例数据')
    }
  } catch (e) {
    console.error(e)
  }
}

const handleQoeMetricChange = () => {
  refreshQoeChart()
}

const refreshQoeChart = async () => {
  let trendData: number[] = []
  const metricName = currentQoeMetricName.value || '未知指标'
  let isMock = false

  if (currentQoeMetricName.value) {
    try {
      const res = await getQoeMetricTrendData(currentQoeMetricName.value)
      trendData = res?.data?.data?.trend || []
    } catch (e) {
      console.error('获取趋势数据失败，切换为模拟数据', e)
    }
  }

  if (!trendData || trendData.length === 0) {
    trendData = generateMockData(20, 50, 40)
    isMock = true
  }
  
  qoeOption.value.title.text = isMock ? `${metricName} (暂无数据-模拟展示)` : `${metricName} - 趋势`
  qoeOption.value.series[0].name = metricName
  qoeOption.value.series[0].data = trendData
  qoeOption.value.xAxis[0].data = Array.from({ length: trendData.length }, (_, i) => `${i + 1}s`)

  if (metricName.includes('卡顿') || metricName.includes('丢包')) {
     qoeOption.value.yAxis[0].name = '%'
  } else {
     qoeOption.value.yAxis[0].name = '数值'
  }

  setQoeOption(qoeOption.value)
  if (!isMock) ElMessage.success('QoE 数据已更新')
}


// ================= 3. 实体指标模块 (Bottom Panel) =================

const entityType = ref('network') 
const entityList = ref<any[]>([])
const currentEntityId = ref('')
const currentEntityObj = ref<any>(null)
const currentEntityMetricProp = ref('')

const containerMetricFields = [
  { prop: 'cpuUsage', label: 'CPU使用率' },
  { prop: 'memory', label: '内存使用' },
  { prop: 'receiveBytes', label: '网络接收' },
  { prop: 'transmitBytes', label: '网络发送' }
]
const networkMetricFields = [
  { prop: 'jitter', label: '抖动' },
  { prop: 'throughout', label: '吞吐量' },
  { prop: 'packetLoss', label: '丢包率' },
  { prop: 'rtt', label: '延时' }
]

const currentMetricFields = computed(() => 
  entityType.value === 'network' ? networkMetricFields : containerMetricFields
)

// 【修复样式】同样恢复实体图表的标准字号
const entityOption = ref({
  color: {
    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: '#ffecd2' },
      { offset: 1, color: '#fcb69f' }
    ]
  },
  title: {
    text: '实体运行指标',
    left: 'center',
    textStyle: { fontSize: 36, fontWeight: 'bold', color: '#333' } // 16px
  },
  tooltip: { 
    trigger: 'axis' 
    // 恢复默认字号
  },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
  xAxis: [
    {
      type: 'category',
      boundaryGap: false,
      data: Array.from({ length: 20 }, (_, i) => `${i + 1}s`),
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#666' } // 恢复默认字号
    }
  ],
  yAxis: [{ 
    type: 'value', 
    axisLabel: { color: '#666' }, // 恢复默认字号
    splitLine: { lineStyle: { type: 'dashed' } } 
  }],
  series: [
    {
      name: '示例数据',
      type: 'line',
      smooth: true,
      symbol: 'none',
      areaStyle: { opacity: 0.2 },
      lineStyle: { width: 3 },
      data: generateMockData(20, 30, 10)
    }
  ]
})

const { domRef: entityChartRef, setOption: setEntityOption } = useEcharts(entityOption)

const initEntity = async () => {
  await fetchEntityList()
}

const fetchEntityList = async () => {
  try {
    const api = entityType.value === 'network' ? queryNetworkList : queryContainerList
    const res = await api({ currentPage: 1, pageSize: 100 })
    entityList.value = res.data?.list || []
    
    if (entityList.value.length > 0) {
      const first = entityList.value[0]
      currentEntityId.value = first.id || (entityType.value === 'network' ? first.networkName : first.containerName)
      handleEntityChange(currentEntityId.value)
    } else {
      refreshEntityChart()
    }
    
    if (!currentEntityMetricProp.value && currentMetricFields.value.length > 0) {
      currentEntityMetricProp.value = currentMetricFields.value[0].prop
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
  let isMock = false

  if (currentEntityObj.value && currentEntityMetricProp.value) {
    try {
      let params = {}
      if (entityType.value === 'network') {
        params = { streamIp: currentEntityObj.value.networkName, metric: currentEntityMetricProp.value }
      } else {
        params = { containerName: currentEntityObj.value.containerName, metric: currentEntityMetricProp.value }
      }
      const fetchApi = entityType.value === 'network' ? queryLastWindowNetworkMetrics : queryLastWindowContainerMetrics
      const res = await fetchApi(params)
      newData = res.data?.data || []
    } catch (e) { console.error(e) }
  }

  if (!newData || newData.length === 0) {
    newData = generateMockData(20, 40, 50)
    isMock = true
  }

  const metricLabel = currentMetricFields.value.find(f => f.prop === currentEntityMetricProp.value)?.label
  chartTitle = metricLabel ? `${metricLabel} ${isMock ? '' : '- 实时趋势'}` : '实体指标趋势 (示例)'

  entityOption.value.title.text = chartTitle
  entityOption.value.series[0].data = newData
  entityOption.value.xAxis[0].data = Array.from({ length: newData.length }, (_, i) => `${i + 1}s`)

  setEntityOption(entityOption.value)
}

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
  font-size: 36px !important;
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
    font-size: 36px !important;
    padding: 4px 15px !important;
    border-radius: 8px;
    box-shadow: 0 0 0 1px var(--el-border-color) inset;
  }
  
  .el-select__selected-item {
    font-size: 36px !important;
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