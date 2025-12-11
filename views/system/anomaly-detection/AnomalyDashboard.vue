<template>
  <div class="root">
    <m-table
      v-if="showAnomalyTable"
      :key="selectedType"
      class="m-table"
      ref="tableRef"
      :layout="systemStore.layout.widthShrink ? 'auto' : undefined"
      is-filter-table
      :is-complex-filter="false"
      :is-export-excel="false"
      :is-sort-column="false"
      row-key="id"
      :filter-param="filterParam"
      :filter-columns="topFilterColumns"
      :columns="currentColumns"
      :fetch-data="fetchAllEntityData"
      v-model:data="data"
      :pagination="{ layout: 'sizes,prev,pager,next,jumper' }"
    ></m-table>

    <div
      class="metric-content"
      v-if="showMetricsPanel || showTrendPanel"
      :class="{
        'only-metrics': isMonitorMode,
        'only-trend': isTrendMode
      }"
    >
      <div class="metrics-table" v-if="showMetricsPanel">
        <h3 class="metrics-title">实体指标监控</h3>

        <el-table
          :data="metricsData"
          border
          stripe
          size="default"
          style="width: 100%; font-size: 32px;"
          :resizable="false"
          :cell-style="{ padding: '12px 0', boxSizing: 'border-box' }"
          :header-cell-style="{ padding: '12px 0', boxSizing: 'border-box' }"
          table-layout="fixed"
          height="100%"
        >
          <el-table-column prop="name" label="指标名称" width="220" align="center">
            <template #header>
              <span>📊 指标名称</span>
            </template>
          </el-table-column>

          <el-table-column prop="value" label="数值" align="center">
            <template #header>
              <span>📈 数值</span>
            </template>
            <template #default="scope">
              <span class="metric-value">{{ scope.row.value }}</span>
              <span class="metric-unit" v-if="scope.row.unit">{{ scope.row.unit }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="160" align="center">
            <template #header>
              <span>⚙️ 操作</span>
            </template>
            <template #default="scope">
              <el-button 
                v-if="showTrendPanel"
                type="primary" 
                size="small" 
                @click="updateChartData(scope.row)"
              >
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="right-content" v-if="showTrendPanel">
        <h3 class="charts-title">实体指标趋势分析</h3>
        <div
          v-for="(o, i) in echartsDomRefs"
          :key="i"
          :ref="(el) => { if (el) o.domRef.value = el }"
          class="charts-item"
        ></div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, reactive, ref, toRef, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { queryContainerList, queryNetworkList, queryContainerMetricsbyContainer, queryNetworkMetricsbyNetwork, queryLastWindowNetworkMetrics, queryLastWindowContainerMetrics } from '@/api/system/anomaly'
import { useSystemStore } from '@/stores/system'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useCssVar } from '@vueuse/core'
import { useEcharts } from '@/utils'

// ================= 1. 基础定义与配置 =================

// 定义页面模式
type DashboardMode = 'anomaly' | 'monitor' | 'trend'

const props = withDefaults(defineProps<{
  mode?: DashboardMode
}>(), {
  mode: 'anomaly'
})

const isAnomalyMode = computed(() => props.mode === 'anomaly')
const isMonitorMode = computed(() => props.mode === 'monitor')
const isTrendMode   = computed(() => props.mode === 'trend')

// 控制面板显示
const showAnomalyTable  = computed(() => isAnomalyMode.value)
const showMetricsPanel  = computed(() => isAnomalyMode.value || isMonitorMode.value)
const showTrendPanel    = computed(() => isAnomalyMode.value || isTrendMode.value)

const { t } = useI18n()
const systemStore = useSystemStore()

// ================= 2. 核心数据引用 =================

const tableRef = ref()
const data = ref([])
const metricsData = ref([])
const currentEntity = ref(null)
const currentMetric = ref(null)

// 初始化 filterParam，默认选中 network
const filterParam = reactive({
  type: 'network' 
})

// 实体类型选中状态，与 filterParam.type 同步
const selectedType = ref('network') 

// ================= 3. 指标字段定义 (修改：移除Label中的单位) =================

