<template>
  <div class="charts-container">
    <div v-for="(o, i) in echartsDomRefs" :key="i" class="chart-wrapper">
      <div class="chart-controls">
        <!-- 左图表(i=0)添加刷新按钮 -->
        <el-button 
          v-if="i === 0"
          @click="refreshChartData(i)"
          type="primary"
          :icon="RefreshIcon"
          size="large"
          class="refresh-btn"
          :loading="refreshing"
        >
          刷新
        </el-button>
        <el-select 
          v-model="selectedTitles[i]" 
          placeholder="选择图表标题"
          @change="updateChartTitle(i, $event)"
          size="large"
          class="custom-select"
          filterable
        >
          <!-- 左侧图表用原有 titleOptions，右侧用新定义的 rightChartSelectOptions -->
          <el-option
            v-for="title in i === 0 ? titleOptions : rightChartSelectOptions"
            :key="title.value"
            :label="title.label"
            :value="title.value"
            class="custom-option"
          />
        </el-select>
      </div>
      <div :ref="(r) => ((o.domRef as any).value = r as any)" class="charts-item" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { EChartsOption } from '@/utils'
import { useEcharts } from '@/utils'
import type { Ref } from 'vue'
import { computed, nextTick, ref, toRef, watch, onMounted } from 'vue'
import { useCssVar } from '@vueuse/core'
import { useThemeStore } from '@/stores/theme'
import { useI18n } from 'vue-i18n'
import { useSystemStore } from '@/stores/system'
import { getDeviceList } from '@/api/system/home'
import { CHART_COLORS } from '@/utils/chartColors'
import { Refresh } from '@element-plus/icons-vue'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { t } = useI18n()

defineOptions({
  name: 'HomeCharts'
})

// 刷新按钮图标
const RefreshIcon = Refresh
// 刷新状态
const refreshing = ref(false)

// 标题选项
const titleOptions = ref([
  { label: '设备健康值', value: 'device_health' },
  { label: '重连异常', value: 'video_reconnect_error' },
  { label: '缓冲异常', value: 'video_buffer_error' },
  { label: '严重卡顿', value: 'severe_lag' },
  { label: '离线状态', value: 'offline_status' }
])

// 右侧图表横坐标类型

// 右侧图表下拉框选项
const rightChartSelectOptions = ref([
  { label: '设备-01', value: 'device-01' },
  { label: '设备-02', value: 'device-02' }
])

const rightChartLabels = [
  '重连异常',
  '缓冲异常',
  '严重卡顿',
  '离线状态'
]

// 当前选中的标题
const selectedTitles = ref(['device_health', '设备-02'])

// 获取当前选中标题的详细信息（供后续访问）
// const getCurrentTitles = () => {
//   return selectedTitles.value.map((value, index) => {
//     const option = titleOptions.value.find(opt => opt.value === value)
//     return {
//       index: index + 1,
//       value: value,
//       label: option?.label || '未知',
//       chartType: index === 0 ? 'line' : 'bar'
//     }
//   })
// }

// 暴露给外部使用的函数
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getSelectedTitleByIndex = (index: number) => {
  const titleValue = selectedTitles.value[index]
  const option = titleOptions.value.find(opt => opt.value === titleValue)
  return {
    value: titleValue,
    label: option?.label || '未知'
  }
}
const deviceLabels = ref(['设备-01', '设备-02'])
const dataA=ref([85, 72])
const dataB=ref([false, false, false, false])

