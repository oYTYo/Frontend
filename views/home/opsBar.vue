<template>
  <div class="ops-bar">
    <div class="table-container">
      <h4 class="table-title">异常类型分析</h4>
      <table class="fault-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>异常类型</th>
            <th>持续时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in faultList" :key="index">
            <td>{{ index + 1 }}</td>
            <td>
              <span class="fault-type" :class="`fault-${index}`">
                {{ item.type }}
              </span>
            </td>
            <td class="duration">{{ item.duration }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getOpsBarData } from '@/api/system/home'

const totalFaults = ref(0)
const faultList = ref([])


let timer: number | undefined
const fetchData = async () => {
  const res = await getOpsBarData()
  totalFaults.value = res.data.totalFaults
  faultList.value = res.data.faultList
  console.log('OpsBar data fetched:', res.data)
}

onMounted(() => {
  fetchData()
  timer = window.setInterval(fetchData, 3000)
})

onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.ops-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 12px; // 大幅减少内边距以适应网格
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  gap: 8px; // 进一步减少间距
  overflow: hidden; // 防止内容溢出
  box-sizing: border-box; // 确保盒模型计算正确
  // border: 2px solid red; /* 添加红色边框用于调试 */
  // 故障总量方框样式
  .total-faults-box {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 24px; // 减少内边距
    border-radius: 12px; // 稍微减少圆角
    text-align: center;
    box-shadow: 0 6px 24px rgba(102, 126, 234, 0.3);
    position: relative;
    overflow: hidden;
    min-width: 160px; // 减少最小宽度
    flex-shrink: 0; // 不允许压缩
    margin-top: -15px;
    
    &::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transform: rotate(45deg);
      animation: shine 3s infinite;
    }
    
    .total-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      
      .total-label {
        font-size: 32px; // 放大字体大小
        opacity: 0.9;
        font-weight: 500;
      }
      
      .total-number {
        font-size: 40px; // 放大字体大小
        font-weight: bold;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      
      .total-unit {
        font-size: 32px; // 放大字体大小
        opacity: 0.8;
        font-weight: 500;
      }
    }
  }

  // 表格容器
  .table-container {
    width: 100%;
    height: 100%; // 占满整个背景块
    background: white;
    border-radius: 10px;
    padding: 12px; // 减少内边距
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    overflow: hidden; // 防止溢出
    display: flex;
    flex-direction: column;
    border: 2px solid rgb(0, 251, 255); /* 添加红色边框用于调试 */
    .table-title {
      margin: 0 0 12px 0; // 减少底部边距
      color: var(--el-text-color-primary);
      font-size: 32px; // 放大字体大小
      font-weight: 600;
      text-align: center;
      // border: 2px solid rgb(242, 0, 255); /* 添加红色边框用于调试 */
    }
  }

  // 故障统计表格
  .fault-table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    
    // border: 2px solid rgb(0, 255, 17); /* 添加红色边框用于调试 */

    th, td {
      padding: 12px 8px; // 大幅减少内边距
      border-bottom: 1px solid #f0f0f0;
    }

    th {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      color: var(--el-text-color-primary);
      font-weight: 600;
      font-size: 32px; // 放大字体大小
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    td {
      color: var(--el-text-color-regular);
      font-size: 32px; // 放大字体大小
      transition: all 0.3s ease;
    }   tr {
      transition: all 0.3s ease;
      
      &:hover {
        background-color: #f8f9ff;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      &:last-child td {
        border-bottom: none;
      }
    }
    
    // 故障类型样式
    .fault-type {
      display: inline-block;
      padding: 4px 12px; // 减少内边距
      border-radius: 16px;
      font-weight: 600;
      font-size: 32px; // 放大字体大小
      
      &.fault-0 {
        background: linear-gradient(135deg, #ff4757, #ff3838);
        color: white;
      }
      
      &.fault-1 {
        background: linear-gradient(135deg, #ff5b71, #ff4848);
        color: white;
      }
      
      &.fault-2 {
        background: linear-gradient(135deg, #ff7a7b, #ff6060);
        color: white;
      }
      
      &.fault-3 {
        background: linear-gradient(135deg, #ff98a8, #ff8080);
        color: white;
      }
      
      &.fault-4 {
        background: linear-gradient(135deg, #ffa8a8, #ff9999);
        color: white;
      }
    }
    
    // 频次样式
    .frequency {
      font-weight: 600;
      font-size: 32px; // 放大字体大小
      color: var(--el-color-primary);
    }
    
    // 占比样式
    .percentage {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      
      .percentage-text {
        font-weight: 600;
        font-size: 32px; // 放大字体大小
        color: var(--el-text-color-primary);
      }
      
      .percentage-bar {
        width: 60px; // 减少宽度
        height: 6px;
        background-color: #f0f0f0;
        border-radius: 3px;
        overflow: hidden;
        
        .percentage-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.6s ease;
          
          &.bar-0 {
            background: linear-gradient(90deg, #ff4757, #ff3838);
          }
          
          &.bar-1 {
            background: linear-gradient(90deg, #ff5b71, #ff4848);
          }
          
          &.bar-2 {
            background: linear-gradient(90deg, #ff7a7b, #ff6060);
          }
          
          &.bar-3 {
            background: linear-gradient(90deg, #ff98a8, #ff8080);
          }
          &.bar-4 {
            background: linear-gradient(90deg, #ffa8a8, #ff9999);
          }
        }
      }
    }
  }
}

// 动画效果
@keyframes shine {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .ops-bar {
    padding: 8px; // 移动端进一步减少内边距
    gap: 6px; // 移动端更小的间距
    
    .total-faults-box {
      padding: 10px 20px; // 减少内边距
      min-width: 140px;
      
      .total-number {
        font-size: 32px; // 放大字体大小
      }
      
      .total-label, .total-unit {
        font-size: 32px; // 放大字体大小
      }
    }
    
    .table-container {
      padding: 10px; // 减少内边距
    }
    
    .fault-table {
      th, td {
        padding: 8px 6px; // 进一步减少内边距
        font-size: 32px; // 放大字体大小
      }
      
      .percentage-bar {
        width: 40px; // 减少宽度
        height: 4px;
      }
      
      .fault-type {
        padding: 3px 8px; // 减少内边距
        font-size: 32px; // 放大字体大小
      }
    }
  }
}
</style>