// 容器指标定义
const containerMetricFields = [
  { prop: 'processes', label: '进程数', unit: '' },
  { prop: 'cpuUsage', label: 'CPU使用率', unit: '%' },
  { prop: 'memory', label: '内存使用', unit: 'B' },
  { prop: 'writesBytes', label: '写入字节', unit: 'B' },
  { prop: 'readsBytes', label: '读取字节', unit: 'B' },
  { prop: 'receiveBytes', label: '接收字节', unit: 'B' },
  { prop: 'transmitBytes', label: '传输字节', unit: 'B' },
  { prop: 'receivePackets', label: '接收包数', unit: '' },
  { prop: 'transmitPackets', label: '传输包数', unit: '' }
]

// 网络指标定义
const networkMetricFields = [
  { prop: 'jitter', label: '抖动', unit: 'ms' },
  { prop: 'throughout', label: '吞吐量', unit: 'Mbps' },
  { prop: 'packetLoss', label: '丢包率', unit: '%' },
  { prop: 'rtt', label: '往返时延', unit: 'ms' }
]

// 当前选中的指标集合
const metricFields = computed(() =>
  selectedType.value === 'network' ? networkMetricFields : containerMetricFields
)

// ================= 4. 表格列定义 =================

const topNetworkFilterColumns = [
  { prop: 'networkName', label: t('system.anomaly.network.networkName') },
  { prop: 'totalErrors', label: t('system.anomaly.network.totalErrors') },
]

const topContainerFilterColumns = [
  { prop: 'containerName', label: t('system.anomaly.container.containerName') },
  { prop: 'totalErrors', label: t('system.anomaly.container.totalErrors') },
]

// 搜索栏配置
const topFilterColumns = computed(() => {
  const typeColumn = {
    prop: 'type',
    label: '实体类型', 
    type: 'select',
    itemList: [
      { label: '网络', value: 'network' },
      { label: '容器', value: 'container' }
    ],
    clearable: false 
  }
  const specificColumns = selectedType.value === 'network' 
    ? topNetworkFilterColumns 
    : topContainerFilterColumns
    
  return [typeColumn, ...specificColumns]
})

// 网络主表格列
const networkColumns = computed(() => [
  { type: 'index', width: 100 },
  { prop: 'networkName', label: t('system.anomaly.network.networkName') },
  { prop: 'totalErrors', label: t('system.anomaly.network.totalErrors') },
  { prop: 'jitter', label: t('system.anomaly.network.jitter') },
  { prop: 'throughout', label: t('system.anomaly.network.throughout') },
  { prop: 'packetLoss', label: t('system.anomaly.network.packetLoss') },
  { prop: 'rtt', label: t('system.anomaly.network.rtt') },
  {
    type: 'operation',
    fixed: 'right',
    align: 'center',
    buttons: [
      {
        label: '查看指标',
        icon: 'view',
        onClick: (row) => viewEntity(row)
      }
    ]
  }
])

// 容器主表格列
const containerColumns = computed(() => [
  { type: 'index', width: 100 },
  { prop: 'containerName', label: t('system.anomaly.container.containerName'), width: 250 },
  { prop: 'totalErrors', label: t('system.anomaly.container.totalErrors'), width: 180 },
  { prop: 'processes', label: t('system.anomaly.container.processes'), width: 180 },
  { prop: 'cpuUsage', label: t('system.anomaly.container.cpuUsage'), width: 250 },
  { prop: 'memory', label: t('system.anomaly.container.memory'), width: 380 },
  { prop: 'writesBytes', label: t('system.anomaly.container.writesBytes'), width: 200 },
  { prop: 'readsBytes', label: t('system.anomaly.container.readsBytes'), width: 200 },
  { prop: 'receiveBytes', label: t('system.anomaly.container.receiveBytes'), width: 200 },
  { prop: 'transmitBytes', label: t('system.anomaly.container.transmitBytes'), width: 200 },
  { prop: 'receivePackets', label: t('system.anomaly.container.receivePackets'), width: 240 },
  { prop: 'transmitPackets', label: t('system.anomaly.container.transmitPackets'), width: 250 },
  {
    type: 'operation',
    fixed: 'right',
    align: 'center',
    width: 200,
    buttons: [
      {
        label: '查看指标',
        icon: 'view',
        onClick: (row) => viewEntity(row)
      }
    ]
  }
])

const currentColumns = computed(() => 
  selectedType.value === 'network' ? networkColumns.value : containerColumns.value
)

// ================= 5. API 映射 =================

const fetchAllEntityData = computed(() =>
  selectedType.value === 'network' ? queryNetworkList : queryContainerList
)

