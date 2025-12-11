<template>
  <div class="monitor-root">
    <div class="content-wrapper">
      
      <div class="monitor-panel left-panel">
        <div class="panel-header">
          <h3 class="panel-title">QoE指标监控</h3>
          <el-button type="primary" size="default" :icon="Refresh" @click="refreshQoe" class="refresh-btn">刷新</el-button>
        </div>
        
        <div class="table-container">
          <el-table
            :data="qoeMetricsData"
            border
            stripe
            height="100%"
            style="width: 100%;"
            :resizable="false"
          >
            <el-table-column prop="name" label="指标名称" align="center" width="400">
              <template #header><span>📊 指标名称</span></template>
            </el-table-column>
            
            <el-table-column label="数值" align="center">
              <template #header><span>📈 数值</span></template>
              <template #default="scope">
                <span class="metric-value">{{ scope.row.value }}</span>
                <span class="metric-unit" v-if="scope.row.unit">{{ scope.row.unit }}</span>
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="250" align="center">
              <template #header><span>⚙️ 操作</span></template>
              <template #default="scope">
                <el-button type="primary" @click="handleView(scope.row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div class="monitor-panel right-panel">
        <div class="panel-header">
          <h3 class="panel-title">实体指标监控</h3>
          <div class="controls">
            <el-select v-model="entityType" class="custom-select" @change="handleTypeChange">
              <el-option label="网络" value="network" />
              <el-option label="容器" value="container" />
            </el-select>
            <el-select 
              v-model="currentEntityId" 
              class="custom-select" 
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
          </div>
        </div>

        <div class="table-container">
          <el-table
            :data="entityMetricsData"
            border
            stripe
            height="100%"
            style="width: 100%;"
            :resizable="false"
          >
            <el-table-column prop="label" label="指标名称" align="center" width="400">
              <template #header><span>📊 指标名称</span></template>
            </el-table-column>
            
            <el-table-column label="数值" align="center">
              <template #header><span>📈 数值</span></template>
              <template #default="scope">
                <span class="metric-value">{{ scope.row.value }}</span>
                <span class="metric-unit" v-if="scope.row.unit">{{ scope.row.unit }}</span>
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="250" align="center">
              <template #header><span>⚙️ 操作</span></template>
              <template #default="scope">
                <el-button type="primary" @click="handleView(scope.row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getQoeMetricsData } from '@/api/system/qoe'
import { 
  queryNetworkList, 
  queryContainerList, 
  queryNetworkMetricsbyNetwork, 
  queryContainerMetricsbyContainer 
} from '@/api/system/anomaly'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
// import { useI18n } from 'vue-i18n'

// const { t } = useI18n()

// ================= QoE 数据逻辑 (左侧) =================
const qoeMetricsData = ref([])

const refreshQoe = async () => {
  try {
    const res = await getQoeMetricsData()
    qoeMetricsData.value = Array.isArray(res.data) ? res.data : (res.data?.data || [])
    ElMessage.success('QoE指标已刷新')
  } catch (error) {
    console.error(error)
  }
}

// ================= 实体数据逻辑 (右侧) =================
const entityType = ref('network') // network | container
const entityList = ref<any[]>([])
const currentEntityId = ref('')
const currentEntityObj = ref<any>(null)
const entityMetricsData = ref<any[]>([])

// 字段定义
const containerMetricFields = [
  { prop: 'processes', label: '进程数', unit: '个' },
  { prop: 'cpuUsage', label: 'CPU使用率', unit: '%' },
  { prop: 'memory', label: '内存使用', unit: 'B' },
  { prop: 'writesBytes', label: '写入字节', unit: 'B' },
  { prop: 'readsBytes', label: '读取字节', unit: 'B' },
  { prop: 'receiveBytes', label: '接收字节', unit: 'B' },
  { prop: 'transmitBytes', label: '传输字节', unit: 'B' },
  { prop: 'receivePackets', label: '接收包数', unit: '个' },
  { prop: 'transmitPackets', label: '传输包数', unit: '个' }
]

const networkMetricFields = [
  { prop: 'jitter', label: '网络抖动', unit: 'ms' },
  { prop: 'throughout', label: '网络吞吐量', unit: 'Mbps' },
  { prop: 'packetLoss', label: '网络丢包率', unit: '%' },
  { prop: 'rtt', label: '网络延时', unit: 'ms' }
]

// 获取实体列表
const fetchEntityList = async () => {
  entityList.value = []
  currentEntityId.value = ''
  currentEntityObj.value = null
  
  // 【核心修改点】
  // 原代码是 entityMetricsData.value = []，这会导致切换时表格变空。
  // 改为调用 updateEntityMetricsTable(null)，它会根据当前的 entityType 立即生成对应的指标行（显示0.00）。
  updateEntityMetricsTable(null)

  try {
    const api = entityType.value === 'network' ? queryNetworkList : queryContainerList
    const res = await api({ currentPage: 1, pageSize: 100 }) // 获取前100个
    const list = res.data?.list || []
    entityList.value = list
    
    // 默认选中第一个
    if (list.length > 0) {
      const first = list[0]
      // 兼容 ID 或 Name 作为唯一标识
      currentEntityId.value = first.id || (entityType.value === 'network' ? first.networkName : first.containerName)
      handleEntityChange(currentEntityId.value)
    } 
    // 注意：如果 list 为空，上面 updateEntityMetricsTable(null) 已经确保了表格显示默认 0.00，不会白屏
  } catch (error) {
    console.error('获取实体列表失败', error)
    // 失败时也保持 0.00 状态，而不是空白
    updateEntityMetricsTable(null)
  }
}

// 切换类型
const handleTypeChange = () => {
  fetchEntityList()
}

