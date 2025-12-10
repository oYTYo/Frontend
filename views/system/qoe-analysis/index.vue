<template>
  <div class="root">
    
    <m-table
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
      :columns="columns"
      :fetch-data="queryQoeList"
      v-model:data="data"
      :pagination="{ layout: 'sizes,prev,pager,next,jumper' }"
      
    ></m-table>

    <!-- 下方区域用于定义其他组件 -->
    <div class="metric-content">
      <!-- 左侧指标表格 -->
      <div class="metrics-table">
        <h3 class="metrics-title">QoE指标监控</h3>
        <el-table
          :data="metricsData"
          border
          stripe
          size="default"
          style="width: 560px;"
          :resizable="false"
          :cell-style="{ padding: '18px 20px', boxSizing: 'border-box' }"
          :header-cell-style="{ padding: '18px 20px', boxSizing: 'border-box' }"
          table-layout="fixed"
        >
          <el-table-column prop="name" label="指标名称" width="180" :resizable="false" align="center">
            <template #header>
              <span>📊 指标名称</span>
            </template>
          </el-table-column>
          <el-table-column label="数值" width="280" align="center" :resizable="false">
            <template #header>
              <span>📈 数值</span>
            </template>
            <template #default="scope">
              <span class="metric-value">{{ scope.row.value }}</span>
              <span class="metric-unit" v-if="scope.row.unit">{{ scope.row.unit }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" :resizable="false">
            <template #header>
              <span>⚙️ 操作</span>
            </template>
            <template #default="scope">
              <el-button 
                type="primary" 
                size="small" 
                @click="viewMetricDetail(scope.row)"
              >
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 右侧区域预留给其他组件 -->
      <div class="right-content">
        <h3 class="charts-title">QoE趋势分析</h3>
        <div v-for="(o, i) in echartsDomRefs" :key="i" :ref="(el) => { if(el) o.domRef.value = el }" class="charts-item" />
      </div>
    </div>

  </div>
</template>
<script setup lang="jsx">
import { computed, reactive, ref, toRef } from 'vue'
// ...已合并到下一行，删除本行重复导入
import { queryQoeList, queryQoeTree, getQoeMetricTrendData, getQoeMetricsData } from '@/api/system/qoe'
// import getDictDetails from '@/utils/dict'
import { useSystemStore } from '@/stores/system'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useCssVar } from '@vueuse/core'
import { useEcharts } from '@/utils'


const booleanOptions = [
  { label: '是', value: true },
  { label: '否', value: false }
]
const { t } = useI18n()
const systemStore = useSystemStore()
const qoeData = ref([])
const qoeQueryParam = ref({
  deviceName: ''
})

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
      text: 'QoE评分趋势分析',
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
        data: Array.from({ length: 50 }, (_, i) => `${i + 1}秒`),
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
        name: 'QoE评分',
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
        data: [3.8, 4.2, 3.6, 4.5, 3.9, 4.1, 4.3]
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

getQoeTree()

function getQoeTree() {
  queryQoeTree(qoeQueryParam.value).then((res) => {
    const list = res.data.list
    const obj = {}
    list.forEach((i) => {
      i.children = []
      obj[i.id] = i
    })
    const data = list.filter((i) => {
      const parent = obj[i.parentId]
      if (parent) {
        parent.children.push(i)
        return false
      }
      // parentId不存在的为根元素
      return true
    })
    qoeData.value = [{ id: 0, name: t('system.qoe.all'), children: data }]
  })
}

const tableRef = ref()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultProps = {
  children: 'children',
  label: 'name'
}

const data = ref([])
const filterParam = reactive({})

// QoE指标数据通过API获取
const metricsData = ref([])

getQoeMetricsData().then(res => {
  // 兼容后端返回结构 result.data.data
  metricsData.value = Array.isArray(res.data) ? res.data : (res.data?.data || [])
})

const topFilterColumns = computed(() => [
  { prop: 'ipcNumber', label: t('system.qoe.ipcNumber') },
  { prop: 'streamId', label: t('system.qoe.streamId') },
  { prop: 'online', label: '在线状态', type: 'select', itemList: booleanOptions },
  { prop: 'deviceName', label: t('system.qoe.deviceName') },
  { prop: 'accessProtocol', label: t('system.qoe.accessProtocol') },
  { prop: 'clientAddress', label: t('system.qoe.clientAddress') },
  { prop: 'transportProtocol', label: t('system.qoe.transportProtocol') },
  { prop: 'enabled', label: t('common.isEnabled'), type: 'select', itemList: booleanOptions }
])

