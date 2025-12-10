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
          style="width: 100%;" height="100%"
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
        fontSize: 24, // 【修改】标题字体 24px
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
      left: '5%',    // 【调整】增加左侧边距，容纳大号Y轴文字
      right: '6%',
      bottom: '15%', // 【调整】增加底部边距，容纳大号X轴文字
      top: '20%',    // 【调整】增加顶部边距，容纳大号标题
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        // 【修复】恢复初始横轴数据，防止页面加载时横轴消失
        data: Array.from({ length: 50 }, (_, i) => `${i + 1}秒`),
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        axisLabel: {
          color: '#666',
          fontSize: 24, // 【修改】横轴刻度字体 24px
          fontWeight: 'bold'
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
          fontSize: 24, // 【修改】纵轴名称字体 24px
          padding: [0, 50, 0, 0], // 【调整】增加padding防止文字重叠
          fontWeight: 'bold'
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#666',
          fontSize: 24, // 【修改】纵轴刻度字体 24px
          fontWeight: 'bold'
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
        // 【修复】恢复初始曲线数据，防止页面加载时曲线消失
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
  { type: 'index', width: 100 },
  // 按要求的顺序：IPC编号、在线状态、接入协议、客户端地址、流ID、QoE使能
  { prop: 'ipcNumber', label: t('system.qoe.ipcNumber'), width: 300 },
  { prop: 'deviceName', label: t('system.qoe.deviceName'),width: 220 },
  {
    prop: 'online',
    label: '在线状态',
    width: 220,
    formatter: (row) => row.online ? '在线' : '离线',
    align: 'center'
  },
  { prop: 'accessProtocol', label: t('system.qoe.accessProtocol'), width: 300 },
  { prop: 'clientAddress', label: t('system.qoe.clientAddress'), width: 250 },
  { prop: 'streamId', label: t('system.qoe.streamId'), width: 300 },
  { prop: 'qoeEnabled', label: t('system.qoe.qoeEnabled'), type: 'select', itemList: booleanOptions, width: 200 },
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
    ], width: 350
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
  try {
    // 异步获取趋势数据
    const res = await getQoeMetricTrendData(metric.name)
    // 增加空值保护，如果后端返回空，默认为空数组
    const newData = res?.data?.data?.trend || []
    
    const chartTitle = `${metric.name}趋势分析`
    
    console.log('更新图表数据:', chartTitle, '数据点数:', newData.length)
    
    // 1. 更新标题
    optionArr.value[0].title.text = chartTitle
    
    // 2. 更新系列数据
    optionArr.value[0].series[0].name = metric.name
    optionArr.value[0].series[0].data = newData
    
    // 3. 【核心修复】自适应横轴范围
    // 根据新数据的长度动态生成 1秒, 2秒... N秒 的标签
    // 如果没有数据，保持原横轴或清空，这里选择清空以匹配空数据
    if (newData.length > 0) {
      const newXAxisData = Array.from({ length: newData.length }, (_, i) => `${i + 1}秒`)
      optionArr.value[0].xAxis[0].data = newXAxisData
    } else {
      optionArr.value[0].xAxis[0].data = []
    }

    // 4. 根据指标类型动态调整Y轴范围配置
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
    
    // 5. 触发图表重绘
    if (echartsDomRefs[0]) {
      echartsDomRefs[0].setOption(optionArr.value[0], true) // true表示不合并，彻底更新配置
    }
  } catch (error) {
    console.error('更新图表数据失败:', error)
    ElMessage.error('获取趋势数据失败')
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
    flex-shrink: 0;
    height:400px;
    border: 2px solid rgb(255, 0, 51); /* 添加红色边框用于调试 */

    /* ------------------- 以下为新增同步的样式 ------------------- */

    /* 1. 表格行高与内容垂直居中 */
    :deep(.el-table__cell) {
      padding: 12px 0 !important; /* 增加单元格上下内边距 */
    }
    :deep(.el-table .cell) {
      line-height: 1.5; /* 防止大号字体被裁剪 */
    }

    /* 2. 顶部搜索框 (Top Filter) 样式 */
    :deep(.top-filter) {
      /* 搜索项间距 */
      .el-form-item {
        margin-right: 15px;
        margin-bottom: 10px;
      }
      /* 输入框宽度限制 */
      .el-input, .el-select {
        width: 160px;
      }
      /* Label字体 (如: IPC编号) */
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
        
        /* 核心修改：字号32px，高度60px，居中 */
        font-size: 32px !important;
        height: 60px !important;
        text-align: center !important;
        border-bottom: 2px solid var(--el-border-color-lighter);

        /* 确保表头文字垂直水平居中 */
        .cell {
          justify-content: center !important;
          display: flex;
          align-items: center;
          line-height: 1.5;
        }
      }

      /* 2. 表格内容样式 (这里是本次修改的重点！！！) */
      .el-table__body td {
        font-size: 32px !important;
        height: 60px !important;
        padding: 12px 0 !important;
        border-bottom: 1px solid var(--el-border-color-extra-light);

        /* ⬇️⬇️⬇️ 关键修改：取消 Flex，改回默认 Block 布局 ⬇️⬇️⬇️ */
        .cell {
          font-size: 32px !important;
          line-height: 36px !important; /* 设置行高与字体相近，防止被撑太高 */
          
          /* 使用文本居中，而不是 Flex 居中 */
          text-align: center !important; 
          
          /* 强制不换行，这是出省略号的前提 */
          white-space: nowrap !important;
          
          /* 恢复 Element Plus 默认的 block 显示，这样 text-overflow 才能生效 */
          display: block !important; 
          
          /* 确保溢出隐藏 */
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
      }

      /* 3. 行样式 (Row) */
      .el-table__row {
        height: 60px !important; /* 强制行高适配大字体 */
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
        
        /* 修改：按钮字体放大到24px以匹配表格 */
        font-size: 24px !important; 
        padding: 8px 16px; /* 增加内边距防止文字拥挤 */
        height: auto;
        
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-1px);
        }
        
        /* 图标也同步放大 */
        .el-icon {
            font-size: 24px !important;
        }
      }

      /* 5. 去除多余边框 */
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
    /* --- 修改点 4：限制父容器高度，防止超出屏幕 --- */
    height: 650px; /* 固定一个合适的高度，或者使用 calc(100vh - 380px) */
    flex-shrink: 0; /* 防止被压缩 */
    
    border: 2px solid rgb(0, 255, 0); /* 调试边框（可按需保留或删除） */
    padding: 10px;
    border-radius: var(--el-border-radius-base);
    background-color: var(--el-bg-color);
    overflow: hidden; /* 防止溢出 */
    display: flex;
    gap: 10px;

    /* --- 左侧表格区域 --- */
    .metrics-table {
      /* --- 修改点 3：增加左侧宽度，防止文字换行 --- */
      width: 750px; 
      flex-shrink: 0;
      
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      padding: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--el-border-color-extra-light);
      
      display: flex;
      flex-direction: column;
      height: 100%; /* 占满父容器定义的 480px */

      /* 定义变量 */
      --metrics-font-size: 32px;
      --metrics-header-font-size: 32px;
      --metrics-unit-font-size: 32px;

      .metrics-title {
        margin: 0 0 10px 0; /* 减少间距 */
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
            
            /* --- 修改点 1：改回深色字体，确保可见 --- */
            color: #333333 !important; 
            
            height: 60px; /* 稍微减小表头高度 */
            border-bottom: none;
            position: relative;
            white-space: nowrap;
            padding: 10px 5px; /* 减少左右 padding */
            
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
              box-sizing: border-box;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 1.2;
            }
          }
        }
        
        .el-table__body {
          td {
            font-size: var(--metrics-font-size);
            /* --- 修改点 2：增加行高，并使用 flex 布局垂直居中 --- */
            line-height: 1.5; 
            
            /* 减少 padding，因为字体大了，空间有限，靠 height:100% 自动分配 */
            padding: 0 10px; 
            
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            border-right: 1px solid rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            position: relative;
            white-space: nowrap;
            overflow: visible;
            text-overflow: ellipsis;
            box-sizing: border-box;
            
            /* 关键：使用 flex 布局让内部文本框自动垂直居中且撑开 */
            .cell {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                line-height: normal; /* 重置 cell 默认行高 */
            }

            &:last-child {
              border-right: none;
            }
            
            &:nth-child(1) {
              font-weight: 500;
              color: var(--el-text-color-primary);
              text-align: center;
            }
            
            &:nth-child(2) {
              .metric-value {
                font-weight: 600;
                color: var(--el-color-primary);
                font-family: 'Consolas', 'Monaco', monospace;
                margin-right: 10px;
                display: inline-block;
                text-align: center;
                font-size: 32px;
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
            
            &:nth-child(3) {
              padding: 0 5px;
            }
          }
          
          tr {
             height: 100%; 
          }
        }

        .el-table__row {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          
          &:hover {
            background: linear-gradient(90deg, rgba(64, 158, 255, 0.08), rgba(103, 126, 234, 0.05)) !important;
            transform: translateY(-1px);
            
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

        .el-button {
          border-radius: 8px;
          /* 调整按钮 padding，适应变高后的行 */
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

        /* 隐藏其他不必要的表格元素 */
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
      flex: 1; /* 保持 flex: 1，由于左侧变宽，右侧会自动缩小一点 */
      
      /* --- 修改点 4：高度与左侧一致 --- */
      height: 100%; 
      
      padding: 15px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      /* margin-left: 20px; */ /* 不需要 margin-left，父容器有 gap: 10px */
      display: flex;
      flex-direction: column;
      
      .charts-title {
        margin: 0 0 10px 0;
        font-size: 32px; /* 统一 32px */
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
        flex: 1; /* 占满剩余高度 */
        min-height: 0; /* 允许压缩 */
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
