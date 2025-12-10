<template>
  <div class="form-view">
    <el-scrollbar class="m-form-scroll">
      <m-form
        ref="formRef"
        :colspan="24"
        :columns="columns"
        :model="formData"
        :handleType="handleType"
        :loading="formLoading"
      />
    </el-scrollbar>
    <div class="m-footer">
      <el-button icon="close" @click="close()">{{ $t('common.cancel') }}</el-button>
      <el-button
        v-if="['add', 'edit'].includes(handleType)"
        v-auth="['system:dept:add', 'system:dept:edit']"
        icon="check"
        type="primary"
        :loading="saveLoading"
        @click="save"
      >
        {{ $t('common.save') }}
      </el-button>
    </div>
    <el-dialog
      :title="$t('system.dept.selectParent')"
      v-model="visible"
      draggable
      append-to-body
      align-center
      width="80%"
    >
      <selectDept
        selection="single"
        style="height: calc(90vh - 80px)"
        @select="selectedParentDept"
        @close="visible = false"
      />
    </el-dialog>
  </div>
</template>
<script setup lang="jsx">
import { ref, toRefs, watchEffect, computed } from 'vue'
import { getDeptById, postSaveDept } from '@/api/system/dept'
import selectDept from './selectDept.vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  handleType: {
    type: String,
    default: 'add'
  },
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close'])

const { t } = useI18n()

const visible = ref(false)
const formRef = ref()
const formData = ref({})
const { handleType, modelValue } = toRefs(props)

const formLoading = ref(false)
const saveLoading = ref(false)

const columns = computed(() => [
  {
    prop: 'name',
    label: t('system.dept.name'),
    type: 'input',
    required: true,
    maxlength: 50
  },
  {
    prop: 'code',
    label: t('system.dept.code'),
    type: 'input',
    required: true,
    maxlength: 50
  },
  {
    prop: 'parentName',
    label: t('system.dept.parentName'),
    type: 'input',
    readonly: true,
    maxlength: 50,
    appendSlot: () => (
      <el-button
        icon="search"
        v-auth="'system:dept:query'"
        onClick={() => (visible.value = true)}
      />
    )
  },
  {
    prop: 'sort',
    label: t('common.sort'),
    type: 'input-number',
    min: 0,
    max: 999
  },
  {
    prop: 'enabled',
    label: t('common.isEnabled'),
    type: 'radio',
    itemList: [
      { label: t('common.yes'), value: true },
      { label: t('common.no'), value: false }
    ],
    defaultValue: true
  },
  {
    prop: 'remark',
    label: t('common.remark'),
    type: 'textarea',
    maxlength: 200
  }
])

watchEffect(() => {
  if (modelValue.value?.id) {
    formLoading.value = true
    getDeptById(modelValue.value.id)
      .then((res) => {
        formData.value = res.data
      })
      .finally(() => {
        formLoading.value = false
      })
  } else {
    formData.value = { ...modelValue.value }
  }
})

function selectedParentDept(rows) {
  const row = rows[0]
  formData.value.parentId = row.id
  formData.value.parentName = row.name
  visible.value = false
}

function save() {
  formRef.value.validate((valid) => {
    if (valid) {
      postSaveDept(formData.value, {
        loadingRef: saveLoading,
        showSuccessMsg: true,
        successMsg: t('common.saveSuccess')
      }).then(() => {
        close('refresh')
      })
    }
  })
}

function close(type) {
  emit('close', type)
}
</script>
<style lang="scss" scoped>
.form-view {
  height: 100%;
  display: flex;
  flex-direction: column;

  .m-form-scroll {
    flex: 1;
    margin-bottom: 10px;
  }

  .m-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: 10px;
  }
}
</style>
