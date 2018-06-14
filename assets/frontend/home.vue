<style lang="scss" scoped>

.layout-logo{
  color: #fff;
  float: left;
  font-size: 26px;
  font-weight: bold;
  position: relative;  
}

.layout-nav{
  float: right;
  margin-top: 8px;
}

.layout-footer-center{
  text-align: center;
}
</style>

<template>
  <Layout>
    <Header style="position: 'fixed'; width: 100%">
      <Menu mode="horizontal" theme="dark" active-name="1">
        <div class="layout-logo">xMiner</div>
        
        <div class="layout-nav">
          <!--
          <MenuItem name="1">
            <Icon type="ios-navigate"></Icon>
            Item 1
          </MenuItem>
          <MenuItem name="2">
              <Icon type="ios-keypad"></Icon>
              Item 2
          </MenuItem>
          <MenuItem name="3">
              <Icon type="ios-analytics"></Icon>
              Item 3
          </MenuItem>
          <MenuItem name="4">
              <Icon type="ios-paper"></Icon>
              Item 4
          </MenuItem>
-->
          <a class="github-button" href="https://github.com/hummer-studio/xminer" data-icon="octicon-star" data-show-count="true" aria-label="Star hummer-studio/xminer on GitHub">Star</a>
        </div>
        
      </Menu>
    </Header>

    <BaseStats />
    <BlockStats />
    <PoolStats />

    <Footer class="layout-footer-center"></Footer>
  </Layout>
</template>

<script>
import BaseStats from "./baseStats"
import BlockStats from "./blockStats"
import PoolStats from "./poolStats"
import { mapGetters, mapActions } from 'vuex'

export default {
  components: {
    BaseStats: BaseStats,
    BlockStats: BlockStats,
    PoolStats: PoolStats
  },

  data () {      
    return  {}
  },

  computed: {
    ...mapGetters({
    })
  },

  methods: {
    ...mapActions('Pool', ['connectWS']),    
  },
  mounted () {        
    this.connectWS()
  }
}
</script>