const fetchEntityData = computed(() => {
  if (selectedType.value === 'network') {
    return (entity) => queryNetworkMetricsbyNetwork({ streamIp: entity.networkName })
  } else {
    return (entity) => queryContainerMetricsbyContainer({ containerName: entity.containerName })
  }
})

const fetchLastWindowMetrics = computed(() => {
  if (selectedType.value === 'network') {
    return (params) => queryLastWindowNetworkMetrics(params)
  } else {
    return (params) => queryLastWindowContainerMetrics(params)
  }
})

// ================= 6. 逻辑方法 =================

// 监听类型变化
watch(() => filterParam.type, (newVal) => {
  if (newVal && newVal !== selectedType.value) {
    selectedType.value = newVal
    
    // 重置状态
    data.value = []
    currentEntity.value = null
    currentMetric.value = null
    
    // 立即显示空表格（0.00），避免短暂空白
    updateMetricsDataByEntity(null) 
    
    nextTick(() => {
      tableRef.value?.fetchQuery?.()
    })
  }
})

// 监听主表格数据加载
watch(data, (val) => {
    if (val && val.length > 0) {
        if (!currentEntity.value) {
            currentEntity.value = val[0]
        }
    } else {
        currentEntity.value = null
        updateMetricsDataByEntity(null)
    }
})

// 监听选中实体变化
watch(currentEntity, (val) => {
  if (val) {
    updateMetricsDataByEntity(val)
  }
})

// 更新指标数据 (修改：添加单位处理)
async function updateMetricsDataByEntity(entity) {
  let dataObj = entity || {}
  
  if (entity) {
      try {
        const res = await fetchEntityData.value(entity)
        if (res?.data?.list && Array.isArray(res.data.list)) {
            dataObj = { ...entity, ...res.data.list[0] }
        } else if (res?.data?.list) {
            dataObj = { ...entity, ...res.data.list }
        }
      } catch (e) {
        console.warn('获取指标详情失败，降级显示列表数据', e)
      }
  }

  const fields = metricFields.value || []
  
  metricsData.value = fields.map(field => {
    const rawValue = dataObj[field.prop]
    
    const displayValue = (rawValue === null || rawValue === undefined || rawValue === '') 
      ? '0.00' 
      : String(rawValue)

    return {
      name: field.label, 
      prop: field.prop,  
      value: displayValue, 
      unit: field.unit || '' // 绑定单位
    }
  })
  
  if (showTrendPanel.value && metricsData.value.length > 0 && !currentMetric.value) {
    nextTick(() => {
       updateChartData(metricsData.value[0])
    })
  }
}

function viewEntity(entity) {
  currentEntity.value = entity 
  const entityName = selectedType.value === 'network' 
    ? entity.networkName 
    : entity.containerName
  ElMessage.success(`已选中 ${entityName}`)
}

// ================= 7. 图表相关 =================

const color = ref({
  type: 'linear',
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: useCssVar('--el-color-primary-light-7').value },
    { offset: 1, color: useCssVar('--el-color-primary').value }
  ]
})

const optionArr = ref([
  {
    color: color.value,
    title: {
      text: '',
      textStyle: { fontSize: 24, fontWeight: 'bold', color: '#333' }
    },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '5%', right: '6%', bottom: '15%', top: '20%', containLabel: true },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: Array.from({ length: 30 }, (_, i) => `${i * 15}秒`),
        axisLine: { lineStyle: { color: '#ddd' } },
        axisLabel: { color: '#666', fontSize: 24, fontWeight: 'bold' },
        axisTick: { show: false }
      }
    ],
    yAxis: [
      {
        type: 'value',
        min: 1,
        max: 5,
        splitNumber: 4,
        nameTextStyle: { color: '#666', fontSize: 24, padding: [0, 50, 0, 0], fontWeight: 'bold' },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#666', fontSize: 24, fontWeight: 'bold' },
        splitLine: { lineStyle: { color: '#eee', type: 'dashed' } }
      }
    ],
    series: [
      {
        symbolSize: 8,
        symbol: 'circle',
        smooth: true,
        name: 'QoE评分',
        type: 'line',
        stack: 'Total',
        showSymbol: true,
        lineStyle: { width: 4 },
        areaStyle: { opacity: 0.8 },
        data: []
      }
    ]
  }
])

