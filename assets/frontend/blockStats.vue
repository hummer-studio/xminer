<style lang="scss" scoped>
</style>

<template>
  <Content class="layout-content">
    <Row :gutter=10>
      <Col span="3">
        <Card class='x-card'>
          <p slot="title">Height</p>
          <p>{{ height }}</p>
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
      difficulty: "difficulty"
    })
  },

  methods: {      
  },

  mounted () {      
  }
}
</script>
