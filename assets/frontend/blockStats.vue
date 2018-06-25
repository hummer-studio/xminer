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
          <p slot="title" title="Elapsed">Elapsed</p>          
          <p>{{ elapsed }}</p>
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
          <a @click="toggleDifficulty">{{ difficulty }}</a>
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
      class="modal-hidden-footer"  
    >      
      <Table border :columns="nonceInfoColumn" :data="noncesData" height="500" :width="tableWidth"></Table>
    </Modal>

    <Modal
      :width="1024"
      v-model="modalScoop"    
      class="modal-hidden-footer"  
    >
      <Spin fix :hidden="!blocksLoading"></Spin>
      <vue-highcharts :options="chartOptionsScoop"></vue-highcharts>    
    </Modal>

    <Modal
      :width="1024"
      v-model="modalDifflculty"    
      class="modal-hidden-footer"  
    >
      <Spin fix :hidden="!blocksLoading"></Spin>
      <vue-highcharts :options="chartOptionsDifflculty"></vue-highcharts>    
    </Modal>
  </Content>  
</template>

<script>
import VueHighcharts from 'vue2-highcharts'
import { mapState, mapGetters, mapActions } from 'vuex'
import { humanDeadline, convertTimestamp } from "../../utilities"
import { getDifficulty } from "../../mine/utilities"
import moment from "moment"

export default {
  components: {
    VueHighcharts
  },

  data () {      
    return  {
      timer: null,

      tableWidth: 1024,
      modalNonces: false,
      modalScoop: false,
      modalDifflculty: false,

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
      ],
    }
  },

  computed: {
    ...mapState("Block", ["height", "nonces", "baseTarget", "scoop", "progress", "blocksLoading", "his"]),
    ...mapGetters("Block", ["elapsed", "targetDeadline", "difficulty", "deadline"]),

    noncesData: function (){            
      return _.chain(this.nonces).orderBy(["deadline", "asc"]).map((n) => {
        return {
          name: n.fileName,
          nonce: n.nonce,
          deadline: humanDeadline(n.deadline)
        }
      }).value()
    },
    
    chartOptionsScoop: function(){          
      return {
        chart: {
          type: 'column'
        },
        title: {
          text: ' '
        },
        // subtitle: {
        //   text: 'Source: WorldClimate.com'
        // },
        xAxis: {
          // categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          //   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          // labels: {
          //   formatter: function(){
          //     return convertTimestamp(this.value)
          //   }
          // }
        },
        yAxis: {
          title: {
            text: 'scoop'
          },
          // labels: {
          //   formatter: function () {
          //     return humanDeadline(this.value)
          //   }
          // }
        },
        credits: {
          enabled: false
        },
        plotOptions: {
          spline: {
            // dataLabels: {
            //   enabled: true
            // },

            // marker: {
            //   radius: 4,
            //   lineColor: '#666666',
            //   lineWidth: 1
            // }
          }
        },
        series: [{
          name: "count", 
          data: _.chain(this.his).groupBy("scoopNum").map((v, k) => {
            return {
              x: Number(k),
              y: v.length,
            }
          }).compact().value(),
        }],

        tooltip: {
          // formatter: function (n){
          //   return convertTimestamp(this.x)
          // }
        }
      }
    },

    chartOptionsDifflculty: function(){
      return {
        chart: {
          type: 'spline'
        },
        title: {
          text: ' '
        },
        // subtitle: {
        //   text: 'Source: WorldClimate.com'
        // },
        xAxis: {
          // categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          //   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          // labels: {
          //   formatter: function(){
          //     return moment(this.value).format()
          //     return convertTimestamp(this.value)
          //   }
          // }
        },
        yAxis: {
          title: {
            text: 'difficulty'
          },
          // labels: {
          //   formatter: function () {
          //     return humanDeadline(this.value)
          //   }
          // }
        },
        credits: {
          enabled: false
        },
        plotOptions: {
          series:{
            turboThreshold: 0,
          },
          spline: {
            turboThreshold: 0,
            
            // dataLabels: {
            //   enabled: true
            // },

            // marker: {
            //   radius: 4,
            //   lineColor: '#666666',
            //   lineWidth: 1
            // }
          }
        },
        series: [{
          name: "difficulty", 
          data: _.chain(this.his).slice(-360).orderBy(["timestamp"]).map((n) => {
            if (!n.timestamp){
              return
            }

            return {
              x: n.timestamp,
              y: getDifficulty(n.baseTarget),
            }
          }).compact().value(),
        }],

        tooltip: {
          formatter: function (n){
            return `${convertTimestamp(this.x).format()}<br>${this.y}`
          }
        }
      }
    }
  },

  methods: {      
    ...mapActions("Block", ["getBlocks", "ticktock"]),
    toggleScoop: function(){
      this.modalScoop = true

      this.getBlocks()
    },
    toggleDifficulty: function(){
      this.modalDifflculty = true

      this.getBlocks()
    }
  },

  beforeDestroy(){
    if (this.timer){
      clearInterval(this.timer)
      this.timer = null
    }
  },

  mounted () {
    this.timer = setInterval(this.ticktock.bind(this), 1000)
  }
}
</script>
