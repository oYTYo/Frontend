<template>
  <div class="header-view">
    <div class="header-top">
      <div class="header-left">
        <div class="nav-view">
          <ToggleMenu class="collapse-icon" />
          <NavTabs v-if="systemStore.layout.heightShrink && !systemStore.layout.widthShrink" key="nav-tabs" />
          <Breadcrumb v-if="!systemStore.layout.widthShrink" class="breadcrumb" />
        </div>
      </div>
      <el-link v-if="!systemStore.layout.widthShrink && isDev" style="margin-right: 10px" @click="cp">
        {{ route.meta.component }}
      </el-link>
      <Action class="action" />
    </div>
    <NavTabs v-if="!systemStore.layout.heightShrink" key="nav-tabs" />
  </div>
</template>
<script setup lang="ts">
import Action from '@/layout/Action/index.vue'
import NavTabs from './NavTabs/index.vue'
import Breadcrumb from './Breadcrumb.vue'
import { useSystemStore } from '@/stores/system'
import { useRoute } from 'vue-router'
import { useClipboard, usePermission } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import ToggleMenu from '@/layout/ToggleMenu.vue'

defineOptions({
  name: 'DefaultHeader'
})
const { copy } = useClipboard()
usePermission('clipboard-write')

function cp() {
  copy(route.meta.component as string).then(() => {
    console.info('恭喜你！你发现了这个贴心的小功能~👻🏀🐔')
    ElMessage({
      type: 'success',
      message: '已复制到剪切板'
    })
  })
}

const isDev = import.meta.env.DEV
const systemStore = useSystemStore()
const route = useRoute()
</script>
<style scoped lang="scss">
.header-view {
  .header-top {
    padding: 5px 10px;
    display: flex;
    align-items: center;

    .collapse-icon {
      margin-right: 15px;
      cursor: pointer;
      z-index: 2;
    }

    .header-left {
      flex-grow: 1;
      width: 0;

      .nav-view {
        display: inline-flex;
        align-items: center;
      }
    }

    .action {
      flex-shrink: 0;
      box-shadow: none;
      font-size: 30px;
      :deep(.el-icon) {
        font-size: 30px; // 控制 Element Plus 图标大小
        width: 30px;     // 可选，宽高也改大
        height: 30px;
      }
    }
  }

  :deep(.breadcrumb) {
    font-size: 50px; // 想要的字体大小
    // font-weight: bold; // 可选
    margin-bottom: 20px; // 可选，左边距也改大
    margin-top: 10px;
  }

  :deep(.el-link) {
    font-size: 10%; // 改成你想要的大小
    font-weight: bold; // 可选
  }

  .nav-tabs {
    margin-top: 5px;
    width: 100%;
  }
}
</style>