// 刷新图表数据的函数
const refreshChartData = async (index: number) => {
  console.log(`刷新图表 ${index + 1} 的数据`)
  refreshing.value = true
  try {
    const response = await getDeviceList()
    console.log('刷新获取数据:', response)
    if (response && response.data) {
      // console.log('信息:', response.data)
      // dataB.value=[0.5,0.5,1,0.5]
      console.log('数据刷新成功:', dataB.value)
      console.log('设备列表:', response.data.exceptionStatus.devices)
      console.log('指标A:', response.data.exceptionStatus.health)
      console.log('指标B:', response.data.exceptionStatus.buffer_exception)
      // 左侧只显示一个标签和一个数据
      deviceLabels.value = ['设备-01', '设备-02']
      dataA.value = [10,response.data.exceptionStatus.health ?? 0]
      // 构造右侧图表数据为四个指标
      const ex = response.data.exceptionStatus
      dataB.value = [
        ex.reconnection_exception === true ? 1 : ex.reconnection_exception === false ? 0.5 : ex.reconnection_exception ?? 0,
        ex.buffer_exception === true ? 1 : ex.buffer_exception === false ? 0.5 : ex.buffer_exception ?? 0,
        ex.severe_lag === true ? 1 : ex.severe_lag === false ? 0.5 : ex.severe_lag ?? 0,
        false ? 1 : 0.5
      ]
    }
  } catch (err) {
    console.error('数据刷新失败:', err)
  } finally {
    refreshing.value = false
  }
}
// 更新图表标题的函数
const updateChartTitle = async (index: number, titleValue: string) => {
  console.log('设备列表原始值:', deviceLabels.value)
  const titleOption = titleOptions.value.find(option => option.value === titleValue)
  if (titleOption) {
    console.log(`图表 ${index + 1} 标题已更改为: ${titleOption.label} (${titleValue})`)
    // 每次选择时调用 getDeviceList 并打印
    try {
      const response = await getDeviceList()
      console.log('getDeviceList 返回:', response)
      if (response && response.data) {
        console.log('设备列表:', response.data.devices)
        console.log('指标A:', response.data.indexA)
        console.log('指标B:', response.data.indexB)
        if (Array.isArray(response.data.devices)) {
          deviceLabels.value = response.data.devices
          // 更新图表数据
          dataA.value = response.data.indexA || [0, 0, 0, 0]
          dataB.value = response.data.indexB || [0, 0, 0, 0]
          console.log('设备列表已更新:', deviceLabels.value)

        }
      }
    } catch (err) {
      console.error('getDeviceList 调用失败:', err)
    }
    // 获取当前选中的所有标题
    const currentTitles = selectedTitles.value.map((value, idx) => {
      const option = titleOptions.value.find(opt => opt.value === value)
      return {
        index: idx + 1,
        value: value,
        label: option?.label || '未知'
      }
    })
    console.log('当前所有图表标题:', currentTitles)
  }
}
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

// 对应colorBar.vue的四个图例颜色
const chartColors = ref(CHART_COLORS)

const optionArr: Ref<EChartsOption[]> = computed(() => [
  {
    // 使用自定义颜色数组
    color: chartColors.value,
    // 移除标题显示
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '0px', // 减少顶部空白
      bottom: '1%', // 减少底部留白，纵向放大图表
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
          data: deviceLabels.value.slice(0, 2), // 只显示设备-01和设备-02
          axisTick: {
            alignWithLabel: true
          },
          axisLabel: {
            fontSize: 32, // 增大横坐标字体大小
            fontWeight: 'bold', // 加粗字体
            color: (value: string) => value === '设备-01' ? '#ff4d4f' : '#333' // 设备-01为红色，其余为默认色
          }
      }
    ],
    yAxis: [
        {
          type: 'value',
          min: 0,
          max: 100
        }
    ],
    series: [
      {
        name: 'QoE指标',
        type: 'bar',
        barWidth: '20%',
          data: [
            { value: dataA.value[0], itemStyle: { color: '#ff4d4f' } }, // 设备-01柱状图为红色
            { value: dataA.value[1], itemStyle: { color: chartColors.value[1] } }
          ]
      }
    ]
  },
  {
    // 使用自定义颜色数组
    color: chartColors.value,
    // 移除标题显示
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '10px', // 减少顶部空白
      bottom: '1%', // 减少底部留白，纵向放大图表
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: rightChartLabels,
        axisTick: {
          alignWithLabel: true
        },
        axisLabel: {
          fontSize: 32, // 增大横坐标字体大小
          fontWeight: 'bold', // 加粗字体
          color: '#333' // 设置字体颜色
        }
      }
    ],
    yAxis: [
        {
          type: 'value',
          min: 0,
          max: 1,
          axisLabel: {
            formatter: (value: number) => {
              if (value === 0.5 || value === 1) return value.toString();
              return '';
            }
          },
          interval: 0.5
        }
    ],
    series: [
      {
        name: '性能指标',
        type: 'bar',
        barWidth: '40%',
        data: [
          { value: dataB.value[0], itemStyle: { color: dataB.value[0] === 1 ? '#ff4d4f' : (dataB.value[0] === 0.5 ? '#52c41a' : chartColors.value[0]) } },
          { value: dataB.value[1], itemStyle: { color: dataB.value[1] === 1 ? '#ff4d4f' : (dataB.value[1] === 0.5 ? '#52c41a' : chartColors.value[1]) } },
          { value: dataB.value[2], itemStyle: { color: dataB.value[2] === 1 ? '#ff4d4f' : (dataB.value[2] === 0.5 ? '#52c41a' : chartColors.value[2]) } },
          { value: dataB.value[3], itemStyle: { color: dataB.value[3] === 1 ? '#ff4d4f' : (dataB.value[3] === 0.5 ? '#52c41a' : chartColors.value[3]) } }
        ]
      }
    ]
  }
])
const echartsDomRefs = optionArr.value.map((option) => {
  return {
    ...useEcharts(toRef(option))
  }
})


