const staticCache = require('koa-static-cache')

app.use(staticCache("./public", {
  maxAge: 3600 * 24 * 30, 
}))
