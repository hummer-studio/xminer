<style lang="scss" scoped>
</style>

<template>
  <Content class="layout-content">
    <Row :gutter=10>
      <Col span="3">
        <Card>
          <p slot="title">Height</p>
          <p>{{ height }}</p>
        </Card>
      </Col>
      <Col span="3">
        <Card>
          <p slot="title">Best Deadline</p>
          <p>{{ deadline }}</p>
        </Card>
      </Col>
      <Col span="6">
        <Card>
          <p slot="title">Best Miner</p>
          <p>{{ miner }}</p>
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
    ...mapGetters({
      height: "height",
      deadline: "deadline",
      miner: "miner",
    })
  },

  methods: {      
    
  },

  mounted () {    
  }
}
</script>
