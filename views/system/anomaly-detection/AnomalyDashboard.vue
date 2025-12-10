<template>
  <div class="root">
    <el-select
      v-model="selectedType"
      placeholder="请选择实体类型"
      @change="handleTypeChange"
      style="width: 150px; margin-bottom: 10px;"
    >
      <el-option label="网络" value="network" />
      <el-option label="容器" value="container" />
    </el-select>

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

    <!-- 指标区：只有 monitor / trend 显示 -->
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
          style="width: 100%; font-size: 14px;"
          :resizable="false"
          :cell-style="{ padding: '18px 20px', boxSizing: 'border-box', fontSize: '14px' }"
          :header-cell-style="{ padding: '18px 20px', boxSizing: 'border-box', fontSize: '14px' }"
          table-layout="fixed"
          height="100%"
        >
          <!-- 你原来的列照搬 -->

          <!-- ✅ 关键：把“操作/查看趋势”列做成只在 trend 模式显示 -->
          <el-table-column
            v-if="showTrendPanel && !isMonitorMode"
            label="操作"
            width="100"
            align="center"
          >

          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="updateChartData(scope.row)"
            >
              查看趋势
            </el-button>
          </template>
        </el-table-column>

        </el-table>
      </div>

      <!-- 趋势区：只有 trend 显示 -->
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
// ...已合并到下一行，删除本行重复导入
import { queryContainerList, queryNetworkList, queryContainerMetricsbyContainer, queryNetworkMetricsbyNetwork, queryLastWindowNetworkMetrics, queryLastWindowContainerMetrics } from '@/api/system/anomaly'
// import getDictDetails from '@/utils/dict'
import { useSystemStore } from '@/stores/system'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useCssVar } from '@vueuse/core'
import { useEcharts } from '@/utils'

//
type DashboardMode = 'anomaly' | 'monitor' | 'trend'

const props = withDefaults(defineProps<{
  mode?: DashboardMode
}>(), {
  mode: 'anomaly'
})

const isAnomalyMode = computed(() => props.mode === 'anomaly')
const isMonitorMode = computed(() => props.mode === 'monitor')
const isTrendMode   = computed(() => props.mode === 'trend')

// ✅ anomaly 模式要显示三块
const showAnomalyTable  = computed(() => isAnomalyMode.value)
const showMetricsPanel  = computed(() => isAnomalyMode.value || isMonitorMode.value)
const showTrendPanel    = computed(() => isAnomalyMode.value || isTrendMode.value)


//
const { t } = useI18n()
const systemStore = useSystemStore()


// 折线图颜色配置
const color = ref({
  type: 'linear',
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    {
      offset: 0,
      color: useCssVar('--el-color-primary-light-7').value // 0% 处的颜色
    },
    {
      offset: 1,
      color: useCssVar('--el-color-primary').value // 100% 处的颜色
    }
  ]
})

// 折线图配置
const optionArr = ref([
  {
    color: color.value,
    title: {
      text: '',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: function(params) {
        return `<div style="font-weight:bold;margin-bottom:5px;">${params[0].name}</div>
                <div style="display:flex;align-items:center;margin-bottom:3px;">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:5px;background-color:${params[0].color};margin-right:5px;"></span>
                  <span style="font-size:14px;">${params[0].seriesName}: ${params[0].value}</span>
                </div>`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '15%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: Array.from({ length: 30 }, (_, i) => `${i * 15}秒`),
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        axisLabel: {
          color: '#666',
          fontSize: 12
        },
        axisTick: {
          show: false
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        // name: 'QoE评分',
        min: 1,
        max: 5,
        splitNumber: 4,
        nameTextStyle: {
          color: '#666',
          fontSize: 12,
          padding: [0, 30, 0, 0]
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#666',
          fontSize: 12
        },
        splitLine: {
          lineStyle: {
            color: '#eee',
            type: 'dashed'
          }
        },
        axisLabel: {
          formatter: (val) => {
            if (Math.abs(val) >= 15) {
              return val.toFixed(0)   // 大数：不保留小数
            } else {
              return val.toFixed(5)   // 小数：保留两位
            }
          }
        }
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
        lineStyle: {
          width: 4,
          shadowColor: 'rgba(0,0,0,0.2)',
          shadowBlur: 10,
          shadowOffsetY: 8
        },
        areaStyle: {
          opacity: 0.8,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(64, 158, 255, 0.7)'
              },
              {
                offset: 0.8,
                color: 'rgba(64, 158, 255, 0.1)'
              }
            ]
          }
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            borderWidth: 3,
            borderColor: '#fff',
            shadowColor: 'rgba(0,0,0,0.5)',
            shadowBlur: 10
          }
        },
        data: []
      }
    ]
  }
])

