<template>
  <div class="root">
    <!-- <el-scrollbar class="left-tree-view">
      <div class="tree-filter-view">
        <el-input v-model="qoeQueryParam.deviceName" :placeholder="$t('system.qoe.deviceName')" clearable />
        <el-button style="margin-left: 10px" icon="refresh" type="primary" @click="getQoeTree" />
      </div>
      <el-tree
        node-key="id"
        :expand-on-click-node="false"
        default-expand-all
        :data="qoeData"
        :props="defaultProps"
        @node-click="handleNodeClick"
      />
    </el-scrollbar> -->
    <m-table
      class="m-table"
      ref="tableRef"
      :layout="systemStore.layout.widthShrink ? 'auto' : undefined"
      is-filter-table
      is-complex-filter
      row-key="id"
      :filter-param="filterParam"
      :filter-columns="topFilterColumns"
      :columns="columns"
      :fetch-data="queryQoeList"
      v-model:data="data"
      selection="multiple"
      @selection-change="(rows) => (selectRows = rows)"
    >
      <template #right-action>
        <el-button type="primary" icon="plus" @click="openForm('add')"
          >{{ $t('common.add') }}
        </el-button>
        <el-button
          type="warning"
          icon="setting"
          :disabled="selectRows.length === 0"
          @click="batchConfig(selectRows)"
        >
          批量启用QoE
        </el-button>
        <el-button
          type="danger"
          icon="delete"
          :disabled="selectRows.length === 0"
          @click="del(selectRows)"
        >
          {{ $t('common.del') }}
        </el-button>
      </template>
    </m-table>
    <el-dialog
      :title="handleType === 'batchConfig' ? '批量配置' : (handleType && $t('system.qoe.' + handleType))"
      v-model="formVisible"
      align-center
      draggable
      destroy-on-close
      append-to-body
      :close-on-click-modal="false"
      width="800px"
    >
      <QoeForm :handle-type="handleType" :model-value="row" style="height: 60vh" @close="close" />
    </el-dialog>
  </div>
</template>
<script setup lang="jsx">
import { computed, reactive, ref } from 'vue'
import { delQoeByIds, queryQoeList, queryQoeTree } from '@/api/system/qoe'
import QoeForm from './qoeForm.vue'
// 直接使用 mock 的 boolean 选项数组
const booleanOptions = [
  { label: '是', value: true },
  { label: '否', value: false }
]
import { useSystemStore } from '@/stores/system'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElMessage } from 'element-plus'

const { t } = useI18n()
const systemStore = useSystemStore()
const qoeData = ref([])
const qoeQueryParam = ref({
  deviceName: ''
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
const selectRows = ref([])
const filterParam = reactive({})

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
  { prop: 'ipcNumber', label: t('system.qoe.ipcNumber'), width: 200 },
  { prop: 'deviceName', label: t('system.qoe.deviceName'), width: 180 },
  {
    prop: 'online',
    label: '在线状态',
    width: 180,
    formatter: (row) => row.online ? '在线' : '离线',
    align: 'center'
  },
  { prop: 'accessProtocol', label: t('system.qoe.accessProtocol'), width: 230 },
  { prop: 'clientAddress', label: t('system.qoe.clientAddress'), width: 250 },
  { prop: 'streamId', label: t('system.qoe.streamId'), width: 200 },
  { prop: 'qoeEnabled', label: t('system.qoe.qoeEnabled'), type: 'select', itemList: booleanOptions, width: 180 },
  { prop: 'transportProtocol', label: t('system.qoe.transportProtocol'), width: 200 },
  // { prop: 'averageBitrate', label: t('system.qoe.averageBitrate'), width: 120 },
  { prop: 'createTime', label: t('system.qoe.createTime'), type: 'datetime', width: 350 },
  {
    type: 'operation',
    fixed: 'right',
    align: 'center',
    buttons: [
      { label: t('common.edit'), icon: 'edit', onClick: (row) => openForm('edit', row) },
      {
        label: t('common.detail'),
        icon: 'document',
        onClick: (row) => openForm('detail', row)
      },
      {
        label: t('common.del'),
        icon: 'delete',
        type: 'danger',
        onClick: (row) => del([row])
      }
    ], width: 200
  }
])

const formVisible = ref(false)
const handleType = ref()
const row = ref()
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

function openForm(type, r) {
  row.value = r
  if (type === 'add') {
    row.value = {
      parentId: currentNode.value?.parentId,
      parentName: currentNode.value?.parentName
    }
  }
  formVisible.value = true
  handleType.value = type
}

function del(rows) {
  delQoeByIds(rows.map((i) => i.id).join(','), {
    showLoading: true,
    showBeforeConfirm: true,
    showSuccessMsg: true,
    confirmMsg: t('common.confirmDelete')
  }).then(() => {
    tableRef.value.fetchQuery()
  })
}

