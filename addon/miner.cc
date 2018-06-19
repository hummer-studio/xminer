#ifdef _WIN32
#endif

#include "miner.h"
#include "plot.h"

bool _debug = false;
uint32_t **_height = NULL;

namespace Mine {

using namespace Napi;

class MineWorker : public AsyncWorker {
private:
  CALLBACK_CONTEXT _context;

public:
  static void run(const CallbackInfo& info) {
    auto params = info[0].As<Object>();    

    CALLBACK_CONTEXT ctx;
    memset(&ctx, 0, sizeof(CALLBACK_CONTEXT));    

    ctx.generationSignature = params.Get("generationSignature").As<String>().Utf8Value();    
    ctx.baseTarget = params.Get("baseTarget").As<Number>().Int64Value();
    ctx.height = params.Get("height").As<Number>().Int64Value();
    ctx.targetDeadline = params.Get("targetDeadline").As<Number>().Int64Value();    
    ctx.path = params.Get("fullPath").As<String>().Utf8Value();
    ctx.name = params.Get("fileName").As<String>().Utf8Value();
    
    ctx.isPoc2 = params.Get("isPoc2").As<Boolean>().Value();

    Function cb = info[1].As<Function>();    
    
    MineWorker* worker = new MineWorker(cb, ctx);
    // worker->Receiver().Set("data", "fuck");

    worker->Queue();
  }

  static Value getScoopJs(const CallbackInfo& info) {
    auto params = info[0].As<Object>();

    auto generationSignature = params.Get("generationSignature").As<String>().Utf8Value();    
    auto height = params.Get("height").As<Number>().Int64Value();

    char signature[33] = {};
    xstr2strr(signature, sizeof(signature), generationSignature.c_str());  

    auto scoop = Mine::getScoop(signature, sizeof(signature), height);

    return Number::New(info.Env(), scoop);
  }

  static Value getInstruction(const CallbackInfo& info) {
    #ifdef __AVX2__
      return String::New(info.Env(), "avx2");      
    #else
      #ifdef __AVX__
        return String::New(info.Env(), "avx");
      #endif
    #endif

    return String::New(info.Env(), "");
  }

