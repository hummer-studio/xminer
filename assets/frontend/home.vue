<style lang="scss" scoped>
.layout{
  border: 1px solid #d7dde4;
  background: #f5f7f9;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
}
.layout-logo{
  color: #fff;
  float: left;
  font-size: 16px;
  font-weight: bold;
  position: relative;  
}
.layout-nav{
  width: 420px;
  margin: 0 auto;
  margin-right: 20px;
}
.layout-footer-center{
  text-align: center;
}
</style>

<template>
  <Layout>
    <Header style="position: 'fixed'; width: 100%">
      <Menu mode="horizontal" theme="dark" active-name="1">
        <div class="layout-logo">hmMiner</div>
        <!--
        <div class="layout-nav">
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
        </div>
        -->
      </Menu>
    </Header>

    <MineStats />
    <PoolStats :height="123" />

    <Footer class="layout-footer-center"></Footer>
  </Layout>
</template>

<script>
import MineStats from "./mineStats"
import PoolStats from "./poolStats"
import { deadline2Human } from "./utility"
import { mapGetters, mapActions } from 'vuex'

export default {
  components: {
    MineStats: MineStats,
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
    ...mapActions(['connectWS']),

    // haha(message){
    //   if (message.command == "poolSubscribe"){

    //   }else if (message.command == "poolInfo"){
    //     message.data.deadline
    //   }
    //   console.log(message)
    // }
  },
  mounted () {        
    this.connectWS()
  }
}
</script>