const echartsDomRefs = optionArr.value.map((option) => {
  return {
    domRef: ref(null),
    ...useEcharts(toRef(option))
  }
})

async function updateChartData(metric) {
  currentMetric.value = metric
  try {
    let params = {}
    if (selectedType.value === 'network') {
      params = {
        streamIp: currentEntity.value?.networkName || '',
        metric: metric.prop
      }
    } else {
      params = {
        containerName: currentEntity.value?.containerName || '',
        metric: metric.prop
      }
    }

    const res = await fetchLastWindowMetrics.value(params)
    const newData = res.data.data || []

    const metricName = metric.name || metric.prop
    const chartTitle = `${metricName}趋势分析`
    optionArr.value[0].title.text = chartTitle
    optionArr.value[0].series[0].name = metric.prop
    optionArr.value[0].series[0].data = newData

    if (newData.length > 0) {
      const values = newData.map(Number)
      const minVal = Math.min(...values)
      const maxVal = Math.max(...values)
      optionArr.value[0].yAxis[0].min = minVal * 0.9   
      optionArr.value[0].yAxis[0].max = maxVal * 1.1   
    }

    if(echartsDomRefs[0] && echartsDomRefs[0].setOption) {
       echartsDomRefs[0].setOption(optionArr.value[0])
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error)
  }
}

// ================= 8. 生命周期 =================