// 初始化echarts
const echartsDomRefs = optionArr.value.map((option) => {
  return {
    domRef: ref(null),
    ...useEcharts(toRef(option))
  }
})

const tableRef = ref()

const data = ref([])
const filterParam = reactive({})

// QoE指标数据通过API获取
const metricsData = ref([])
const currentEntity = ref(null)
const currentMetric = ref(null)

watch(data, (val) => {
    if (val && val.length > 0) {
        // 只有当用户没有手动选择过实体时，才默认将第一项赋值给 currentEntity
        if (!currentEntity.value) {
            currentEntity.value = val[0]
            // 仅设置实体，不在这里调用更新函数
        }
    }
})

watch(currentEntity, (val) => {
  if (val) {
    updateMetricsDataByEntity(val)
  }
})


watch(metricsData, (val) => {
  // ✅ 非 trend 模式不自动更新图表
  if (!showTrend.value) return

  if (val && val.length > 0) {
    if (!currentMetric.value) {
      currentMetric.value = val[0]
      updateChartData(val[0])
    } else {
      updateChartData(currentMetric.value)
    }
  }
})


const selectedType = ref('network') // 默认类型

const topNetworkFilterColumns = computed(() => [
  { prop: 'networkName', label: t('system.anomaly.network.networkName') },
  { prop: 'totalErrors', label: t('system.anomaly.network.totalErrors') },
  { prop: 'jitter', label: t('system.anomaly.network.jitter') },
  { prop: 'throughout', label: t('system.anomaly.network.throughout') },
  { prop: 'packetLoss', label: t('system.anomaly.network.packetLoss') },
  { prop: 'rtt', label: t('system.anomaly.network.rtt') }
])

const topContainerFilterColumns = computed(() => [
  { prop: 'containerName', label: t('system.anomaly.container.containerName') },
  { prop: 'totalErrors', label: t('system.anomaly.container.totalErrors') },
  { prop: 'processes', label: t('system.anomaly.container.processes') },
  { prop: 'cpuUsage', label: t('system.anomaly.container.cpuUsage')},
  { prop: 'memory', label: t('system.anomaly.container.memory') },
  { prop: 'writesBytes', label: t('system.anomaly.container.writesBytes')},
  { prop: 'readsBytes', label: t('system.anomaly.container.readsBytes')},
  { prop: 'receiveBytes', label: t('system.anomaly.container.receiveBytes') },
  { prop: 'transmitBytes', label: t('system.anomaly.container.transmitBytes') },
  { prop: 'receivePackets', label: t('system.anomaly.container.receivePackets') },
  { prop: 'transmitPackets', label: t('system.anomaly.container.transmitPackets') }
])

const topFilterColumns = ref(topNetworkFilterColumns.value)

