'use strict'

require("koa-websocket")(app)

app.ws.use(function (ctx, next){
  if (ctx.path != "/ws"){
    ctx.websocket.terminate();
    return next(ctx)
  }

  Client.save(ctx.websocket)  
})