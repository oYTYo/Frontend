<template>
  <div class="h-100 flex-column">
    <div class="select-header">
      <el-input
        v-model="queryForm.keyword"
        :placeholder="$t('system.qoe.keyword')"
        clearable
        @keyup.enter="query"
      >
        <template #suffix>
          <el-button
            type="primary"
            icon="search"
            @click="query"
            style="border-radius: 0"
          />
        </template>
      </el-input>
    </div>
    <div class="select-content">
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="defaultProps"
        node-key="id"
        :default-expand-all="false"
        :show-checkbox="selection === 'multiple'"
        :check-strictly="false"
        @node-click="handleNodeClick"
        @check-change="handleCheckChange"
      >
        <template #default="{ data }">
          <div class="custom-tree-node">
            <span class="tree-node-label">{{ data.deviceName }}</span>
            <span class="tree-node-type">[{{ data.deviceType }}]</span>
          </div>
        </template>
      </el-tree>
    </div>
    <div class="select-footer">
      <el-button @click="close()">{{ $t('common.cancel') }}</el-button>
      <el-button
        type="primary"
        :disabled="!hasSelection"
        @click="confirm"
      >
        {{ $t('common.confirm') }}
      </el-button>
    </div>
  </div>
</template>
<script setup lang="jsx">
import { ref, toRefs, onMounted, computed } from 'vue'
import { queryQoeTree } from '@/api/system/qoe'

const props = defineProps({
  selection: {
    type: String,
    default: 'single' // single, multiple
  }
})

const emit = defineEmits(['select', 'close'])

const treeRef = ref()
const treeData = ref([])
const queryForm = ref({
  keyword: ''
})
const selectedNodes = ref([])
const currentNode = ref(null)

const { selection } = toRefs(props)

const defaultProps = {
  children: 'children',
  label: 'deviceName'
}

const hasSelection = computed(() => {
  return selection.value === 'multiple' ? selectedNodes.value.length > 0 : currentNode.value !== null
})

onMounted(() => {
  query()
})

function query() {
  queryQoeTree(queryForm.value).then((res) => {
    treeData.value = res.data
  })
}

function handleNodeClick(data) {
  if (selection.value === 'single') {
    currentNode.value = data
  }
}

function handleCheckChange() {
  if (selection.value === 'multiple') {
    selectedNodes.value = treeRef.value.getCheckedNodes()
  }
}

function confirm() {
  const result = selection.value === 'multiple' ? selectedNodes.value : [currentNode.value]
  emit('select', result)
}

function close() {
  emit('close')
}
</script>
<style lang="scss" scoped>
.select-header {
  margin-bottom: 10px;
}

.select-content {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 10px;
  
  .custom-tree-node {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .tree-node-label {
      font-weight: 500;
    }
    
    .tree-node-type {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

.select-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
