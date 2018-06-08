const staticCache = require('koa-static-cache')

app.use(staticCache("./public", {
  //prefix: BASE_NAME
}))
