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

.market{  
  margin-top: 30px;
    
  .coinmarketcap-currency-widget{
    margin: 0 auto;
    width: 400px;
  }
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
          <gh-btns-star slug="hummer-studio/xminer" show-count style="margin-top: 10px"></gh-btns-star>
        </div>
        
      </Menu>
    </Header>

    <BaseStats />
    <BlockStats />
    <PoolStats />
    
    <div class="market">
      <div class="coinmarketcap-currency-widget" data-currencyid="573" data-base="BTC" data-secondary="USD" data-ticker="true" data-rank="true" data-marketcap="true" data-volume="true" data-stats="USD" data-statsticker="false"></div>
    </div>    

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
