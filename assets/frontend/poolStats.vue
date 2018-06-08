<style lang="scss" scoped>

</style>

<template>
  <Layout>
    <Content class="l">
      <Row>
        <Card>
          <p slot="title">Mine stats</p>
          <!-- <a href="#" slot="extra" @click.prevent="changeLimit">
            <Icon type="ios-loop-strong"></Icon>
            Change
          </a>           -->
        </Card>
      </Row>  
    </Content>    
  </Layout>  
</template>

<script>
export default {  
  data () {      
    return  {}
  },
  methods: {      
    connectWS(){
      // this.ws = new WebSocket("wss://0-100-pool.burst.cryptoguru.org/ws");
      this.ws = new WebSocket(`ws://${window.location.host}/ws`);
      this.ws.onmessage = (env) => {
        console.log(env.data)
      }

      // this.ws.onerror = (err) => {
      //   debugger
      // }

      // this.ws.onopen = (w) => {
      //   // this.ws.send(JSON.stringify({fuck: 1}))
      // }

      this.ws.onclose = () => {
        setTimeout(this.connectWS, 1000 * 5)        
      }
    }
  },
  mounted () {    
    this.connectWS()
  }
}
</script>
