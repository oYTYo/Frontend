<template>
  <div class="qoe-list-container">
    <!-- <div class="list-header">
      <el-text style="white-space: nowrap">QoE设备列表</el-text>
      <el-link type="primary" style="margin-left: 10px; white-space: nowrap" @click="more('查看所有设备')">更多</el-link>
    </div> -->
    
    <div class="table-wrapper">
      <table class="device-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>IPC编号</th>
            <th>流ID</th>
            <th>在线状态</th>
            <th>设备名称</th>
            <th>接入协议</th>
            <th>QoE启用</th>
            <th>客户端地址</th>
            <th>传输协议</th>
            <th>平均码率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(device, index) in deviceList" :key="index" class="device-row">
            <td class="index-cell">{{ index + 1 }}</td>
            <td class="ipc-cell">{{ device.ipcNumber }}</td>
            <td class="stream-cell">{{ device.streamId }}</td>
            <td class="ip-cell">
              <span class="qoe-status" :class="device.online ? 'online' : 'offline'">
                {{ device.online ? '在线' : '离线' }}
              </span>
            </td>
            <td class="name-cell">
              <div class="name-content">
                <span class="device-name">{{ device.deviceName }}</span>
                <span class="status-badge" :class="device.status">{{ device.statusText }}</span>
              </div>
            </td>
            <td class="access-protocol-cell">{{ device.accessProtocol }}</td>
            <td class="qoe-cell">
              <span class="qoe-status" :class="{ enabled: device.qoeEnabled }">
                {{ device.qoeEnabled ? '已启用' : '未启用' }}
              </span>
            </td>
            <td class="client-cell">{{ device.clientAddress }}</td>
            <td class="transport-protocol-cell">{{ device.transportProtocol }}</td>
            <td class="bitrate-cell">{{ device.averageBitrate }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { queryQoeList } from '@/api/system/qoe'

const deviceList = ref([])

onMounted(() => {
  queryQoeList().then(res => {
    // 兼容 mock 或真实接口
    deviceList.value = res.data?.list || []
  })
})

// function more(msg) {
//   ElMessage({
//     message: msg,
//     type: 'success'
//   })
// }
</script>
<style lang="scss" scoped>
.qoe-list-container {
  height: 100%;
  width: 100%;
  /* 移除调试边框，改为与其他组件一致的样式 */
  background: white;
  border-radius: 10px; /* 与index.vue中其他组件保持一致 */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1); /* 添加阴影与其他组件保持一致 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 重要：重置padding以覆盖index.vue中的全局样式 */
  padding: 0 !important;
  /* 使用box-sizing确保宽度计算正确 */
  box-sizing: border-box;

  // .list-header {
  //   padding: 18px 20px; /* 增加内边距，与其他组件的20px保持一致 */
  //   border-bottom: 1px solid #f0f0f0;
  //   display: flex;
  //   justify-content: space-between;
  //   align-items: center;
  //   background: #fafafa;
  //   flex-shrink: 0;
    
  //   /* 增大标题字体 */
  //   :deep(.el-text) {
  //     font-size: 16px; /* 进一步增大标题字体 */
  //     font-weight: 700; /* 增加字体粗细 */
  //     color: #303133;
  //   }
    
  //   /* 增大更多链接字体 */
  //   :deep(.el-link) {
  //     font-size: 14px;
  //     font-weight: 600; /* 增加字体粗细 */
  //   }
  // }

  .table-wrapper {
    flex: 1;
    overflow: auto;
    padding: 20px; /* 现在由table-wrapper负责提供内边距 */

    .device-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 32px; /* 放大基础字体 */

      th {
        background: #f8f9fa;
        color: #606266;
        font-weight: 700; /* 增加表头字体粗细 */
        font-size: 32px; /* 放大表头字体 */
        padding: 14px 10px; /* 增加内边距 */
        border-bottom: 2px solid #e4e7ed; /* 增加边框粗细 */
        text-align: left;
        white-space: nowrap;
      }

      .device-row {
        transition: all 0.2s ease;
        
        &:hover {
          background-color: #f5f7fa;
        }

        td {
          padding: 14px 10px; /* 进一步增加内边距 */
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
          font-size: 32px; /* 放大单元格字体 */
        }

        .index-cell {
          text-align: center;
          color: #909399;
          font-weight: 600; /* 增加字体粗细 */
          width: 40px;
        }

        .ipc-cell {
          font-family: monospace;
          color: #409eff;
          font-weight: 600; /* 增加字体粗细 */
          min-width: 80px;
        }

        .stream-cell {
          font-family: monospace;
          color: #606266;
          min-width: 120px;
          font-size: 32px; /* 修改字体大小为32px */
          font-weight: 500; /* 增加字体粗细 */
        }

        .ip-cell {
          font-family: monospace;
          color: #606266;
          min-width: 100px;
          font-weight: 500; /* 增加字体粗细 */
        }
        .qoe-status.online {
          background: #e7f6e7;
          color: #67c23a;
        }
        .qoe-status.offline {
          background: #fef0f0;
          color: #f56c6c;
        }

        .name-cell {
          min-width: 120px;
          
          .name-content {
            display: flex;
            align-items: center;
            gap: 8px; /* 增加间距 */
            
            .device-name {
              font-weight: 600; /* 增加字体粗细 */
              color: #303133;
              font-size: 32px; /* 修改字体大小为32px */
            }
            
            .status-badge {
              padding: 2px 6px; /* 增加内边距 */
              border-radius: 4px;
              font-size: 11px; /* 增大字体 */
              font-weight: 600; /* 增加字体粗细 */

              &.online {
                background: #e7f6e7;
                color: #67c23a;
              }

              &.offline {
                background: #fef0f0;
                color: #f56c6c;
              }

              &.warning {
                background: #fdf6ec;
                color: #e6a23c;
              }
            }
          }
        }

        .access-protocol-cell {
          font-family: monospace;
          color: #606266;
          font-size: 32px; /* 修改字体大小为32px */
          min-width: 60px;
          font-weight: 500; /* 增加字体粗细 */
        }

        .qoe-cell {
          min-width: 70px;
          
          .qoe-status {
            padding: 3px 8px; /* 增加内边距 */
            border-radius: 4px;
            font-size: 32px; /* 修改字体大小为32px，与其他字段保持一致 */
            font-weight: 600; /* 增加字体粗细 */
            
            &.enabled {
              background: #e7f6e7;
              color: #67c23a;
            }
            
            &:not(.enabled) {
              background: #fef0f0;
              color: #f56c6c;
            }
          }
        }

        .client-cell {
          font-family: monospace;
          color: #606266;
          min-width: 100px;
          font-weight: 500; /* 增加字体粗细 */
        }

        .transport-protocol-cell {
          font-family: monospace;
          color: #606266;
          font-size: 32px; /* 修改字体大小为32px */
          min-width: 60px;
          font-weight: 500; /* 增加字体粗细 */
        }

        .bitrate-cell {
          font-family: monospace;
          color: #606266;
          min-width: 80px;
          font-weight: 500; /* 增加字体粗细 */
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .qoe-list-container {
    .table-wrapper {
      .device-table {
        font-size: 11px;
        
        th {
          padding: 6px 4px;
          font-size: 10px;
        }
        
        .device-row td {
          padding: 6px 4px;
        }
      }
    }
  }
}

@media (max-width: 600px) {
  .qoe-list-container {
    margin-top: -20px;

    .list-header {
      padding: 10px 12px;
    }

    .table-wrapper {
      padding: 6px;
      
      .device-table {
        .device-row {
          .name-cell .name-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }
        }
      }
    }
  }
}
</style>
