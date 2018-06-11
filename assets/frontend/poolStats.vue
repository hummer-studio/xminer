<style lang="scss" scoped>
</style>

<style lang="scss">

</style>

<template>  
  <Content class="layout-content">
    <h2>Pool Stats</h2>
    
    <Row :gutter=10>
      <Col span="3">
        <Card class="x-card">
          <p slot="title">Height</p>
          <p>{{ height }}</p>
        </Card>
      </Col>
      <Col span="3">
        <Card class="x-card">
          <p slot="title">Best Deadline</p>
          <p>{{ deadline }}</p>
        </Card>
      </Col>
      <Col span="6">
        <Card class="x-card">
          <p slot="title">Best Miner</p>
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
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {    
  data () {      
    return  {}
  },

  computed: {
    ...mapGetters('Pool', {
      height: "height",
      deadline: "deadline",
      miner: "miner",
      accountId: "accountId",
    }),
  },

  methods: {      
    
  },

  mounted () {    
  }
}
</script>