// 定义不同类型的表格列
const networkColumns = computed(() => [
  { type: 'index', width: 60 },
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

const containerColumns = computed(() => [
  { type: 'index', width: 60 },
  { prop: 'containerName', label: t('system.anomaly.container.containerName'), width: 250 },
  { prop: 'totalErrors', label: t('system.anomaly.container.totalErrors') },
  { prop: 'processes', label: t('system.anomaly.container.processes') },
  { prop: 'cpuUsage', label: t('system.anomaly.container.cpuUsage'), width: 250 },
  { prop: 'memory', label: t('system.anomaly.container.memory') },
  { prop: 'writesBytes', label: t('system.anomaly.container.writesBytes'), width: 150 },
  { prop: 'readsBytes', label: t('system.anomaly.container.readsBytes'), width: 150 },
  { prop: 'receiveBytes', label: t('system.anomaly.container.receiveBytes') },
  { prop: 'transmitBytes', label: t('system.anomaly.container.transmitBytes') },
  { prop: 'receivePackets', label: t('system.anomaly.container.receivePackets'), width: 150 },
  { prop: 'transmitPackets', label: t('system.anomaly.container.transmitPackets'), width: 250 },
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

const currentColumns = ref(networkColumns.value) // 取值初始化
// 根据类型动态选择列


watch(selectedType, (val) => {
  currentColumns.value = val === 'network' ? networkColumns.value : containerColumns.value
  topFilterColumns.value = val === 'network' ? topNetworkFilterColumns.value : topContainerFilterColumns.value
  data.value = [] // 清空数据
  tableRef.value?.fetchQuery?.()
})

// 根据类型动态选择 fetch API
const fetchAllEntityData = computed(() =>
  selectedType.value === 'network' ? queryNetworkList : queryContainerList
)

const fetchEntityData = computed(() => {
  if (selectedType.value === 'network') {
    // 返回一个函数，参数是 entity
    return (entity) => {
      // 只传递 network 需要的字段，比如 id 或 networkName
      return queryNetworkMetricsbyNetwork({ streamIp: entity.networkName })
    }
  } else {
    // container 类型
    return (entity) => {
      // 只传递 container 需要的字段，比如 id 或 containerName
      return queryContainerMetricsbyContainer({ containerName: entity.containerName })
    }
  }
})

const fetchLastWindowMetrics = computed(() => {
  if (selectedType.value === 'network') {
    return (params) => {
      return queryLastWindowNetworkMetrics(params)
    }
  } else {
    return (params) => {
      return queryLastWindowContainerMetrics(params)
    }
  }
})

let refreshTimer = null
onMounted(() => {
  // 等 Vue 渲染完成 m-table
  nextTick(() => {
    tableRef.value?.fetchQuery?.()
  })

  // 自动刷新
  refreshTimer = setInterval(async () => {
    // 1. 刷新表格数据
    if (tableRef.value && tableRef.value.fetchQuery) {
        await tableRef.value.fetchQuery();
    }

    // 2. 如果存在选中的实体，自动刷新其指标和图表
    // 如果有选中的实体，就强制刷新它的指标数据
    if (currentEntity.value) {
      console.log('自动刷新：更新已选实体的指标和图表')
      await updateMetricsDataByEntity(currentEntity.value)
    }
    }, 15000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

// 当选择框变化时刷新表格
function handleTypeChange(type) {
  console.log('切换实体类型:', type)

  // 重置当前选中的指标
  currentEntity.value = null
  currentMetric.value = null
  // 清空表格数据
  data.value = []
  // 刷新表格
  tableRef.value?.fetchQuery?.()
}

// 1. 指标名和 prop 映射（顺序要和后端返回的数组一致）
const containerMetricFields = [
  { prop: 'processes', label: t('system.anomaly.container.processes') },
  { prop: 'cpuUsage', label: t('system.anomaly.container.cpuUsage') },
  { prop: 'memory', label: t('system.anomaly.container.memory') },
  { prop: 'writesBytes', label: t('system.anomaly.container.writesBytes') },
  { prop: 'readsBytes', label: t('system.anomaly.container.readsBytes') },
  { prop: 'receiveBytes', label: t('system.anomaly.container.receiveBytes') },
  { prop: 'transmitBytes', label: t('system.anomaly.container.transmitBytes') },
  { prop: 'receivePackets', label: t('system.anomaly.container.receivePackets') },
  { prop: 'transmitPackets', label: t('system.anomaly.container.transmitPackets') }
]

const networkMetricFields = [
  { prop: 'jitter', label: t('system.anomaly.network.jitter') },
  { prop: 'throughout', label: t('system.anomaly.network.throughout') },
  { prop: 'packetLoss', label: t('system.anomaly.network.packetLoss') },
  { prop: 'rtt', label: t('system.anomaly.network.rtt') }
]
const metricFields = computed(() =>
  selectedType.value === 'network' ? networkMetricFields : containerMetricFields
)

async function updateMetricsDataByEntity(entity) {
  try {
    const res = await fetchEntityData.value(entity)
    const list = res?.data?.list ?? []

    // ✅ 情况 A：后端已经返回 [{prop,label,value}, ...]
    if (Array.isArray(list) && list.length > 0 && typeof list[0] === 'object') {
      metricsData.value = list
      return
    }

    // ✅ 情况 B：后端返回数值数组，需要用字段表映射
    if (Array.isArray(list)) {
      metricsData.value = metricFields.value.map((f, idx) => ({
        ...f,
        value: list[idx]
      }))
      return
    }

    metricsData.value = []
  } catch {
    metricsData.value = []
  }
}




function viewEntity(entity) {
  console.log('查看指标详情:', entity)
  currentEntity.value = entity 

  const entityName = selectedType.value === 'network' 
    ? entity.networkName 
    : entity.containerName
  
  
  // 显示成功消息
  ElMessage.success(`已加载 ${entityName} 的趋势分析图表`)
}


// 更新图表数据的函数
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

    // 更新图表配置
    // 安全获取国际化翻译
    const metricName = t(`system.anomaly.${selectedType.value}.${metric.prop}`) || metric.prop
    
    // 更新图表配置
    const chartTitle = `${metricName}趋势分析`
    optionArr.value[0].title.text = chartTitle
    optionArr.value[0].series[0].name = metric.prop
    optionArr.value[0].series[0].data = newData

    // ====== 动态纵坐标 ======
    if (newData.length > 0) {
      const values = newData.map(Number)
      const minVal = Math.min(...values)
      const maxVal = Math.max(...values)

      optionArr.value[0].yAxis[0].min = minVal * 0.9   // 下限留点余量
      optionArr.value[0].yAxis[0].max = maxVal * 1.1   // 上限留点余量
      // optionArr.value[0].yAxis[0].name = metric.prop   // y 轴标题改成指标名
    }

    echartsDomRefs[0].setOption(optionArr.value[0])
  } catch (error) {
    console.error('获取趋势数据失败:', error)
  }
}

</script>
<style lang="scss" scoped>
.root {
  border: 2px solid rgb(0, 251, 255); /* 添加蓝色边框用于调试 */
  display: flex;
  flex-direction: column;
  height: calc(100vh - 40px); /* 减去一些边距避免溢出 */
  gap: 10px;
  padding: 10px;
  box-sizing: border-box;

  .m-table {
    //flex-shrink: 0;
    //height:300px;
    flex: 1;
    min-height: 0; // 关键：让表格能在 flex 容器里正确撑满/滚动

    border: 2px solid rgb(255, 0, 51); /* 添加红色边框用于调试 */
    
    // 美化m-table样式
    :deep(.el-table) {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      
      .el-table__header th {
        background-color: var(--el-fill-color-light);
        color: var(--el-text-color-primary);
        font-weight: 600;
        font-size: 15px;
        height: 45px;
        border-bottom: 2px solid var(--el-border-color-lighter);
      }
      
      .el-table__body td {
        height: 46px;
        padding: 8px;
        font-size: 15px;
        border-bottom: 1px solid var(--el-border-color-extra-light);
      }

      .el-table__row {
        transition: background-color 0.3s ease;
        
        &:hover {
          background-color: var(--el-fill-color-extra-light);
        }
        
        &:nth-child(even) {
          background-color: rgba(0, 0, 0, 0.02);
        }
      }

      // 美化操作按钮
      .el-button {
        border-radius: 6px;
        font-weight: 500;
        font-size: 13px;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-1px);
        }
      }

      &.el-table--border {
        border-left: none;
        border-right: none;
        
        &::after {
          display: none;
        }
      }
    }
  }

  .metric-content {
    flex: 1;
    border: 2px solid rgb(0, 255, 0); /* 添加绿色边框用于调试 */
    padding: 15px;
    border-radius: var(--el-border-radius-base);
    background-color: var(--el-bg-color);
    overflow-y: auto;
    min-height: 200px; /* 确保最小高度 */
    display: flex;
    gap: 10px;

    .metrics-table {
      width: 600px;
      flex-shrink: 0;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      padding: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--el-border-color-extra-light);
      
      // 定义字体大小变量
      --metrics-font-size: 20px;
      --metrics-header-font-size: 18px;
      --metrics-unit-font-size: 16px;

      // --- CSS MODIFICATION START ---
      display: flex;
      flex-direction: column;
      // --- CSS MODIFICATION END ---
      &.only-metrics {
        .metrics-table {
          width: 100% !important;
          flex: 1;
        }

        :deep(.el-table) {
          width: 100% !important;
        }
      }

      // ✅ 趋势分析独占页面：右栏满宽
      &.only-trend {
        .right-content {
          margin-left: 0 !important;
          width: 100% !important;
          flex: 1;
        }
      }
      .metrics-title {
        margin: 0 0 20px 0;
        font-size: 20px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        padding: 0 0 15px 0;
        border-bottom: 3px solid transparent;
        background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3)) bottom/100% 3px no-repeat;
        position: relative;
        text-align: center;
        flex-shrink: 0; // 防止标题被压缩
        
        &::before {
          content: '📊';
          margin-right: 8px;
          font-size: 18px;
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
        // --- CSS MODIFICATION START ---
        flex: 1;
        min-height: 0; // 关键属性，允许表格在flex容器中正确收缩
        // --- CSS MODIFICATION END ---
        font-size: var(--metrics-font-size);
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
        border: none;
        background: #ffffff;
        table-layout: fixed;
        
        .el-table__header-wrapper {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          
          th {
            font-size: var(--metrics-header-font-size);
            font-weight: 700;
            background: transparent !important;
            color: #0866f1 !important;
            height: 60px;
            border-bottom: none;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            position: relative;
            white-space: nowrap;
            padding: 18px 20px; // 表头单元格内边距：上下18px，左右20px
            
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
              gap: 4px;
              width: 100%;
              box-sizing: border-box;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        }
        
        .el-table__body {
          td {
            font-size: var(--metrics-font-size);
            line-height: 1.5;
            height: 65px;
            padding: 18px 20px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            border-right: 1px solid rgba(0, 0, 0, 0.1); // 添加垂直分隔线
            transition: all 0.3s ease;
            position: relative;
            white-space: nowrap;
            overflow: visible;
            text-overflow: ellipsis;
            box-sizing: border-box;
            
            &:last-child {
              border-right: none; // 最后一列不需要右边框
            }
            
            // 指标名称列美化
            &:nth-child(1) {
              font-weight: 500;
              color: var(--el-text-color-primary);
              text-align: center;
            }
            
            // 合并的数值列美化
            &:nth-child(2) {
              .metric-value {
                font-weight: 600;
                color: var(--el-color-primary);
                font-family: 'Consolas', 'Monaco', monospace;
                margin-right: 5px;
                display: inline-block;
                box-sizing: border-box;
                text-align: center;
              }
              
              .metric-unit {
                font-weight: 500;
                color: var(--el-text-color-secondary);
                font-style: italic;
                font-size: var(--metrics-unit-font-size);
                display: inline-block;
                text-align: left;
              }
            }
            
            // 操作列
            &:nth-child(3) {
              padding: 15px 20px;
            }
          }
        }

        .el-table__row {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          
          &:hover {
            background: linear-gradient(90deg, rgba(64, 158, 255, 0.08), rgba(103, 126, 234, 0.05)) !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            
            td {
              border-bottom-color: rgba(64, 158, 255, 0.2);
            }
          }
          
          &:nth-child(even) {
            background: linear-gradient(90deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.01));
          }
          
          &:last-child td {
            border-bottom: none;
          }
        }

        // 美化查看按钮
        .el-button {
          border-radius: 10px;
          padding: 10px 18px;
          font-weight: 600;
          font-size: 14px;
          background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
          border: none;
          color: white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          min-width: 70px;
          
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
          }
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(64, 158, 255, 0.4);
            background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
            
            &::before {
              left: 100%;
            }
          }
          
          &:active {
            transform: translateY(0);
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
          }
        }

        // 去掉默认边框
        &.el-table--border {
          border: none;
          
          &::after {
            display: none;
          }
          
          td, th {
            border-right: 1px solid rgba(0, 0, 0, 0.1); // 添加单元格右侧边框
          }
          
          // 最后一列不显示右边框
          td:last-child, th:last-child {
            border-right: none;
          }
        }
        
        &.el-table--striped {
          .el-table__body tr.el-table__row--striped td {
            background: rgba(0, 0, 0, 0.02);
          }
        }
        
        // 禁用列宽调整
        .el-table__header th .el-table__column-filter-trigger {
          display: none;
        }
        
        .el-table__header-wrapper .el-table__header th {
          user-select: none;
          resize: none;
          
          &::after {
            display: none !important;
          }
        }
        
        // 确保列宽一致
        .el-table__header colgroup col,
        .el-table__body colgroup col {
          width: auto !important; // 使用我们设置的宽度
        }
        
        // 修复多余空列问题和列宽不一致问题
        .el-table__body,
        .el-table__header {
          width: 100% !important;
          table-layout: fixed !important;
        }
        
        .el-table__body-wrapper,
        .el-table__header-wrapper {
          width: 100% !important;
          overflow: hidden;
        }
        
        // 确保表头和单元格列宽一致
        .el-table__cell {
          box-sizing: border-box !important;
        }
      }
    }

    .right-content {
      flex: 1;
      padding: 15px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      margin-left: 20px;
      display: flex;
      flex-direction: column;
      
      .charts-title {
        margin: 0 0 20px 0;
        font-size: 20px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        padding: 0 0 15px 0;
        border-bottom: 3px solid transparent;
        background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3)) bottom/100% 3px no-repeat;
        position: relative;
        text-align: center;
        
        &::before {
          content: '📈';
          margin-right: 8px;
          font-size: 18px;
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
        min-height: 280px;
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

  .left-tree-view {
    height: auto;
    padding: 15px;
    width: 200px;
    border-radius: var(--el-border-radius-base);
    background-color: var(--el-bg-color);

    .tree-filter-view {
      display: flex;
      margin-bottom: 10px;
    }
  }
}

.width-shrink-layout {
  .root {
    height: auto;
    flex-wrap: wrap;

    .left-tree-view {
      width: 100%;
    }

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