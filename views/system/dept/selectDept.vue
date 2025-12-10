<template>
  <div class="select-dept-view">
    <el-scrollbar class="left-tree-view">
      <div class="tree-filter-view">
        <el-input v-model="queryParam.name" :placeholder="$t('system.dept.name')" clearable />
        <el-button style="margin-left: 10px" icon="refresh" type="primary" @click="getDeptTree" />
      </div>
      <el-tree
        node-key="id"
        :expand-on-click-node="false"
        default-expand-all
        :data="deptData"
        :props="defaultProps"
        @node-click="handleNodeClick"
      />
    </el-scrollbar>
    <m-table
      class="m-table"
      ref="tableRef"
      :layout="systemStore.layout.widthShrink ? 'auto' : undefined"
      is-filter-table
      row-key="id"
      :filter-param="filterParam"
      :columns="columns"
      :fetch-data="queryDeptList"
      v-model:data="data"
      :selection="selection"
      @selection-change="(rows) => (selectRows = rows)"
    >
      <template #footer>
        <div class="footer-buttons">
          <el-button @click="close()">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="confirmSelect">{{ $t('common.confirm') }}</el-button>
        </div>
      </template>
    </m-table>
  </div>
</template>
<script setup lang="jsx">
import { computed, reactive, ref } from 'vue'
import { queryDeptList, queryDeptTree } from '@/api/system/dept'
import { useSystemStore } from '@/stores/system'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  selection: {
    type: String,
    default: 'multiple'
  }
})

const emit = defineEmits(['select', 'close'])

const { t } = useI18n()
const systemStore = useSystemStore()

// 解构 props 以便在模板中使用
const { selection } = props

const deptData = ref([])
const queryParam = ref({
  name: ''
})

const tableRef = ref()
const data = ref([])
const selectRows = ref([])
const filterParam = reactive({})

const defaultProps = {
  children: 'children',
  label: 'name'
}

const columns = computed(() => [
  { type: 'index', width: 90 },
  { prop: 'id', label: 'Id' },
  { prop: 'code', label: t('system.dept.code') },
  { prop: 'name', label: t('system.dept.name') },
  { prop: 'parentName', label: t('system.dept.parentName') },
  { prop: 'sort', label: t('common.sort') },
  { prop: 'enabled', label: t('common.isEnabled'), type: 'select', itemList: [
    { label: t('common.yes'), value: true },
    { label: t('common.no'), value: false }
  ]},
  { prop: 'createTime', label: t('common.createTime'), type: 'datetime', width: 155 }
])

getDeptTree()

function getDeptTree() {
  queryDeptTree(queryParam.value).then((res) => {
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
      return true
    })
    deptData.value = [{ id: 0, name: t('system.dept.all'), children: data }]
  })
}

function handleNodeClick(node) {
  filterParam.parentId = node.id
  filterParam.parentName = node.name
  if (node.id === 0) {
    filterParam.parentId = ''
    filterParam.parentName = ''
  }
  tableRef.value.fetchQuery()
}

function confirmSelect() {
  emit('select', selectRows.value)
}

function close() {
  emit('close')
}
</script>
<style lang="scss" scoped>
.select-dept-view {
  display: flex;
  align-items: stretch;
  gap: 10px;
  height: 100%;

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

  .footer-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
