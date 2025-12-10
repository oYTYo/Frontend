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
  { type: 'index', width: 60 },
  { prop: 'ipcNumber', label: t('system.qoe.ipcNumber'), width: 200 },
  { prop: 'deviceName', label: t('system.qoe.deviceName') },
  {
    prop: 'online',
    label: '在线状态',
    width: 100,
    formatter: (row) => row.online ? '在线' : '离线',
    align: 'center'
  },
  { prop: 'accessProtocol', label: t('system.qoe.accessProtocol'), width: 150 },
  { prop: 'clientAddress', label: t('system.qoe.clientAddress'), width: 140 },
  { prop: 'streamId', label: t('system.qoe.streamId') },
  { prop: 'qoeEnabled', label: t('system.qoe.qoeEnabled'), type: 'select', itemList: booleanOptions, width: 100 },
  { prop: 'transportProtocol', label: t('system.qoe.transportProtocol'), width: 100 },
  // { prop: 'averageBitrate', label: t('system.qoe.averageBitrate'), width: 120 },
  { prop: 'createTime', label: t('system.qoe.createTime'), type: 'datetime', width: 155 },
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
    ]
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