  static void setHeightVar(const CallbackInfo& info){    
    _height = info[0].As<Buffer<uint32_t*>>().Data();    

    log(printf("setHeight: %d\n", *(uint32_t*)_height));
  }

private:
  MineWorker(Function cb, CALLBACK_CONTEXT &ctx) : AsyncWorker(cb) {
    _context = ctx;
  }  

protected:
  void Execute() override {    
    
    #ifndef _WIN32
    log(printf("pthread_self: %p\n", pthread_self()));
    #endif

    CALLBACK_CONTEXT *pData = &_context;

    uint64_t accountId;
    uint64_t nonceStart;
    uint64_t nonceSize;
    uint64_t staggerSize;
    if (pData->isPoc2){
      sscanf(pData->name.c_str(), "%llu_%llu_%llu", &accountId, &nonceStart, &nonceSize);
      staggerSize = nonceSize;
    }else{
      sscanf(pData->name.c_str(), "%llu_%llu_%llu_%llu", &accountId, &nonceStart, &nonceSize, &staggerSize);
    }
    
    auto isPoc2Compat = pData->isPoc2 != (pData->height >= POC2_START_BLOCK);
    
    log(printf("filename: %s poc2: %X\n", pData->name.c_str(), pData->isPoc2));
    log(printf("generationSignature: %s, height: %llu targetDeadline: %llu\n", pData->generationSignature.c_str(), pData->height, pData->targetDeadline));
    log(printf("%llu_%llu_%llu_%llu\n", accountId, nonceStart, nonceSize, staggerSize));

    char signature[33] = {};
    xstr2strr(signature, sizeof(signature), pData->generationSignature.c_str());  
    uint32_t scoop = getScoop(signature, sizeof(signature), pData->height);
    pData->result.scoop = scoop;

    auto f = CFile(pData->path.c_str());  
    log(printf("open: %s\n", pData->path.c_str()));  

    // staggerSize = staggerSize / 8 * 8;
    size_t bufferCount = std::min<size_t>(MAX_CACHE_SCOOP_SIZE, staggerSize);
    // bufferSize = (SCOOP_SIZE * 10 - 1) / SCOOP_SIZE * SCOOP_SIZE + SCOOP_SIZE;
    // bufferSize = (bufferSize - 1) / getpagesize() * getpagesize() + getpagesize();
    
    char *pBuffer = new char[bufferCount * SCOOP_SIZE];
    char *pBuffer2 = isPoc2Compat ? new char[bufferCount * SCOOP_SIZE] : NULL;  

    log(printf("nonceSize: %llu, bufferCount: %08zX, scoop: %d\n", nonceSize, bufferCount, scoop));

    for (uint64_t n = 0; n < nonceSize; n += staggerSize){
      auto start = n * PLOT_SIZE + scoop * staggerSize * SCOOP_SIZE;
      auto MirrorStart = n * PLOT_SIZE + (4095 - scoop) * staggerSize * SCOOP_SIZE; //PoC2 Seek possition

      for (uint64_t i = 0; i < staggerSize; i += bufferCount){

        if (pData->height != *(uint32_t*)_height){
          break;
        }            
        
        if (i + bufferCount > staggerSize){
          bufferCount = staggerSize - i;
        }

        log(printf("loop: %llX, %08zX, %llX\n", i, bufferCount, staggerSize));

        // size_t d1 = (start + i * 64) % getpagesize();
        // size_t d2 = getpagesize() - d1;

        // if (d1 > 0){
        //   bufferSize += 4096 * 64;
        // }
        
        // pBuffer = (char*)mmap(NULL, bufferSize, PROT_READ, MAP_SHARED, f, start + i * 64 - d1);
        // if (pBuffer == MAP_FAILED){
        //   perror("fuick");
        // }
        // printf("mmap: %08X\n", pBuffer);

        log(printf("seek: %llX %llX\n", (uint64_t)start + i * SCOOP_SIZE, (uint64_t)MirrorStart + i * SCOOP_SIZE));
        if (!f.seek(start + i * SCOOP_SIZE)){
          break;
        }       

        CTickTime tt;
        
        if (!f.read(pBuffer, bufferCount * SCOOP_SIZE)){
          break;
        }      

        pData->result.readedSize += bufferCount * SCOOP_SIZE;
        

        if (isPoc2Compat){
          f.seek(MirrorStart + i * SCOOP_SIZE);
          if (!f.read(pBuffer2, bufferCount * SCOOP_SIZE)){
            break;
          }
          
          pData->result.readedSize += bufferCount * SCOOP_SIZE;
          pData->result.readElapsed += tt.tick();

          for (size_t t = 0; t < bufferCount * SCOOP_SIZE; t += SCOOP_SIZE) {
            memcpy(&pBuffer[t + HASH_SIZE], &pBuffer2[t + HASH_SIZE], HASH_SIZE); //copy second hash to correct place.
          }
        }else{
          pData->result.readElapsed += tt.tick();
        }

        tt.reInitialize();

        #ifdef __AVX2__
          procscoop_m256_8(signature, n + nonceStart + i, bufferCount, pBuffer, procscoop_callback, pData);// Process block AVX2
        #else
          #ifdef __AVX__
            procscoop_m_4(signature, n + nonceStart + i, bufferCount, pBuffer, procscoop_callback, pData);// Process block AVX
          #else
            procscoop_sph(signature, n + nonceStart + i, bufferCount, pBuffer, procscoop_callback, pData);// Process block SSE4
          #endif
        #endif

        pData->result.calcElapsed += tt.tick();

        // if (pBuffer){
        //   munmap(pBuffer, bufferSize);
        // }      
      }
    }

    if (pBuffer){
      delete[] pBuffer;
    }

    if (pBuffer2){
      delete[] pBuffer2;
    }
  }