// 页面渲染后自动刷新一次左侧图表
onMounted(() => {
  refreshChartData(0)
})

const themeStore = useThemeStore()
const systemStore = useSystemStore()
watch(
  () => [themeStore.currentTheme, systemStore.layout.isDark],
  () =>
    nextTick(() => {
      color.value.colorStops[0].color = useCssVar('--el-color-primary-light-7').value
      color.value.colorStops[1].color = useCssVar('--el-color-primary').value
    })
)

watch(
  () => useSystemStore().locale,
  () => {
    echartsDomRefs.forEach((i, index) => i.setOption(optionArr.value[index]))
  }
)
// 监听 deviceLabels 变化，自动更新图表
watch(
  () => deviceLabels.value,
  (newLabels) => {
    console.log('deviceLabels 变化:', newLabels)
    nextTick(() => {
      echartsDomRefs.forEach((chartRef, index) => {
        chartRef.setOption(optionArr.value[index])
      })
    })
  },
  { deep: true }
)
// 监听数据变化，自动更新图表
watch(
  () => [dataA.value, dataB.value],
  (newData) => {
    console.log('数据变化:', newData)
    nextTick(() => {
      echartsDomRefs.forEach((chartRef, index) => {
        chartRef.setOption(optionArr.value[index])
      })
    })
  },
  { deep: true }
)
// 监听标题变化，自动更新图表
watch(
  () => selectedTitles.value,
  (newTitles) => {
    console.log('标题变化监听触发:', newTitles)
    const currentTitles = newTitles.map((value, idx) => {
      const option = titleOptions.value.find(opt => opt.value === value)
      return {
        index: idx + 1,
        value: value,
        label: option?.label || '未知'
      }
    })
    console.log('所有图表当前标题状态:', currentTitles)
  },
  { deep: true }
)
</script>
<style lang="scss" scoped>
.charts-container {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 两个图表均匀分配 */
  gap: 12px; /* 减少间距 */
  height: 100%; /* 使用容器的完整高度 */
  min-height: 400px; /* 确保最小高度 */
  width: 100%;
  padding: 0; /* 移除内边距 */
  // margin-top: -10px; /* 减少整个组件顶部间距 */
  box-sizing: border-box; /* 确保盒模型正确 */
  // margin-bottom: -10px; /* 减少整个组件顶部间距 */
  // border: 2px solid red; /* 添加红色边框用于调试 */
}

.chart-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%; /* 使用完整高度 */
  overflow: hidden; /* 防止内容溢出 */
  // border: 2px solid blue; /* 添加蓝色边框用于调试 */
}

.chart-controls {
  margin-bottom: 4px; /* 进一步减少底部间距 */
  // margin-top: -8px; /* 减少顶部间距 */
  display: flex;
  justify-content: center; /* 整体居中对齐 */
  align-items: center;
  position: relative; /* 为绝对定位的按钮提供参考点 */
  padding: 2px 0; /* 移除上下内边距 */
  flex-shrink: 0; /* 不允许压缩 */
  // border: 1px solid green; /* 添加绿色边框用于调试 */
}

/* 刷新按钮样式 */
.refresh-btn {
  position: absolute; /* 绝对定位 */
  left: 0; /* 靠左边 */
  border-radius: 8px;
  font-weight: 600;
  font-size: 32px; /* 放大字体到32px */
  padding: 12px 20px; /* 调整内边距适应大字体 */
  height: auto; /* 自适应高度 */
  min-height: 48px; /* 最小高度 */
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
}

