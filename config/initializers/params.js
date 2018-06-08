'use strict'

const body = require('koa-better-body'),
  validate = require('koa-validation'),
        qs = require('qs')

app.use(body({
  //strict: false,
  querystring: qs,
}))

app.use(validate());
app.use(function* mergeParam(next){
  if (this.method == "GET"){
    this.params = _.merge({}, this.params, this.request.fields, qs.parse(this.query))
  }else{
    this.params = _.merge({}, this.params, this.request.fields, this.query)
  }

  yield next
});
