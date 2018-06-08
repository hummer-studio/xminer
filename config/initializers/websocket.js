'use strict'

// const ws = require("koa-router")()
              
// require("koa-websocket")(app)

// ws.all('/ws', function* (next) {
//   // return `next` to pass the context (ctx) on to the next ws middleware
//   console.log("fuck all")

//   logger.info("fuck me");

//   yield next
// })

// // app.ws.use((next) => {
// //   console.log("fuck u")
// // })

// // logger.info(ws.allowedMethods())
// app.ws.use(ws.routes()).use(ws.allowedMethods());


require("koa-websocket")(app)

app.ws.use(function (ctx, next){
  if (ctx.path != "/ws"){
    return next(ctx)
  }

  Client.save(ctx.websocket)  

  return next(ctx)
})