// 切换实体
const handleEntityChange = (val) => {
  // 在 list 中找到完整对象
  const target = entityList.value.find(item => 
    (item.id === val) || 
    (entityType.value === 'network' ? item.networkName === val : item.containerName === val)
  )
  currentEntityObj.value = target
  if (target) {
    fetchEntityMetrics(target)
  }
}

// 获取具体实体的详细指标
const fetchEntityMetrics = async (entity) => {
  try {
    let dataObj = { ...entity }
    const api = entityType.value === 'network' ? queryNetworkMetricsbyNetwork : queryContainerMetricsbyContainer
    const params = entityType.value === 'network' 
      ? { streamIp: entity.networkName } 
      : { containerName: entity.containerName }
      
    const res = await api(params)
    
    if (res?.data?.list && Array.isArray(res.data.list) && res.data.list.length > 0) {
      dataObj = { ...dataObj, ...res.data.list[0] }
    } else if (res?.data?.list) {
      dataObj = { ...dataObj, ...res.data.list }
    }
    
    updateEntityMetricsTable(dataObj)
  } catch (e) {
    console.warn('获取详情失败，使用列表基础数据', e)
    updateEntityMetricsTable(entity)
  }
}

// 组装表格数据
const updateEntityMetricsTable = (dataObj) => {
  const fields = entityType.value === 'network' ? networkMetricFields : containerMetricFields
  const source = dataObj || {}
  
  entityMetricsData.value = fields.map(field => {
    const rawValue = source[field.prop]
    const displayValue = (rawValue === null || rawValue === undefined || rawValue === '') 
      ? '0.00' 
      : String(rawValue)
      
    return {
      label: field.label,
      prop: field.prop,
      value: displayValue,
      unit: field.unit || '' // 【修改】绑定单位字段
    }
  })
}

// 通用操作
const handleView = (row) => {
  ElMessage.success(`查看指标详情：${row.name || row.label}`)
}

// 初始化
onMounted(() => {
  refreshQoe()
  fetchEntityList()
})
</script>

<style lang="scss" scoped>
.monitor-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
  background-color: var(--layout-bg-color); /* 保持背景一致 */
}

/* 核心布局容器 */
.content-wrapper {
  display: flex;
  flex: 1;
  gap: 20px; /* 左右间距 */
  height: 100%;
  overflow: hidden;
}

/* 左右面板通用样式 */
.monitor-panel {
  flex: 1; /* 各占 50% */
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--el-border-color-extra-light);
  overflow: hidden;
  
  /* 定义大字体变量 (32px / 24px) */
  --metrics-font-size: 32px;
  --metrics-header-font-size: 32px;
  --metrics-unit-font-size: 32px;
  --controls-font-size: 24px;
}

/* 头部样式 */
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
    font-size: 40px; /* 标题大字体 */
    font-weight: 700;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    
    &::before {
      content: '📊';
      margin-right: 10px;
      font-size: 40px;
    }
  }

  .controls {
    display: flex;
    gap: 10px;
  }
}

/* 表格容器 */
.table-container {
  flex: 1;
  overflow: hidden;
  border-radius: 10px;
  background: #fff;
  
  /* 深度定制 Element Plus 表格 */
  :deep(.el-table) {
    font-size: var(--metrics-font-size);
    border: none;
    background: transparent;
    
    /* 表头 */
    th.el-table__cell {
      background: linear-gradient(135deg, #abb6eb 0%, #c7a4ea 100%) !important;
      height: 60px; /* 固定行高 */
      padding: 10px 0;
      color: #333 !important; /* 深色字体 */
      font-size: 36px !important;
      font-weight: 700;
      border-bottom: none;
      
      .cell {
        line-height: 1.2;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    /* 单元格 */
    td.el-table__cell {
      height: 120px; /* 数据行高 */
      padding: 10px 0;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      border-right: 1px solid rgba(0,0,0,0.1);
      
      .cell {
        font-size: 36px !important;
        line-height: normal;
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
      }
      
      /* 数值列特殊样式 */
      .metric-value {
        font-family: 'Consolas', 'Monaco', monospace;
        font-weight: 600;
        color: var(--el-color-primary);
        font-size: 36px;
      }
      .metric-unit {
        margin-left: 5px;
        font-size: 32px;
        color: #999;
      }
    }

    /* 悬停与斑马纹 */
    .el-table__row:hover > td {
      background-color: rgba(64, 158, 255, 0.08) !important;
    }
    .el-table__row--striped td {
      background: rgba(0,0,0,0.02);
    }
    
    /* 去除多余边框 */
    &.el-table--border {
      border: none;
      &::after { display: none; }
      th { border-right: 1px solid rgba(0,0,0,0.1); }
      td:last-child, th:last-child { border-right: none; }
    }
  }
}

/* ================== 控件与按钮样式 (24px) ================== */

/* 1. 刷新按钮 & 查看按钮 */
:deep(.el-button) {
  font-size: 32px !important;
  height: 46px !important;
  padding: 0 20px !important;
  border-radius: 8px;
  font-weight: 600;
  
  /* 蓝色渐变背景 */
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

/* 2. 下拉选择框 (Select) */
:deep(.custom-select) {
  width: 200px;
  
  .el-select__wrapper {
    height: 40px !important;
    min-height: 40px !important;
    font-size: 32px !important;
    padding: 4px 12px !important;
    border-radius: 8px;
    box-shadow: 0 0 0 1px var(--el-border-color) inset;
  }
  
  .el-select__selected-item {
    font-size: 32px !important;
    font-weight: 600;
    color: #333;
  }
  
  .el-select__placeholder {
    font-size: 32px !important;
    line-height: 40px !important;
  }
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .content-wrapper {
    flex-direction: column; /* 小屏幕上下排列 */
  }
  .monitor-panel {
    min-height: 500px;
  }
}
</style>