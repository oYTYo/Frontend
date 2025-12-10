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
      <div class="header-center-title">视联网智能QoE管理系统</div>
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
    position: relative;

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
    font-size: 0%; // 改成你想要的大小
    font-weight: bold; // 可选
  }

  .nav-tabs {
    margin-top: 5px;
    width: 100%;
  }

  .header-center-title {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%); /* 绝对居中 */
      z-index: 10;
      pointer-events: none; /* 防止遮挡鼠标点击 */

      /* 字体设置 */
      font-size: 56px; /* 大字体 */
      font-weight: 900; /* 特粗字体 */
      font-family: "PingFang SC", "Microsoft YaHei", sans-serif; /* 基础字体 */
      // font-style: italic; /* 倾斜，增加动感 */
      letter-spacing: 4px; /* 增加字间距 */
      
      /* 核心：渐变色文字效果 */
      background: linear-gradient(120deg, #666666 0%, #999999 100%); /* 亮青到深蓝的渐变 */
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      
      /* 投影效果：增加立体感 */
      filter: drop-shadow(0 4px 6px rgba(41, 121, 255, 0.3));

      /* 可选：添加一个底部倒影或者是重影效果 */
      &::after {
        content: attr(data-text); /* 复制文字内容 */
        position: absolute;
        left: 0;
        top: 0;
        z-index: -1;
        opacity: 0.1;
        transform: translate(4px, 4px); /* 偏移一点 */
        background: none;
        -webkit-text-fill-color: #000; /* 阴影颜色 */
        filter: blur(2px); /* 模糊处理 */
      }
    }


}
</style>
