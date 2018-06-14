<style lang="scss" scoped>
</style>

<template>
  <Content class="layout-content" v-if="height">
    <h2>Current Block Mine Stats</h2>

    <Progress :percent="progress * 100" style="margin-bottom: 10px" hide-info :stroke-width="3"></Progress>
    <Row :gutter=10>
      <Col span="3">
        <Card class='x-card'>
          <p slot="title" title="Height">Height</p>
          <p>{{ height }}</p>
        </Card>
      </Col>
      <Col span="3">
        <Card class='x-card'>
          <p slot="title" title="Best Deadline">Best Deadline</p>          
          <a @click="modalNonces = true">{{ deadline }}</a>
        </Card>
      </Col>   
      <Col span="3">
        <Card class='x-card'>
          <p slot="title" title="Scoop">Scoop</p>
          <p>{{ scoop }}</p>
        </Card>
      </Col>          
      <Col span="3">
        <Card class='x-card'>
          <p slot="title" title="Base Target">Base Target</p>
          <p>{{ baseTarget }}</p>
        </Card>
      </Col>      
      <Col span="3">
        <Card class='x-card'>
          <p slot="title" title="Target Deadline">Target Deadline</p>
          <p>{{ targetDeadline }}</p>
        </Card>
      </Col>   

      <Col span="3">
        <Card class='x-card'>
          <p slot="title" title="Difficulty">Difficulty</p>
          <p>{{ difficulty }}</p>
        </Card>
      </Col>   

      <!-- <Col span="3">
        <i-circle :percent="80" :size="90" style="margin: 5px 10px">
          <span class="demo-Circle-inner" style="font-size: 24px">80%</span>
        </i-circle>
      </Col> -->
    </Row>

    <Modal
      v-model="modalNonces"
      :width="tableWidth + 30"
    >
      <div slot="footer"></div>
      <Table border :columns="nonceInfoColumn" :data="noncesData" height="500" :width="tableWidth"></Table>
    </Modal>
  </Content>  
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { humanDeadline } from "../../utilities"

export default {
  data () {      
    return  {
      tableWidth: 1024,
      modalNonces: false,

      nonceInfoColumn: [
        {
          title: 'name',
          key: 'name',
          width: 500,          
        },
        {
          title: 'nonce',
          key: 'nonce',
        },
        {
          title: 'deadline',
          key: 'deadline',
        },        
      ]
    }
  },

  computed: {
    ...mapState("Block", ["height", "nonces", "baseTarget", "scoop", "progress"]),
    ...mapGetters("Block", {
      targetDeadline: "targetDeadline",
      difficulty: "difficulty",
      deadline: "deadline",
    }),

    noncesData: function (){            
      return _.chain(this.nonces).orderBy(["deadline", "asc"]).map((n) => {
        return {
          name: n.fileName,
          nonce: n.nonce,
          deadline: humanDeadline(n.deadline)
        }
      }).value()
    }
  },

  methods: {      
  },

  mounted () {    
  }
}
</script>
