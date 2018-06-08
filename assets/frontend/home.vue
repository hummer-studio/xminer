<style lang="scss" scoped>
</style>

<template>
  <div>
    <MineStats />
    <PoolStats />
  </div>  
</template>

<script>
import MineStats from "./mineStats"
import PoolStats from "./poolStats"

export default {
  components: {
    MineStats: MineStats,
    PoolStats: PoolStats
  },

  data () {      
    return  {}
  },
  methods: {      
  },
  mounted () {      
  }
}
</script>