let refreshTimer = null
onMounted(() => {
  // 核心修复：一进入页面，立即渲染默认的（网络）指标表格，即使没有数据也显示0.00
  updateMetricsDataByEntity(null)

  nextTick(() => {
    tableRef.value?.fetchQuery?.()
  })

  refreshTimer = setInterval(async () => {
    if (tableRef.value && tableRef.value.fetchQuery) {
        await tableRef.value.fetchQuery();
    }
    if (currentEntity.value) {
      await updateMetricsDataByEntity(currentEntity.value)
    }
  }, 15000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>


<style lang="scss" scoped>
.root {
  border: 2px solid rgb(0, 251, 255); /* 蓝色边框调试用 */
  display: flex;
  flex-direction: column;
  height: calc(100vh - 40px); /* 占据全屏高度减去 header/footer */
  gap: 10px;
  padding: 10px;
  box-sizing: border-box;
  overflow: hidden; /* 禁止根容器滚动 */

  /* 上方主表格 */
  .m-table {
    height: 450px; /* 固定高度比例，防止过高 */
    flex-shrink: 0;
    border: 2px solid rgb(255, 0, 51); /* 红色边框调试用 */

    /* ------------------- 以下为同步的搜索栏与表格样式 ------------------- */

    /* 1. 表格行高与内容垂直居中 */
    :deep(.el-table__cell) {
      padding: 12px 0 !important;
    }
    :deep(.el-table .cell) {
      line-height: 1.5;
    }

    /* 2. 顶部搜索框 (Top Filter) 样式 */
    :deep(.top-filter) {
      .el-form-item {
        margin-right: 15px;
        margin-bottom: 10px;
      }
      .el-input, .el-select {
        width: 180px; 
      }
      .el-form-item__label {
        font-size: 32px; 
        font-weight: bold;
        color: #333;
      }
      .el-input__inner {
        font-size: 24px;
      }
      .el-button {
        font-size: 24px;
      }
    }

    /* 3. 操作栏链接 */
    :deep(.operation-button) {
      .el-link {
        font-size: 24px;
      }
    }

    /* 4. 分页栏 */
    :deep(.total-view) {
      font-size: 24px;
      color: #333;
      .total-text {
        font-size: 28px;
        font-weight: bold;
        color: var(--el-color-primary);
      }
    }

    /* 5. 全局表单控件覆盖 */
    :deep(.el-form-item) {
      .el-form-item__label {
        font-size: 24px !important;
        line-height: 40px;
        height: 40px;
        display: flex;
        align-items: center;
      }
      .el-input {
        font-size: 24px !important;
        height: 40px !important;
        .el-input__wrapper {
          height: 40px !important;
          padding: 0 15px !important;
        }
        .el-input__inner {
          height: 40px !important;
          line-height: 40px !important;
          font-size: 24px !important;
        }
      }
      .el-select {
        .el-select__wrapper {
          height: 40px !important;
          min-height: 40px !important;
          font-size: 24px !important;
          line-height: 40px !important;
          padding: 0 15px !important;
        }
        .el-input__wrapper {
          height: 40px !important;
        }
        .el-input__inner {
          height: 40px !important;
          font-size: 24px !important;
        }
        .el-select__placeholder {
          font-size: 24px !important;
          position: absolute !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          left: 15px !important;
          line-height: normal !important;
          height: auto !important;
          margin: 0 !important;
          color: var(--el-text-color-placeholder);
          display: block !important;
          width: calc(100% - 30px);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .el-select__selected-item {
          font-size: 24px !important;
          line-height: 40px !important;
          top: 0;
        }
      }
    }

    /* 6. 按钮 */
    :deep(.right-action) {
      .el-button {
        font-size: 24px !important;
        height: 45px !important;
        padding: 0 20px !important;
        .el-icon {
          font-size: 24px !important;
        }
      }
    }
    
    /* 表格样式美化 */
    :deep(.el-table) {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

      .el-table__header th {
        background-color: var(--el-fill-color-light);
        color: var(--el-text-color-primary);
        font-weight: 600;
        font-size: 32px !important;
        height: 60px !important;
        text-align: center !important;
        border-bottom: 2px solid var(--el-border-color-lighter);
        .cell {
          justify-content: center !important;
          display: flex;
          align-items: center;
          line-height: 1.5;
        }
      }

      .el-table__body td {
        font-size: 32px !important;
        height: 60px !important;
        padding: 12px 0 !important;
        border-bottom: 1px solid var(--el-border-color-extra-light);
        .cell {
          font-size: 32px !important;
          line-height: 36px !important;
          text-align: center !important;
          white-space: nowrap !important;
          display: block !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
      }

      .el-table__row {
        height: 60px !important;
        transition: background-color 0.3s ease;
        &:hover {
          background-color: var(--el-fill-color-extra-light);
        }
        &:nth-child(even) {
          background-color: rgba(0, 0, 0, 0.02);
        }
      }

      .el-button {
        border-radius: 6px;
        font-weight: 500;
        font-size: 24px !important; 
        padding: 8px 16px;
        height: auto;
        transition: all 0.3s ease;
        &:hover {
          transform: translateY(-1px);
        }
        .el-icon {
            font-size: 24px !important;
        }
      }

      &.el-table--border {
        border-left: none;
        border-right: none;
        &::after { display: none; }
      }
    }
  }

  /* 下方指标与趋势区域 */
  .metric-content {
    height: 650px; /* 自动填充剩余高度，不写死 px，避免溢出 */
    min-height: 0; /* 允许 flex item 压缩 */
    
    border: 2px solid rgb(0, 255, 0); 
    padding: 10px;
    border-radius: var(--el-border-radius-base);
    background-color: var(--el-bg-color);
    overflow: hidden;
    display: flex;
    gap: 10px;

    /* --- 左侧表格区域 --- */
    .metrics-table {
      width: 650px; /* 【修改】宽度设为 650px，比 QoE 的 560px 宽，又不至于挤占太多右侧空间 */
      flex-shrink: 0;
      
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      padding: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--el-border-color-extra-light);
      
      display: flex;
      flex-direction: column;
      height: 100%;

      --metrics-font-size: 32px;
      --metrics-header-font-size: 32px;
      --metrics-unit-font-size: 24px; /* 单位字体稍小 */

      .metrics-title {
        margin: 0 0 10px 0;
        font-size: 32px; 
        font-weight: 700;
        color: var(--el-text-color-primary);
        padding: 0 0 10px 0;
        border-bottom: 3px solid transparent;
        background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3)) bottom/100% 3px no-repeat;
        position: relative;
        text-align: center;
        flex-shrink: 0;
        
        &::before {
          content: '📊';
          margin-right: 8px;
          font-size: 32px;
        }
        &::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-success));
          border-radius: 2px;
          box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
        }
      }

      :deep(.el-table) {
        font-size: var(--metrics-font-size);
        border-radius: 10px;
        overflow: hidden;
        box-shadow: none;
        border: none;
        background: #ffffff;
        table-layout: fixed;
        flex: 1;
        display: flex;
        flex-direction: column;

        .el-table__inner-wrapper {
          height: 100% !important;
          display: flex;
          flex-direction: column;
        }
        .el-table__body-wrapper {
          flex: 1;
          .el-scrollbar, .el-scrollbar__wrap, .el-scrollbar__view {
            height: 100% !important;
          }
          .el-table__body {
            height: 100%; 
          }
        }
        
        .el-table__header-wrapper {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          flex-shrink: 0;
          
          th {
            font-size: var(--metrics-header-font-size);
            font-weight: 700;
            background: transparent !important;
            color: #333333 !important; 
            height: 60px;
            border-bottom: none;
            position: relative;
            white-space: nowrap;
            padding: 10px 5px;
            &::before {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 2px;
              background: rgba(255, 255, 255, 0.3);
            }
            .cell {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              line-height: 1.2;
            }
          }
        }
        
        .el-table__body {
          width: 100% !important;
          table-layout: fixed !important;
          height: 100%; /* 【新增】关键点：强制表格主体撑满高度，这样行就会自动均匀分布 */

          td {
            font-size: var(--metrics-font-size);
            line-height: 1.5; 
            padding: 0 10px; 
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            border-right: 1px solid rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            position: relative;
            white-space: nowrap;
            overflow: visible;
            text-overflow: ellipsis;
            box-sizing: border-box;
            
            .cell {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                line-height: normal;
            }
            &:last-child {
              border-right: none;
            }
            /* ...省略中间列样式配置... */
            &:nth-child(3) {
              padding: 0 5px;
            }
          }
          
          /* 【修改】关键点：删除之前的 tr { height: 100% }，不需要专门设置 tr 高度 */
          /* 如果您之前写了 tr { height: 100%; } 请务必删掉或注释掉 */
        }

        .el-table__row:hover {
          background: linear-gradient(90deg, rgba(64, 158, 255, 0.08), rgba(103, 126, 234, 0.05)) !important;
          td { border-bottom-color: rgba(64, 158, 255, 0.2); }
        }
        
        .el-table__row:nth-child(even) {
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.01));
        }

        .el-button {
          border-radius: 8px;
          padding: 8px 16px; 
          font-weight: 600;
          font-size: 32px;
          height: auto;
          background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
          border: none;
          color: white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          min-width: 80px;
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(64, 158, 255, 0.4);
            background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
          }
          &:active {
            transform: translateY(0);
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
          }
        }

        &.el-table--border {
          border: none;
          &::after { display: none; }
          td, th { border-right: 1px solid rgba(0, 0, 0, 0.1); }
          td:last-child, th:last-child { border-right: none; }
        }
        
        &.el-table--striped .el-table__body tr.el-table__row--striped td {
            background: rgba(0, 0, 0, 0.02);
        }
        
        .el-table__header th .el-table__column-filter-trigger { display: none; }
        
        .el-table__header-wrapper .el-table__header th {
          user-select: none;
          resize: none;
          &::after { display: none !important; }
        }
        
        .el-table__header colgroup col, .el-table__body colgroup col { width: auto !important; }
        
        .el-table__body, .el-table__header {
          width: 100% !important;
          table-layout: fixed !important;
        }
        
        .el-table__body-wrapper, .el-table__header-wrapper {
          width: 100% !important;
          overflow: hidden;
        }
        
        .el-table__cell { box-sizing: border-box !important; }
      }
    }

    /* --- 右侧图表区域 --- */
    .right-content {
      flex: 1; /* 自动占满右侧剩余空间 */
      height: 100%; 
      padding: 15px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      
      .charts-title {
        margin: 0 0 10px 0;
        font-size: 32px; 
        font-weight: 700;
        color: var(--el-text-color-primary);
        padding: 0 0 10px 0;
        border-bottom: 3px solid transparent;
        background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3)) bottom/100% 3px no-repeat;
        position: relative;
        text-align: center;
        
        &::before {
          content: '📈';
          margin-right: 8px;
          font-size: 32px;
        }
        &::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-success));
          border-radius: 2px;
          box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
        }
      }
      
      .charts-item {
        flex: 1;
        min-height: 0;
        border-radius: 10px;
        background: white;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
        padding: 10px;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
      }
    }
  }

  .width-shrink-layout {
    .root {
      height: auto;
      flex-wrap: wrap;
      :deep(.el-table__inner-wrapper) {
        .el-table__body-wrapper {
          .el-scrollbar__wrap {
            overflow-y: hidden;
          }
          .el-scrollbar__bar {
            &.is-vertical {
              display: none;
            }
          }
        }
      }
    }
  }
}
</style>