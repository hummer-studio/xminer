#include "plot.h"


namespace NPlot{

using namespace Napi;

class PlotWorker : public AsyncWorker {
private:
  PLOT_CONTEXT _context;

public:
  static void run(const CallbackInfo& info) {  
    auto params = info[0].As<Object>();         

    PLOT_CONTEXT ctx;
    ctx.cache = params.Get("buffer").As<Buffer<char>>().Data();    
    ctx.addr = atoll(params.Get("account").As<String>().Utf8Value().c_str());        
    ctx.startNonce = atoll(params.Get("startNonce").As<String>().Utf8Value().c_str());
    ctx.nonces = atoll(params.Get("nonces").As<String>().Utf8Value().c_str());

    printf("address: %llu %llu %llu\n", ctx.addr, ctx.startNonce, ctx.nonces);

    Function cb = info[1].As<Function>();      
    
    PlotWorker* worker = new PlotWorker(cb, ctx);

    worker->Queue();    
  }

private:
  PlotWorker(Function cb, PLOT_CONTEXT &ctx) : AsyncWorker(cb) {
    _context = ctx;
  }  

protected:
  void Execute() override {    
    int selecttype = 2;

    uint64_t addr = _context.addr;
    uint64_t startnonce = _context.startNonce;
    uint32_t staggersize = _context.nonces;
    char *cache = _context.cache;

    uint64_t i = startnonce;

    uint32_t noncearguments = selecttype == 2 ? 8 : (
      selecttype == 1 ? 4 : 1
    );

    for (uint32_t n = 0; n < staggersize; n += noncearguments) {
      if (selecttype == 1) { // SSE4
        mnonce(cache, addr, staggersize,
                (i + n), (i + n + 1), (i + n + 2), (i + n + 3),
                (uint64_t)(i - startnonce + n),
                (uint64_t)(i - startnonce + n + 1),
                (uint64_t)(i - startnonce + n + 2),
                (uint64_t)(i - startnonce + n + 3));
      }
      else if (selecttype == 2) { // AVX2
        m256nonce(cache, addr, staggersize,
                  (i + n + 0), (i + n + 1), (i + n + 2), (i + n + 3),
                  (i + n + 4), (i + n + 5), (i + n + 6), (i + n + 7),
                  (i - startnonce + n));
      }
      else { // STANDARD
        nonce(cache, addr, staggersize, (i + n), (uint64_t)(i - startnonce + n));
      }      
    }
  }

  void OnOK() override {
    Callback().MakeCallback(Receiver().Value(), std::initializer_list<napi_value>{
      Boolean::New(Env(), false), Boolean::New(Env(), false)
    });
  }
};

Object Init(Env env, Object exports) {

  exports["run"] = Function::New(env, PlotWorker::run);
  
  return exports;
}

NODE_API_MODULE(addon, Init)
}