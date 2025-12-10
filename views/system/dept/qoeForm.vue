<template>
  <div class="form-view">
    <el-scrollbar class="m-form-scroll">
      <m-form
        ref="formRef"
        :colspan="12"
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
        
        icon="check"
        type="primary"
        :loading="saveLoading"
        @click="save"
      >
        {{ $t('common.save') }}
      </el-button>
    </div>
    <el-dialog
      :title="$t('system.qoe.selectParent')"
      v-model="visible"
      draggable
      append-to-body
      align-center
      width="80%"
    >
      <SelectQoe
        selection="single"
        style="height: calc(90vh - 80px)"
        @select="selectedParentQoe"
        @close="visible = false"
      />
    </el-dialog>
  </div>
</template>
<script setup lang="jsx">
import { ref, toRefs, watchEffect, computed } from 'vue'
import { getQoeById, postSaveQoe } from '@/api/system/qoe'
import SelectQoe from './selectQoe.vue'
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
    prop: 'ipcNumber',
    label: t('system.qoe.ipcNumber'),
    type: 'input',
    required: true,
    maxlength: 50,
    colspan: 12
  },
  {
    prop: 'streamId',
    label: t('system.qoe.streamId'),
    type: 'input',
    required: true,
    maxlength: 100,
    colspan: 12
  },
  {
    prop: 'ipAddress',
    label: t('system.qoe.ipAddress'),
    type: 'input',
    required: true,
    maxlength: 15,
    colspan: 12
  },
  {
    prop: 'deviceName',
    label: t('system.qoe.deviceName'),
    type: 'input',
    required: true,
    maxlength: 100,
    colspan: 12
  },
  {
    prop: 'accessProtocol',
    label: t('system.qoe.accessProtocol'),
    type: 'select',
    required: true,
    itemList: [
      { label: 'RTSP', value: 'RTSP' },
      { label: 'HTTP', value: 'HTTP' },
      { label: 'HTTPS', value: 'HTTPS' },
      { label: 'TCP', value: 'TCP' },
      { label: 'UDP', value: 'UDP' }
    ],
    colspan: 12
  },
  {
    prop: 'qoeEnabled',
    label: t('system.qoe.qoeEnabled'),
    type: 'select',
    required: true,
    itemList: [
      { label: 'True', value: true },
      { label: 'False', value: false }
    ],
    colspan: 12
  },
  {
    prop: 'clientAddress',
    label: t('system.qoe.clientAddress'),
    type: 'input',
    required: true,
    maxlength: 15,
    colspan: 12
  },
  {
    prop: 'transportProtocol',
    label: t('system.qoe.transportProtocol'),
    type: 'select',
    required: true,
    itemList: [
      { label: 'TCP', value: 'TCP' },
      { label: 'UDP', value: 'UDP' },
      { label: 'RTP', value: 'RTP' },
      { label: 'RTCP', value: 'RTCP' }
    ],
    colspan: 12
  },
  {
    prop: 'averageBitrate',
    label: t('system.qoe.averageBitrate'),
    type: 'input',
    required: true,
    maxlength: 20,
    colspan: 12
  },
  {
    prop: 'createTime',
    label: t('system.qoe.createTime'),
    type: 'datetime-picker',
    required: false,
    colspan: 12
  }
])

watchEffect(() => {
  if (modelValue.value?.id) {
    formLoading.value = true
    getQoeById(modelValue.value.id)
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

function selectedParentQoe(rows) {
  const row = rows[0]
  formData.value.parentId = row.id
  formData.value.parentName = row.deviceName
  visible.value = false
}

function save() {
  formRef.value.validate((valid) => {
    if (valid) {
      const { ipAddress,qoeEnabled } = formData.value
      console.log('Saving QoE with enabled status:', ipAddress,qoeEnabled)
      postSaveQoe({ ipAddress,qoeEnabled }, {
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
