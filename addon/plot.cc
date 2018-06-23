#include "plot.h"

bool _debug = false;

namespace NPlot{

using namespace Napi;

class PlotWorker : public AsyncWorker {
private:
  PLOT_CONTEXT _context;

public:
  static void run2(const CallbackInfo& info) {  
    printf("%d\n", info[0].IsBuffer());

    auto cache = info[0].As<Buffer<char>>().Data();

    printf("cache: %p\n", cache);
  }

  static void run(const CallbackInfo& info) {  
    auto params = info[0].As<Object>();         

    PLOT_CONTEXT ctx;    
    ctx.addr = atoll(params.Get("account").As<String>().Utf8Value().c_str());        
    ctx.startNonce = atoll(params.Get("startNonce").As<String>().Utf8Value().c_str());
    ctx.nonces = atoll(params.Get("nonces").As<String>().Utf8Value().c_str());
    // ctx.cache = params.Get("cache").As<Buffer<char>>().Data();
    ctx.cache = (char*)malloc(ctx.nonces * PLOT_SIZE);


    // char *b = (char*)malloc(ctx.nonces * PLOT_SIZE);
    // printf("b: %p\n", b);
    // memset(b, 0, ctx.nonces * PLOT_SIZE);
    // ctx.cache = Buffer<char>::New(info.Env(), b, ctx.nonces * PLOT_SIZE, [](Napi::Env e, char *p){
    //   printf("finalizeData\n");
    // });
    

    Function cb = info[1].As<Function>();      
    
    PlotWorker* worker = new PlotWorker(cb, ctx);    
    worker->Queue();
    return;

    // char gendata[16 + NONCE_SIZE] = {};
    // char *xv;

    // printf("%llX %llX\n", ctx.addr, ctx.startNonce);
    // SET_NONCE(gendata, ctx.addr,  0);
    // SET_NONCE(gendata, ctx.startNonce, 8);

    // // for (auto i = 0; i < 16; i++){
    // //   printf("%2X ", gendata[NONCE_SIZE + i]);
    // // }

    // // printf("\n");

    // char bb[32] = {};
    // shabal_context init_x;
    // shabal_init(&init_x, 256);

    // shabal(&init_x, "a", 1);
    // shabal_close(&init_x, 0, 0, bb);

    // for (auto i = 0; i < sizeof(bb); i++){
    //   printf("%02X", bb[i] & 0xFF);
    // }
    // printf("\n");
    
  }

private:
  PlotWorker(Function cb, PLOT_CONTEXT &ctx) : AsyncWorker(cb) {
    _context = ctx;
  }

protected:
  void Execute() override {    

    uint64_t addr = _context.addr;
    uint64_t startnonce = _context.startNonce;    
    uint32_t staggersize = _context.nonces;
    char *cache = _context.cache;

    uint64_t i = startnonce;    

    #ifdef __AVX2__
    uint32_t noncearguments = 8;
    #else
      #ifdef __AVX__
      uint32_t noncearguments = 4;
      #else
      uint32_t noncearguments = 1;
      #endif    
    #endif

    //align
    staggersize = staggersize / noncearguments * noncearguments;
    if (staggersize == 0){
      printf("staggersize is zero.\n");
      return;
    }

    log(printf("address: %llu %llu %llu %p %d\n", addr, startnonce, staggersize, cache, noncearguments));

    for (uint32_t n = 0; n < staggersize; n += noncearguments) {
      #ifdef __AVX2__
      m256nonce(cache, addr, staggersize,
                  (i + n + 0), (i + n + 1), (i + n + 2), (i + n + 3),
                  (i + n + 4), (i + n + 5), (i + n + 6), (i + n + 7),
                  (i - startnonce + n));
      #else
        #ifdef __AVX__
        mnonce(cache, addr, staggersize,
                (i + n), (i + n + 1), (i + n + 2), (i + n + 3),
                (uint64_t)(i - startnonce + n),
                (uint64_t)(i - startnonce + n + 1),
                (uint64_t)(i - startnonce + n + 2),
                (uint64_t)(i - startnonce + n + 3));
        #else        
        nonce(cache, addr, staggersize, (i + n), (uint64_t)(i - startnonce + n));
        #endif
      #endif      
    }    

    // printf("%02X %02X %02X %02X \n%02X %02X %02X %02X \n", 
    //   cache[0] & 0xFF, cache[1] & 0xFF, cache[2] & 0xFF, cache[3] & 0xFF,
    //   cache[4] & 0xFF, cache[5] & 0xFF, cache[6] & 0xFF, cache[7] & 0xFF
    // );
    
    // char *cache2 = (char*)malloc(staggersize * PLOT_SIZE);
    // uint64_t nonces = _context.nonces;

    // auto thisrun = 0;
    // uint64_t cacheblocksize = staggersize * SCOOP_SIZE;
    // for (auto thisnonce = 0; thisnonce < NUM_SCOOPS; thisnonce++ ) {
    //   uint64_t cacheposition = thisnonce * cacheblocksize;
    //   uint64_t fileposition  = (uint64_t)(thisnonce * (uint64_t)nonces * (uint64_t)SCOOP_SIZE + thisrun * (uint64_t)SCOOP_SIZE);        

    //   printf("fileposition: %llu, cacheposition: %llu\n", fileposition, cacheposition);
    //   memcpy(&cache2[fileposition], &cache[cacheposition], cacheblocksize);      

    //   if (thisnonce == 10){
    //     break;
    //   }
    // }    

    // memcpy(cache, cache2, staggersize * PLOT_SIZE);

    // if (cache2){
    //   free(cache2);
    // }

    // strcpy(cache, "fuck me");
  }

  void OnOK() override {        
    // HandleScope scope(Env());

    // printf("cache: %p %s\n", _context.cache.Data(), _context.cache.Data());

    // auto p1 = Buffer<char>::New(Env(), "3", 1, [](Napi::Env e, char *p){
    //   printf("fuck\n");
    // });
    
    // strcpy(_context.cache.Data(), "fuck");
    // printf("uint16: %s %d %d %d\n", _context.cache.Data(), sizeof(uint16_t), sizeof(char), sizeof(uint8_t));    

    Callback().MakeCallback(Receiver().Value(), {
      Boolean::New(Env(), false), Buffer<char>::New(Env(), _context.cache, _context.nonces * PLOT_SIZE, [](Napi::Env e, char *cache){
        printf("free\n", cache);
      })
    });
  }
};

Object Init(Env env, Object exports) {  

  exports["run"] = Function::New(env, PlotWorker::run);
  exports["run2"] = Function::New(env, PlotWorker::run2);
  
  return exports;
}

NODE_API_MODULE(addon, Init)
}