/* 自定义选择框样式 */
.custom-select {
  width: 280px !important; /* 拉长标题框宽度 */
  font-weight: bold !important; /* 加粗 */
  
  /* 更通用的选择器 */
  :deep(input) {
    font-size: 26px !important; /* 放大字体大小一倍 */
    font-weight: bold !important;
    line-height: 38px !important; /* 相应减少行高 */
    text-align: center !important; /* 左右居中 */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    vertical-align: middle !important; /* 垂直居中 */
    overflow: hidden !important; /* 隐藏超出文本 */
    text-overflow: ellipsis !important; /* 文本溢出显示省略号 */
    white-space: nowrap !important; /* 防止文本换行 */
  }
  
  :deep(.el-input__wrapper) {
    border-radius: 12px; /* 圆角边框 */
    border: 2px solid var(--el-border-color-light);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    background: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-fill-color-lighter) 100%);
    padding: 0 12px; /* 减少左右内边距适应更小宽度 */
    min-height: 38px !important; /* 减少高度避免换行 */
    height: 38px !important; /* 设置固定高度确保一致性 */
    display: flex !important; /* 使用flex布局 */
    align-items: center !important; /* 垂直居中 */
    justify-content: center !important; /* 水平居中 */
    overflow: hidden; /* 隐藏超出文本 */
    white-space: nowrap; /* 防止文本换行 */
    
    &:hover {
      border-color: var(--el-color-primary-light-3);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      transform: translateY(-1px);
    }
    
    &.is-focus {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.1);
    }
  }
  
  /* 移除之前可能不存在的选择器，使用更通用的方法 */
  :deep(.el-select__tags) {
    // font-size: 24px !important;
    font-weight: bold !important;
  }
  
  /* 选中文本的样式 */
  :deep(.el-select__selected-item) {
    font-size: 32px !important;
    font-weight: bold !important;
    line-height: 1.4 !important; /* 使用合理的行高而不是固定像素值 */
  }
  
  /* 占位符样式 */
  :deep(.el-select__placeholder) {
    // font-size: 24px !important;
    font-weight: bold !important;
  }
  
  :deep(.el-input__suffix) {
    .el-input__suffix-inner {
      .el-select__caret {
        font-size: 32px;
        color: var(--el-color-primary);
        transition: transform 0.3s ease;
      }
    }
  }
  
  :deep(.el-input__wrapper.is-focus .el-select__caret) {
    transform: rotate(180deg);
  }
}

/* 自定义下拉选项样式 */
.custom-option {
  :deep(.el-select-dropdown__item) {
    padding: 12px 16px;
    font-size: 30px;
    font-weight: 500;
    border-radius: 8px;
    margin: 2px 8px;
    transition: all 0.2s ease;
    
    &:hover {
      background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
      color: var(--el-color-primary);
      transform: translateX(4px);
    }
    
    &.selected {
      background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
      color: white;
      font-weight: 600;
    }
  }
}

.charts-item {
  width: 100%;
  height: 370px !important; /* 固定图表高度 */
  min-height: 370px !important; /* 确保最小高度一致 */
  max-height: 370px !important; /* 确保最大高度一致 */
  overflow: hidden; /* 防止内容溢出 */
  margin-top: -2px; /* 负边距拉近图表与控制器间距 */
  // border: 1px solid orange; /* 添加橙色边框用于调试 */
//   border: 1px solid var(--el-border-color-lighter);
//   border-radius: 6px;
//   background-color: var(--el-fill-color-blank);
}

@media screen and (max-width: 1200px) {
  .charts-container {
    grid-template-columns: 1fr; /* 平板端改为单列 */
    gap: 10px; /* 减少间距 */
    margin-top: -10px; /* 减少整个组件顶部间距 */
  }
  
  .charts-item {
    height: 380px !important; /* 平板端固定高度 */
    min-height: 380px !important; /* 确保最小高度一致 */
    max-height: 380px !important; /* 确保最大高度一致 */
  }
  
  .custom-select {
    width: 300px !important; /* 平板端适当增加宽度 */
  }
}

@media screen and (max-width: 600px) {
  .chart-controls {
    margin-bottom: 4px; /* 小屏幕上进一步减少间距 */
    margin-top: -8px; /* 减少顶部间距 */
    padding: 0; /* 移除内边距 */
    flex-direction: column; /* 移动端改为垂直布局 */
    gap: 8px; /* 垂直间距 */
    position: static; /* 移动端取消相对定位 */
  }
  
  .refresh-btn {
    position: static; /* 移动端取消绝对定位 */
    min-width: 80px; /* 设置最小宽度 */
    font-size: 28px; /* 放大字体一倍 */
    align-self: flex-start; /* 左对齐 */
  }
  
  .custom-select {
    width: 100% !important;
    max-width: 320px; /* 增加手机端最大宽度 */
    font-size: 32px !important; /* 放大字体一倍 */
    
    :deep(.el-input__wrapper) {
      min-height: 40px !important; /* 减少手机端高度 */
      height: 40px !important; /* 设置固定高度确保一致性 */
      padding: 0 12px; /* 减少内边距 */
    }
    
    :deep(input) {
      font-size: 32px !important; /* 放大字体一倍 */
      font-weight: bold !important; /* 手机端也设置为粗体 */
      line-height: 1.4 !important; /* 使用合理的行高 */
    }
  }
  
  .charts-item {
    height: 320px !important; /* 手机端固定高度 */
    min-height: 320px !important; /* 确保最小高度一致 */
    max-height: 320px !important; /* 确保最大高度一致 */
  }
}
</style>
