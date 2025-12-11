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

// ================= 3. 指标字段定义 (关键修复点：提前定义) =================

// 容器指标定义
const containerMetricFields = [
  { prop: 'processes', label: t('system.anomaly.container.processes') || '进程数' },
  { prop: 'cpuUsage', label: t('system.anomaly.container.cpuUsage') || 'CPU使用率' },
  { prop: 'memory', label: t('system.anomaly.container.memory') || '内存使用' },
  { prop: 'writesBytes', label: t('system.anomaly.container.writesBytes') || '写入字节' },
  { prop: 'readsBytes', label: t('system.anomaly.container.readsBytes') || '读取字节' },
  { prop: 'receiveBytes', label: t('system.anomaly.container.receiveBytes') || '接收字节' },
  { prop: 'transmitBytes', label: t('system.anomaly.container.transmitBytes') || '传输字节' },
  { prop: 'receivePackets', label: t('system.anomaly.container.receivePackets') || '接收包数' },
  { prop: 'transmitPackets', label: t('system.anomaly.container.transmitPackets') || '传输包数' }
]

// 网络指标定义
const networkMetricFields = [
  { prop: 'jitter', label: t('system.anomaly.network.jitter') || '抖动' },
  { prop: 'throughout', label: t('system.anomaly.network.throughout') || '吞吐量' },
  { prop: 'packetLoss', label: t('system.anomaly.network.packetLoss') || '丢包率' },
  { prop: 'rtt', label: t('system.anomaly.network.rtt') || '往返时延' }
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

// 容器主表格列 (已调整宽度)
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

// 监听类型变化 (切换 网络/容器)
watch(() => filterParam.type, (newVal) => {
  if (newVal && newVal !== selectedType.value) {
    selectedType.value = newVal
    
    // 重置状态
    data.value = []
    currentEntity.value = null
    currentMetric.value = null
    
    // 【关键修改】切换类型时，立即生成该类型的空指标列表（全0.00），防止表格空白
    updateMetricsDataByEntity(null) 
    
    nextTick(() => {
      tableRef.value?.fetchQuery?.()
    })
  }
})

// 监听主表格数据加载
watch(data, (val) => {
    if (val && val.length > 0) {
        // 如果有数据，选中第一行，填充真实数据
        if (!currentEntity.value) {
            currentEntity.value = val[0]
        }
    } else {
        // 【关键修改】如果主表格查不到数据，不要清空指标表，而是显示默认的 0.00 列表
        currentEntity.value = null
        updateMetricsDataByEntity(null)
    }
})

// 监听选中实体变化，更新指标列表
watch(currentEntity, (val) => {
  if (val) {
    updateMetricsDataByEntity(val)
  }
})

// 更新指标数据 (强制生成行结构，确保不显示“暂无数据”)
async function updateMetricsDataByEntity(entity) {
  // 1. 即使 entity 是 null，我们也定义一个空对象，用来触发下面的默认值 0.00 逻辑
  // 这样保证表格永远有行，只是数值为 0.00
  let dataObj = entity || {}
  
  // 2. 只有当 entity 真实存在且有具体名称时，才去尝试请求接口获取更详细的数据
  if (entity) {
      try {
        const res = await fetchEntityData.value(entity)
        if (res?.data?.list && Array.isArray(res.data.list)) {
            dataObj = { ...entity, ...res.data.list[0] } // 合并列表数据和详情数据
        } else if (res?.data?.list) {
            dataObj = { ...entity, ...res.data.list }
        }
      } catch (e) {
        console.warn('获取指标详情失败，降级显示列表数据', e)
      }
  }

  // 3. 核心修正：永远根据 metricFields 生成完整的行数据
  // 确保 metricFields 已定义，如果未定义则给空数组防崩
  const fields = metricFields.value || []
  
  metricsData.value = fields.map(field => {
    // 尝试取值
    const rawValue = dataObj[field.prop]
    
    // 强力兜底：只要值无效，统一显示 0.00
    const displayValue = (rawValue === null || rawValue === undefined || rawValue === '') 
      ? '0.00' 
      : String(rawValue)

    return {
      name: field.label, 
      prop: field.prop,  
      value: displayValue, 
      unit: ''           
    }
  })
  
  // 趋势图联动
  if (showTrendPanel.value && metricsData.value.length > 0 && !currentMetric.value) {
    // 使用 nextTick 避免在渲染前更新
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
        streamIp: currentEntity.value.networkName,
        metric: metric.prop
      }
    } else {
      params = {
        containerName: currentEntity.value.containerName,
        metric: metric.prop
      }
    }

    const res = await fetchLastWindowMetrics.value(params)
    const newData = res.data.data || []

    const metricName = t(`system.anomaly.${selectedType.value}.${metric.prop}`) || metric.prop
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
  nextTick(() => {
    tableRef.value?.fetchQuery?.()
  })

  refreshTimer = setInterval(async () => {
    if (tableRef.value && tableRef.value.fetchQuery) {
        await tableRef.value.fetchQuery();
    }
    // 自动刷新当前指标
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
  height: calc(100vh - 40px);
  gap: 10px;
  padding: 10px;
  box-sizing: border-box;

  .m-table {
    flex: 1;
    min-height: 0; 
    border: 2px solid rgb(255, 0, 51); /* 红色边框调试用 */

    /* ------------------- 以下为同步的搜索栏与表格样式 ------------------- */

    /* 1. 表格行高与内容垂直居中 */
    :deep(.el-table__cell) {
      padding: 12px 0 !important;
    }
    :deep(.el-table .cell) {
      line-height: 1.5;
    }

    /* 2. 顶部搜索框 (Top Filter) 样式 - 单行布局 */
    :deep(.top-filter) {
      /* 搜索项间距 */
      .el-form-item {
        margin-right: 15px;
        margin-bottom: 10px;
      }
      /* 输入框宽度限制 - 根据需要稍微调宽适应实体类型 */
      .el-input, .el-select {
        width: 180px; 
      }
      /* Label字体 (如: 实体类型) */
      .el-form-item__label {
        font-size: 32px; 
        font-weight: bold;
        color: #333;
      }
      /* 输入框内容字体 */
      .el-input__inner {
        font-size: 24px;
      }
      /* 按钮字体 */
      .el-button {
        font-size: 24px;
      }
    }

    /* 3. 操作栏链接文字大小 */
    :deep(.operation-button) {
      .el-link {
        font-size: 24px;
      }
    }

    /* 4. 分页栏总数/选中数文字大小 */
    :deep(.total-view) {
      font-size: 24px;
      color: #333;
      .total-text {
        font-size: 28px;
        font-weight: bold;
        color: var(--el-color-primary);
      }
    }

    /* 5. 全局表单控件强行覆盖 (Input, Select) */
    :deep(.el-form-item) {
      /* Label */
      .el-form-item__label {
        font-size: 24px !important;
        line-height: 40px;
        height: 40px;
        display: flex;
        align-items: center;
      }

      /* Input */
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

      /* Select (下拉框) 特殊处理 */
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
        /* 修复 placeholder 位置 */
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
        /* 选中项 */
        .el-select__selected-item {
          font-size: 24px !important;
          line-height: 40px !important;
          top: 0;
        }
      }
    }

    /* 6. 右侧功能按钮 (新增, 批量启用等) */
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
    
    // 美化m-table样式
    :deep(.el-table) {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

      /* 1. 表头样式 (Header) */
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

      /* 2. 表格内容样式 */
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

      /* 3. 行样式 (Row) */
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

      /* 4. 操作按钮美化 (Button) */
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

      /* 5. 去除多余边框 */
      &.el-table--border {
        border-left: none;
        border-right: none;
        &::after { display: none; }
      }
    }
  }

  /* 下方指标区域样式 - 适配 */
  .metric-content {
    /* 固定一个合适的高度 */
    height: 650px; 
    flex-shrink: 0;
    
    border: 2px solid rgb(0, 255, 0); 
    padding: 10px;
    border-radius: var(--el-border-radius-base);
    background-color: var(--el-bg-color);
    overflow: hidden;
    display: flex;
    gap: 10px;


    /* --- 左侧表格区域 (样式完全复刻 QoE 分析页面) --- */
    .metrics-table {
      /* 增加宽度以容纳大字体 */
      width: 750px; 
      flex-shrink: 0;
      
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      padding: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--el-border-color-extra-light);
      
      display: flex;
      flex-direction: column;
      height: 100%;

      /* 定义大字体变量 (32px) */
      --metrics-font-size: 32px;
      --metrics-header-font-size: 32px;
      --metrics-unit-font-size: 32px;

      /* 标题样式 */
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

      /* 表格深度定制 */
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

        /* 让表格内部占满高度 */
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
        
        /* 表头样式 */
        .el-table__header-wrapper {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          flex-shrink: 0;
          
          th {
            font-size: var(--metrics-header-font-size);
            font-weight: 700;
            background: transparent !important;
            color: #333333 !important; /* 深色字体 */
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
        
        /* 表体样式 */
        .el-table__body {
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
            
            /* 关键：使用 Flex 布局让内容垂直居中 */
            .cell {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                line-height: normal;
                white-space: nowrap;
            }

            &:last-child {
              border-right: none;
            }
            
            /* 第一列：指标名称 */
            &:nth-child(1) {
              font-weight: 500;
              color: var(--el-text-color-primary);
            }
            
            /* 第二列：数值 */
            &:nth-child(2) {
              .metric-value {
                font-weight: 600;
                color: var(--el-color-primary);
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 32px; /* 强制数值字体大小 */
              }
            }
          }
          tr { height: 100%; }
        }

        /* 鼠标悬停效果 */
        .el-table__row:hover {
          background: linear-gradient(90deg, rgba(64, 158, 255, 0.08), rgba(103, 126, 234, 0.05)) !important;
          td { border-bottom-color: rgba(64, 158, 255, 0.2); }
        }
        
        /* 斑马纹 */
        .el-table__row:nth-child(even) {
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.01));
        }

        /* 按钮样式 */
        .el-button {
          border-radius: 8px;
          padding: 8px 16px; 
          font-weight: 600;
          font-size: 24px; /* 按钮字体稍微小一点点，协调 */
          height: auto;
          background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
          border: none;
          color: white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(64, 158, 255, 0.4);
          }
        }

        /* 去除多余边框 */
        &.el-table--border {
          border: none;
          &::after { display: none; }
          td, th { border-right: 1px solid rgba(0, 0, 0, 0.1); }
          td:last-child, th:last-child { border-right: none; }
        }
        
        /* 强制覆盖列宽控制 */
        .el-table__header colgroup col, .el-table__body colgroup col { width: auto !important; }
        .el-table__body, .el-table__header { width: 100% !important; table-layout: fixed !important; }
      }
    }

    /* --- 右侧图表区域 --- */
    .right-content {
      flex: 1;
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
</style>