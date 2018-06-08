'use strict'

const render = require('koa-ejs')

render(app, {
  root: 'views',
  layout: 'layout/default',
  viewExt: 'ejs',
  cache: isProduction,  
  strict: true,
});
