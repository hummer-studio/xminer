<style lang="scss" scoped>
</style>

<template>
  <Content class="layout-content">
    <Row :gutter=10>
      <Col span="3">
        <Card class='x-card'>
          <p slot="title">Mined Blocks</p>
          <p>{{ mined }}</p>
        </Card>
      </Col>
      <Col span="4">
        <Card class='x-card'>
          <p slot="title">Confirmed Blocks</p>
          <p>{{ mined }}</p>
        </Card>
      </Col>      
      <Col span="3">
        <Card class='x-card'>
          <p slot="title">Best Deadline</p>
          <p>{{ mined }}</p>
        </Card>
      </Col>   

      <Col span="5">
        <Card class='x-card'>
          <p slot="title">Best Deadline(360 rounds)</p>
          <p>{{ mined }}</p>
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
    ...mapGetters("Base", {
      mined: "mined",      
    })
  },

  methods: {      
  },

  mounted () {      
  }
}
</script>
