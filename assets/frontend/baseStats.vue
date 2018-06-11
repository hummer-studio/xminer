<style lang="scss" scoped>
</style>

<template>
  <Content class="layout-content">
    <h2>Base Info</h2>

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

      <Col span="3">
        <Card class='x-card'>
          <p slot="title">Capacity</p>
          <a @click="modalCapacity = true">{{ capacity }}</a>
        </Card>
      </Col>            
    </Row>   

    <Modal
      v-model="modalCapacity"
      :title="`Total files: ${files.length}`"
      :width="tableWidth + 30"
    >
      <div slot="footer"></div>
      <Table border :columns="columns5" :data="data5" height="500" :width="tableWidth"></Table>
    </Modal>
  </Content>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { humanDeadline, humanSize, humanSize2Bytes } from "../../utilities"

export default {
  data: function(){
    return {
      tableWidth: 1024,

      modalCapacity: false,
      columns5: [
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
    ...mapGetters("Base", {
      mined: "mined",      
      capacity: "capacity",
      files: "files"
    }),

    data5: function (){      
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
