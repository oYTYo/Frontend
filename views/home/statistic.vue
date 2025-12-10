<template>
  <div class="statistic-view">
    <div v-for="(statistic, i) in statisticArr" :key="i" :style="`background: ${statistic.color}`">
      <div>
        <el-icon size="25">
          <m-icon :value="statistic.icon" />
        </el-icon>
        <div>{{ $t(statistic.label) }}</div>
      </div>
      <div :ref="(countRef) => (statistic.ref.value = countRef)">{{ statistic.count }}</div>
    </div>
  </div>
</template>
<script lang="ts" setup>

import { useCountUp } from '@/utils'
import { ref, toRef, onMounted } from 'vue'
import { getDeviceStatusStats } from '@/api/system/home'

defineOptions({
  name: 'HomeStatistic'
})


const statisticArr: any[] = [
  {
    label: 'home.onlineDevices',
    icon: 'el|Monitor',
    color: 'linear-gradient(120deg, rgba(78,175,178,0.6), rgba(78,175,178,0.8))',
    count: ref(0)
  },
  {
    label: 'home.onlineCustomers',
    icon: 'el|User',
    color: 'linear-gradient(120deg, rgba(182,78,139,0.6), rgba(182,78,139,0.8))',
    count: ref(0)
  },
  {
    label: 'home.activeStreams',
    icon: 'el|VideoPlay',
    color: 'linear-gradient(120deg, rgba(215,131,105,0.6), rgba(215,131,105,0.8))',
    count: ref(0)
  },
  {
    label: 'home.systemHealthScore',
    icon: 'el|CircleCheck',
    color: 'linear-gradient(120deg, rgba(211,179,73,0.6), rgba(211,179,73,0.8))',
    count: ref(0),
    option: { suffix: '%' }
  }
]
statisticArr.forEach((i) => (i.ref = useCountUp(toRef(i.count), i.option)))

onMounted(async () => {
  const res = await getDeviceStatusStats()
  if (res && res.data) {
    // 根据后端返回结构赋值
    statisticArr[0].count.value = res.data.deviceStatus?.online ?? 0
    statisticArr[1].count.value = res.data.deviceStatus?.total ?? 0
    statisticArr[2].count.value = 1
    statisticArr[3].count.value = res.data.systemMonitor?.normal ?? 0
  }
})
</script>
<style lang="scss" scoped>
.statistic-view {
  display: grid;
  gap: 10px;

  > div {
    color: white;
    font-size: 32px;
    border-radius: 10px;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 56px;
    background: gray;

    > div:first-child {
      > :first-child {
        padding-bottom: 10px;
      }
    }

    > div:last-child {
      font-size: 1.25em;
      font-weight: bold;
    }
  }
}
</style>