const columns = computed(() => [
  { type: 'index', width: 60 },
  // 按要求的顺序：IPC编号、在线状态、接入协议、客户端地址、流ID、QoE使能
  { prop: 'ipcNumber', label: t('system.qoe.ipcNumber'), width: 250 },
  { prop: 'deviceName', label: t('system.qoe.deviceName'),width: 150 },
  {
    prop: 'online',
    label: '在线状态',
    width: 150,
    formatter: (row) => row.online ? '在线' : '离线',
    align: 'center'
  },
  { prop: 'accessProtocol', label: t('system.qoe.accessProtocol'), width: 190 },
  { prop: 'clientAddress', label: t('system.qoe.clientAddress'), width: 160 },
  { prop: 'streamId', label: t('system.qoe.streamId') },
  { prop: 'qoeEnabled', label: t('system.qoe.qoeEnabled'), type: 'select', itemList: booleanOptions, width: 100 },
  // 其余列保持不变
  // { prop: 'transportProtocol', label: t('system.qoe.transportProtocol'), width: 100 },
  // { prop: 'averageBitrate', label: t('system.qoe.averageBitrate'), width: 120 },
  // { prop: 'createTime', label: t('system.qoe.createTime'), type: 'datetime', width: 155 },
  {
    type: 'operation',
    fixed: 'right',
    align: 'center',
    buttons: [
      {
        label: '查看指标',
        icon: 'view',
        onClick: (row) => viewMetricDetail(row),
        disabled: (row) => row.online === 0
      }
    ]
  }
])

const currentNode = ref()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleNodeClick(node) {
  filterParam.parentId = node.id
  filterParam.parentName = node.deviceName
  currentNode.value = {
    parentId: node.id,
    parentName: node.deviceName
  }
  if (node.id === 0) {
    filterParam.parentId = ''
    filterParam.parentName = ''
    currentNode.value = {}
  }
  tableRef.value.fetchQuery()
}



// 查看指标详情
function viewMetricDetail(metric) {
  console.log('查看指标详情:', metric)
  
  // 更新折线图的标题和数据，确保 DOM 已渲染
  Promise.resolve().then(() => updateChartData(metric))
  
  // 显示成功消息
  ElMessage.success(`已加载 ${metric.name} 的趋势分析图表`)
}

// 更新图表数据的函数
async function updateChartData(metric) {
  // 异步获取趋势数据
  const res = await getQoeMetricTrendData(metric.name)
  console.log('获取的趋势数据:', res.data.data.trend)
  const newData = res.data.data.trend
  // console.log('测试获取的趋势数据:', newData)
  const chartTitle = `${metric.name}趋势分析`
  
  console.log('更新图表数据:', chartTitle, newData)
  // 更新optionArr中的配置
  optionArr.value[0].title.text = chartTitle
  optionArr.value[0].series[0].name = metric.name
  optionArr.value[0].series[0].data = newData
  
  // 根据指标类型调整Y轴配置
  const yAxisConfig = {
    '视频清晰度': { name: '清晰度评分', min: 0, max: 100 },
    '视频流畅度': { name: '流畅度评分', min: 0, max: 100 },
    '视频卡顿率': { name: '卡顿', min: -1, max: 2 },
    '码率': { name: '码率(Mbps)', min: 0, max: 2 },
    '丢包': { name: '丢包率(%)', min: 0, max: 25 },
    '抖动': { name: '抖动(ms)', min: 0, max: 100 },
    '吞吐量': { name: '吞吐量(Mbps)', min: 0, max: 2 }
  }
  
  const yConfig = yAxisConfig[metric.name] || { name: 'QoE评分', min: 1, max: 5 }
  optionArr.value[0].yAxis[0].name = yConfig.name
  optionArr.value[0].yAxis[0].min = yConfig.min
  optionArr.value[0].yAxis[0].max = yConfig.max
  
  // 触发图表更新
  echartsDomRefs[0].setOption(optionArr.value[0])
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
    flex-shrink: 0;
    height:300px;
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

      .el-table__header th {
      background-color: var(--el-fill-color-light);
      color: var(--el-text-color-primary);
      font-weight: 600;
      
      /* ⬇️⬇️⬇️ 修改这里 ⬇️⬇️⬇️ */
      font-size: 32px; /* 原为 15px，建议改为 16px-20px */
      /* ⬆️⬆️⬆️ 修改这里 ⬆️⬆️⬆️ */
      
      height: 45px;
      border-bottom: 2px solid var(--el-border-color-lighter);
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
