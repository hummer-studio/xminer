'use strict'

const CronJob = require('cron').CronJob,
         exec = require('../app/utilities/exec')

//更新用户表的目的地国家字段
new CronJob('0 0 0 * * *', () => {
  const execute = require('../app/services/update_user_country')

  co(execute, moment().subtract(1, 'day').startOf('day'), moment().subtract(1, 'day').startOf('day'))
}).start()