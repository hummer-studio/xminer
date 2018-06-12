<style lang="scss" scoped>
</style>

<template>
  <Content class="layout-content">
    <h2>Current Block Mine Stats</h2>

    <Row :gutter=10>
      <Col span="3">
        <Card class='x-card'>
          <p slot="title">Height</p>
          <p>{{ height }}</p>
        </Card>
      </Col>
      <Col span="3">
        <Card class='x-card'>
          <p slot="title">Scoop</p>
          <p>{{ scoop }}</p>
        </Card>
      </Col>          
      <Col span="3">
        <Card class='x-card'>
          <p slot="title">Base Target</p>
          <p>{{ baseTarget }}</p>
        </Card>
      </Col>      
      <Col span="3">
        <Card class='x-card'>
          <p slot="title">Target Deadline</p>
          <p>{{ targetDeadline }}</p>
        </Card>
      </Col>   

      <Col span="3">
        <Card class='x-card'>
          <p slot="title">Difficulty</p>
          <p>{{ difficulty }}</p>
        </Card>
      </Col>   

      <Col span="3">
        <i-circle :percent="80" :size="90" style="margin: 5px 10px">
          <span class="demo-Circle-inner" style="font-size: 24px">80%</span>
        </i-circle>
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
    ...mapGetters("Block", {
      height: "height",
      baseTarget: "baseTarget",
      targetDeadline: "targetDeadline",
      difficulty: "difficulty",
      scoop: "scoop",
    })
  },

  methods: {      
  },

  mounted () {      
  }
}
</script>