  void OnOK() override {
    // HandleScope scope(_env);

    #ifndef _WIN32
    log(printf("pthread_self: %p\n", pthread_self()));
    #endif

    auto result = Object::New(Env());
    
    if (_context.result.nonce > 0){
      result.Set("nonce", std::to_string(_context.result.nonce));
      result.Set("deadline", Number::New(Env(), _context.result.deadline));
    }
        
    result.Set("readedSize", Number::New(Env(), _context.result.readedSize));
    result.Set("readElapsed", Number::New(Env(), _context.result.readElapsed));
    result.Set("calcElapsed", Number::New(Env(), _context.result.calcElapsed));
    result.Set("scoop", Number::New(Env(), _context.result.scoop));
    
    Callback().MakeCallback(Receiver().Value(), std::initializer_list<napi_value>{
      Boolean::New(Env(), false), result
    });

    // details::WrapCallback([&] {      

    //   _callback.MakeCallback(_receiver.Value(), std::initializer_list<napi_value>{
    //     String::New(_env, "fuck me"), String::New(_env, "fuck all")
    //   });
            
    //   return nullptr;
    // });  
  }

private:
  static void procscoop_callback(void *pContext, uint64_t wertung, uint64_t nonce){    
    CALLBACK_CONTEXT *pData = (CALLBACK_CONTEXT *)pContext;

    if (wertung / pData->baseTarget <= pData->targetDeadline){    
      log(printf("procscoop_callback: %s %llu %llu %llu %llu %llu\n", pData->name.c_str(), nonce, wertung, wertung / pData->baseTarget, pData->baseTarget, pData->targetDeadline));
      
      if (wertung < pData->result.best || pData->result.best == 0){
        pData->result.best = wertung;
        pData->result.nonce = nonce;
        pData->result.deadline = wertung / pData->baseTarget;
      }
    } 
  }
};

class SmartMineWorker : public AsyncWorker {
private:
  PLOT_CONTEXT _context;

private:
  SmartMineWorker(Function cb, PLOT_CONTEXT &ctx): AsyncWorker(cb){
    _context = ctx;
  }

public:
  static void run(const CallbackInfo& info) {
    auto params = info[0].As<Object>();         

    PLOT_CONTEXT ctx;
    ctx.result.nonce = 0;
    ctx.result.best = 0;
    ctx.result.deadline = 0;

    // ctx.cache = params.Get("buffer").As<Buffer<char>>().Data();    
    ctx.generationSignature = params.Get("generationSignature").As<String>().Utf8Value();    
    ctx.baseTarget = params.Get("baseTarget").As<Number>().Int64Value();
    ctx.height = params.Get("height").As<Number>().Int64Value();
    ctx.targetDeadline = params.Get("targetDeadline").As<Number>().Int64Value();    

    ctx.addr = atoll(params.Get("account").As<String>().Utf8Value().c_str());        
    ctx.startNonce = atoll(params.Get("startNonce").As<String>().Utf8Value().c_str());
    ctx.nonces = atoll(params.Get("nonces").As<String>().Utf8Value().c_str());
    ctx.index = params.Get("index").As<Number>().Int32Value();
    ctx.perNonce = params.Get("perNonce").As<Number>().Int32Value();      

    Function cb = info[1].As<Function>();      
    
    SmartMineWorker* worker = new SmartMineWorker(cb, ctx);

    worker->Queue();
  }

protected:
  void Execute() override {        

    char signature[33] = {};
    xstr2strr(signature, sizeof(signature), _context.generationSignature.c_str());  
    uint32_t scoop = getScoop(signature, sizeof(signature), _context.height);

    //auto start = n * PLOT_SIZE + scoop * staggerSize * SCOOP_SIZE;
    auto offsetNonce = scoop * _context.nonces * SCOOP_SIZE / PLOT_SIZE;

    uint64_t addr = _context.addr;
    uint64_t startnonce = _context.startNonce;
    uint32_t staggersize = _context.perNonce;           

    char *cache = (char*)calloc(NONCE_SIZE, staggersize);    

    uint64_t i = startnonce + offsetNonce + _context.index * _context.perNonce;
    printf("address: %llu %d %llu %llu %llu %d\n", addr, scoop, startnonce, i, offsetNonce, staggersize);

    int selecttype = 2;
    uint32_t noncearguments = selecttype == 2 ? 8 : (
      selecttype == 1 ? 4 : 1
    );          

    for (uint32_t n = 0; n < staggersize; n += noncearguments) {
      if (_context.height != *(uint32_t*)_height){
        break;
      }

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

    // uint64_t accountId = _context.addr;
    // uint64_t nonceStart = _context.startNonce;
    // uint64_t nonceSize = _context.nonces;
    // uint64_t staggerSize = nonceSize;            

    if (_context.height == *(uint32_t*)_height){
      #ifdef __AVX2__
        procscoop_m256_8(signature, i, _context.perNonce, cache, procscoop_callback, &_context);
      #else
      #endif
    }    

    if (cache){
      delete[] cache;
    }
  }

  void OnOK() override {
    auto result = Object::New(Env());
    
    if (_context.result.nonce > 0){
      result.Set("nonce", std::to_string(_context.result.nonce));
      result.Set("deadline", Number::New(Env(), _context.result.deadline));
    }
        
    // result.Set("readedSize", Number::New(Env(), _context.result.readedSize));
    // result.Set("readElapsed", Number::New(Env(), _context.result.readElapsed));
    // result.Set("calcElapsed", Number::New(Env(), _context.result.calcElapsed));
    // result.Set("scoop", Number::New(Env(), _context.result.scoop));
    
    Callback().MakeCallback(Receiver().Value(), std::initializer_list<napi_value>{
      Boolean::New(Env(), false), result
    });    
  }

private:
  static void procscoop_callback(void *pContext, uint64_t wertung, uint64_t nonce){    
    PLOT_CONTEXT *pData = (PLOT_CONTEXT *)pContext;    

    if (wertung / pData->baseTarget <= pData->targetDeadline){          
      log(printf("procscoop_callback: %llu %llu %llu %llu %llu\n", nonce, wertung, wertung / pData->baseTarget, pData->baseTarget, pData->targetDeadline));
      
      if (wertung < pData->result.best || pData->result.best == 0){
        pData->result.best = wertung;
        pData->result.nonce = nonce;
        pData->result.deadline = wertung / pData->baseTarget;
      }
    } 
  }
};

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  #ifndef _WIN32
  log(printf("pthread_self: %p\n", pthread_self()));
  #endif

  auto debug = getenv("DEBUG");
  if (debug){
    _debug = strcmp(debug, "true") == 0;
  }

  exports["run"] = Function::New(env, MineWorker::run);
  exports["getScoop"] = Function::New(env, MineWorker::getScoopJs);
  exports["getInstruction"] = Function::New(env, MineWorker::getInstruction);
  exports["setHeightVar"] = Function::New(env, MineWorker::setHeightVar);  

  exports["smartMine"] = Function::New(env, SmartMineWorker::run);
  
  return exports;
}

NODE_API_MODULE(addon, Init)

}  // namespace Helper