<style lang="scss" scoped>
</style>

<style lang="scss">

</style>

<template>  
  <div>
    <Content class="layout-content">
    <h2>Pool Stats</h2>
    
    <Row :gutter=10>
      <Col span="3">
        <Card class="x-card">
          <p slot="title" title="Height">Height</p>
          <p>{{ height }}</p>
        </Card>
      </Col>
      <Col span="3">
        <Card class="x-card">
          <p slot="title" title="Mine Deadline">Mine Deadline</p>
          <p>{{ currentDeadline }}</p>
        </Card>
      </Col>      
      <Col span="3">
        <Card class="x-card">
          <p slot="title" title="Best Deadline">Best Deadline</p>
          <p>{{ deadline }}</p>
        </Card>
      </Col>
      <Col span="6">
        <Card class="x-card">
          <p slot="title" title="Best Miner">Best Miner</p>
          <div v-if="accountId">
            <a :href="`https://explore.burst.cryptoguru.org/address/${this.accountId}`" target="_blank">{{ miner }}</a>
          </div>
          <div v-else>
            <p>{{ miner }}</p>
          </div>          
        </Card>
      </Col>      
    </Row>   
  </Content>  

  <Content class="layout-content" v-if="address">
    <h2>Account Stats</h2>

    <Row :gutter=10>
      <Col span="5">
        <Card class="x-card">
          <p slot="title" title="Address">Address</p>
          <a :href="`https://explore.burst.cryptoguru.org/address/${this.address}`" target="_blank">{{ address }}</a>
        </Card>
      </Col>
      <Col span="3">
        <Card class="x-card">
          <p slot="title" title="Effective Capacity">Effective Capacity</p>
          <p>{{ effectiveCapacity }} TB</p>          
        </Card>
      </Col> 
      <Col span="3">
        <Card class="x-card">
          <p slot="title" title="Historical Share">Historical Share</p>
          <p>{{ historicalShare }}%</p>          
        </Card>
      </Col>      
      <Col span="3">
        <Card class="x-card">
          <p slot="title" title="Last Active Blockheight">Last Active Blockheight</p>
          <p>{{ lastActiveBlockHeight }}</p>          
        </Card>
      </Col>      
      <Col span="3">
        <Card class="x-card">
          <p slot="title" title="Valid Deadlines Last 360 Blocks">Valid Deadlines Last 360 Blocks</p>
          <p>{{ nConf }}</p>          
        </Card>
      </Col>      
      <Col span="3">
        <Card class="x-card">
          <p slot="title" title="Pending">Pending</p>
          <p>{{ pending }} Burst</p>          
        </Card>
      </Col>      
    </Row>
  </Content>
  </div>  
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {    
  data () {      
    return  {}
  },

  computed: {
    ...mapState('Pool', [
      "accountId", "address", "nConf", "lastActiveBlockHeight",
    ]),
    ...mapGetters('Pool', {
      height: "height",
      deadline: "deadline",
      currentDeadline: "currentDeadline",
      miner: "miner",      

      effectiveCapacity: "effectiveCapacity",
      historicalShare: "historicalShare",      
      pending: "pending",
    }),
  },

  methods: {      
    
  },

  mounted () {    
  }
}
</script>
