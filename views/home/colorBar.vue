<template>
  <div class="color-bar">
    <div v-for="(item, index) in colorItems" :key="index" class="color-item">
      <div class="color-box" :style="{ backgroundColor: item.color }"></div>
      <span class="color-text">{{ item.text }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { COLOR_ITEMS } from '@/utils/chartColors'
defineOptions({
  name: 'ColorBar'
})

const colorItems = ref(COLOR_ITEMS)
</script>

<style lang="scss" scoped>
.color-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 20px;
  height: 40px;
}

.color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.color-box {
  width: 80px;
  height: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
}

.color-text {
  font-size: 32px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  text-align: center;
}

@media screen and (max-width: 600px) {
  .color-bar {
    flex-wrap: wrap;
    height: auto;
    gap: 15px;
  }
  
  .color-item {
    flex-basis: calc(50% - 15px);
  }
}
</style>
