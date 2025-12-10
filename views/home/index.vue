<template>
  <div class="home-view">
    <statistic class="statistic-view" />
    <charts class="charts-view"/>
    <ops-bar class="blank-component" />
    <todo-list class="todo-list-view" />
  </div>
</template>
<script lang="ts" setup>
// import TopPanel from './topPanel.vue'
import Statistic from './statistic.vue'
import Charts from './charts.vue'
// import ColorBar from './colorBar.vue'
import OpsBar from './opsBar.vue'
import TodoList from './todoList.vue'
defineOptions({
  name: 'MHome'
})
</script>
<style lang="scss" scoped>
.home-view {
  min-height: var(--main-height);
  border-radius: 5px;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-content: start;

  > div,
  :deep(> div) {
    background-color: var(--el-bg-color);
    border-radius: 10px;
    padding: 20px;
  }

  // .desc-view,
  .statistic-view {
    grid-column: 1 / 5;
  }

  .color-bar-view {
    grid-column: 1 / 4; /* 占据前3列，与 charts 对齐 */
    grid-row: 2; /* 明确指定行位置 */
    margin-bottom: -10px; /* 减少与下方charts的间距 */
  }

  .charts-view {
    grid-column: 1 / 4; /* 占据前3列 */
    grid-row: 2; /* 明确指定行位置 */
    margin-top: 0px; /* 减少与上方colorBar的间距 */
  }

  .blank-component {
    /* 移除了固定的 height: 680px，使其高度自适应对齐 */
    grid-column: 4 / 5;
    /* 将 grid-row 从 2 / 5 改为 2，确保与 charts-view 在同一行 */
    grid-row: 2;
    /* 确保这里没有写死 height，且设置了拉伸 */
    height: auto; 
    align-self: stretch; /* [关键] 让组件高度自动拉伸以填满网格单元 */
    padding: 0 !important; /* [建议] 移除父级内边距，让子组件自己控制，防止双重padding导致溢出或留白 */
  }

  .statistic-view {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

    .todo-list-view {
      grid-column: 1 / 5;
      width: 100%;
      margin-top: 10px;
    }

}

@media screen and (max-width: 1200px) {
  .home-view {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    .statistic-view {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-column: 1 / 3;
    }

    .color-bar-view {
      grid-column: 1 / 3; /* 平板端占据两列 */
      grid-row: 2;
      margin-bottom: -15px; /* 减少与下方charts的间距 */
    }

    .charts-view {
      grid-column: 1 / 3; /* 平板端占据两列 */
      grid-row: 3;
      margin-top: -15px; /* 减少与上方colorBar的间距 */
      padding-top: 10px !important; /* 减少组件内部上边距 */
    }

    .blank-component {
      grid-column: 1 / 3; /* 在平板端横跨两列 */
      grid-row: 4;
      height: auto; /* 在小屏幕上自适应高度 */
    }
  }
}

@media screen and (max-width: 600px) {
  .home-view {
    grid-template-columns: minmax(0, 1fr);

    .statistic-view {
      grid-template-columns: minmax(0, 1fr);
      grid-column: 1;
    }

    .color-bar-view {
      grid-column: 1;
      margin-bottom: -15px; /* 减少与下方charts的间距 */
    }

    .charts-view {
      grid-column: 1;
      margin-top: -15px; /* 减少与上方colorBar的间距 */
      padding-top: 10px !important; /* 减少组件内部上边距 */
      margin-bottom:-15px;
    }

    .blank-component {
      grid-column: 1;
      height: auto;
    }
  }
}
</style>