function batchConfig(rows) {
  // 批量配置QoE使能
  ElMessageBox.confirm(
    `确定要批量启用这 ${rows.length} 个设备的QoE功能吗？`,
    '批量启用QoE确认',
    {
      type: 'warning',
      confirmButtonText: '确认启用',
      cancelButtonText: '取消',
    }
  ).then(() => {
    // 调用批量启用QoE的API
    import('@/api/system/qoe').then(({ batchEnableQoe }) => {
      batchEnableQoe(rows.map(r => r.id)).then((res) => {
        console.log(res)
        if (res.success) {
          console.log('xxxx')
          ElMessage.success(res.message || `成功启用 ${rows.length} 个设备的QoE功能`)
          tableRef.value.fetchQuery()
        } else {
          console.log('YYY')
          ElMessage.error(res.message || '批量启用QoE失败')
        }
      }).catch(() => {
        ElMessage.error('批量启用QoE失败')
      })
    })
  }).catch(() => {
    // 用户取消操作
    console.log('用户取消了批量启用QoE操作')
  })
}

function close(type) {
  formVisible.value = false
  if (type === 'refresh') {
    tableRef.value.fetchQuery()
  }
}
</script>
<style lang="scss" scoped>
.root {
  display: flex;
  align-items: stretch;
  gap: 10px;

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

.m-table {
    width: 0;
    flex-grow: 1;

    /* === 表格部分 === */
    /* 调整表格行高 */
    :deep(.el-table__cell) {
      padding: 12px 0; 
    }
    /* 调整表格内字体行高，防止大号字体被裁剪 */
    :deep(.el-table .cell) {
      line-height: 1.5;
    }

    /* === 顶部搜索框部分 (本次修改) === */
    :deep(.top-filter) {

      
      /* 控制每个搜索条件项的右间距 */
      .el-form-item {
        margin-right: 15px;  /* 调小这个值，间隔变小 */
        margin-bottom: 10px;
      }

      /* 强制限制输入框宽度 */
      .el-input, .el-select {
        width: 160px; /* 调小这个值，输入框变窄，更省空间 */
      }

      /* 标签文字样式 */
      .el-form-item__label {
        font-size: 32px; /* 你的大号字体 */
        font-weight: bold;
        color: #333;
      }

      /* 输入框内部文字样式 */
      .el-input__inner {
        font-size: 24px;
      }

      /* 按钮样式 */
      .el-button {
        font-size: 24px;
      }
    }

    :deep(.operation-button) {
      .el-link {
        font-size: 24px; /* 这里设置为 24px */
      }
    }
    :deep(.total-view) {
      /* 修改文字“总数”、“已选中”的字体大小 */
      font-size: 24px; /* <--- 在这里修改字体大小 */
      color: #333;     /* 可选：修改文字颜色 */

      /* 修改具体数字（如 51, 0）的字体样式 */
      .total-text {
        font-size: 28px; /* <--- 在这里修改数字的大小 */
        font-weight: bold; /* 数字加粗 */
        color: var(--el-color-primary); /* 数字保持主题色，也可以改成其他颜色 */
      }
    }

    :deep(.el-form-item) {
      /* 1. 修改 Label (如：在线状态) */
      .el-form-item__label {
        font-size: 24px !important;
        line-height: 40px;
        height: 40px;
        display: flex;
        align-items: center;
      }

      /* 2. 修改普通输入框 (el-input) */
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
          font-size: 24px !important; /* 确保输入文字变大 */
        }
      }

      /* 3. 新增：专门修改下拉选择框 (el-select) */
      .el-select {
        /* 针对新版 Element Plus 的外框 */
        .el-select__wrapper {
          height: 40px !important;
          min-height: 40px !important;
          font-size: 24px !important;
          line-height: 40px !important;
          padding: 0 15px !important;
        }

        /* 针对旧版或兼容模式的内部输入框 */
        .el-input__wrapper {
          height: 40px !important;
        }
        .el-input__inner {
          height: 40px !important;
          font-size: 24px !important;
        }

        /* 修复：针对 "请选择" 占位符文字 */
        .el-select__placeholder {
          font-size: 24px !important;
          /* 强制绝对定位居中，防止掉下去 */
          position: absolute !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          left: 15px !important; /* 保持与左边框的距离 */
          
          line-height: normal !important; /* 重置行高，防止被撑开 */
          height: auto !important;
          margin: 0 !important;
          
          /* 确保文字颜色正常 */
          color: var(--el-text-color-placeholder);
          
          /* 针对某些版本的兼容性 */
          display: block !important;
          width: calc(100% - 30px); /* 防止文字太长溢出 */
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* 针对选中后的文字 */
        .el-select__selected-item {
          font-size: 24px !important;
          line-height: 40px !important;
          top: 0;
        }
      }
    }

    /* 针对右侧操作栏 (right-action) 的样式穿透 */
    :deep(.right-action) {
      .el-button {
        font-size: 24px !important;
        height: 45px !important; /* 调高按钮高度，避免文字被切 */
        padding: 0 20px !important; /* 增加左右内边距，更美观 */
        
        /* 调整图标大小，使其与文字协调 */
        .el-icon {
          font-size: 24px !important;
        }
      }
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
