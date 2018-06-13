<style lang="scss" scoped>
</style>

<template>
  <Content class="layout-content">
    <h2>Base Info</h2>

    <Row :gutter=10>
      <Col span="3">
        <Card class='x-card'>
          <p slot="title" title="Mined Blocks">Mined Blocks</p>
          <p>{{ mined }}</p>
        </Card>
      </Col>
      <Col span="3">
        <Card class='x-card'>
          <p slot="title" title="Confirmed Blocks">Confirmed Blocks</p>
          <p>{{ mined }}</p>
        </Card>
      </Col>      
      <Col span="3">
        <Card class='x-card'>
          <p slot="title" title="Best Deadline">Best Deadline</p>
          <p v-html="bestDeadline"></p>
        </Card>
      </Col>   

      <Col span="3">
        <Card class='x-card'>
          <p slot="title" title="Best Deadline (360 rounds)">Best Deadline (360 rounds)</p>
          <p v-html="best360Deadline"></p>
        </Card>
      </Col>  

      <Col span="3">
        <Card class='x-card'>
          <p slot="title" title="Capacity">Capacity</p>
          <a @click="modalCapacity = true">{{ capacity }}</a>
        </Card>
      </Col>            
    </Row>   

    <Modal
      v-model="modalCapacity"
      :width="tableWidth + 30"
    >
      <div slot="footer">Total files: {{ (files || []).length }}</div>
      <Table border :columns="plotInfoColumn" :data="plotData" height="500" :width="tableWidth"></Table>
    </Modal>
  </Content>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { humanDeadline, humanSize, humanSize2Bytes } from "../../utilities"

export default {
  data: function(){
    return {
      tableWidth: 1024,

      modalCapacity: false,
      plotInfoColumn: [
        {
          title: 'name',
          key: 'name',
          width: 500,
          sortable: true
        },
        {
          title: 'size',
          key: 'size',
          sortable: true,
          sortMethod: this.sizeOrder
        },      
        {
          title: 'readed size',
          key: 'readedSize',
          sortable: true,
          sortMethod: this.sizeOrder
        },
        {
          title: 'read elapsed',
          key: 'readElapsed',
          sortable: true
        },
        {
          title: 'calc elapsed',
          key: 'calcElapsed',
          sortable: true
        }
      ]      
    }   
  },

  computed: {
    ...mapState("Base", ["files"]),
    ...mapGetters("Base", {
      mined: "mined",      
      capacity: "capacity",      
      bestDeadline: "bestDeadline",
      best360Deadline: "best360Deadline",
    }),

    plotData: function (){      
      return _.chain(this.files).map((n) => {
        return {
          name: n.fileName,
          size: humanSize(n.fileSize),
          readedSize: humanSize(n.readedSize || 0),
          readElapsed: humanDeadline((n.readElapsed || 0) / 1000),
          calcElapsed: humanDeadline((n.calcElapsed || 0) / 1000),
        }
      }).value()
    }
  },

  methods: {   
    sizeOrder: function(v1, v2, v3){
      return v3 == "asc" ? (
        humanSize2Bytes(v1) > humanSize2Bytes(v2) ? 1 : -1
      ) : (
        humanSize2Bytes(v1) < humanSize2Bytes(v2) ? 1 : -1
      )                              
    }
  },

  mounted () {      
  }
}
</script>
