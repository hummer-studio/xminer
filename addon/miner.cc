#ifdef _WIN32
#endif

#include "miner.h"


bool _debug = false;

namespace Mine {

uint32_t getScoop(const char *signature, size_t size, uint64_t height){    
  char scoopgen[40];  
  memmove(scoopgen, signature, size - 1);
  const char *mov = (char*)&height;
  for (size_t i = 0; i < sizeof(height); i++){
    scoopgen[32 + i] = mov[7 - i];
  }  

  sph_shabal_context x;
  sph_shabal256_init(&x);
  sph_shabal256(&x, (const unsigned char*)(const unsigned char*)scoopgen, 40);
  char xcache[32];
  sph_shabal256_close(&x, xcache);  

  return (((unsigned char)xcache[31]) + 256 * (unsigned char)xcache[30]) % 4096;
}

void mine(CALLBACK_CONTEXT* pData){
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

  auto currentHeight = std::to_string(pData->height);
  auto isPoc2Compat = pData->isPoc2 != (pData->height >= POC2_START_BLOCK);
  
  log(printf("filename: %s poc2: %X\n", pData->name.c_str(), pData->isPoc2));
  log(printf("generationSignature: %s, height: %llu\n", pData->generationSignature.c_str(), pData->height));
  log(printf("%llu_%llu_%llu_%llu\n", accountId, nonceStart, nonceSize, staggerSize));

  char signature[33] = {};
  xstr2strr(signature, sizeof(signature), pData->generationSignature.c_str());  
  uint32_t scoop = getScoop(signature, sizeof(signature), pData->height);
  pData->result.scoop = scoop;

  auto f = open(pData->path.c_str(), O_RDONLY);  
  log(printf("open: %s %08X\n", pData->path.c_str(), f));
  

  // staggerSize = staggerSize / 8 * 8;
  size_t bufferSize = std::min<size_t>(MAX_CACHE_SCOOP_SIZE, staggerSize);
  // bufferSize = (SCOOP_SIZE * 10 - 1) / SCOOP_SIZE * SCOOP_SIZE + SCOOP_SIZE;
  // bufferSize = (bufferSize - 1) / getpagesize() * getpagesize() + getpagesize();
  
  char *pBuffer = new char[bufferSize * SCOOP_SIZE];
  char *pBuffer2 = isPoc2Compat ? new char[bufferSize * SCOOP_SIZE] : NULL;  

  log(printf("nonceSize: %llu, BufferSize: %08zX, scoop: %08X\n", nonceSize, bufferSize, scoop));

  for (uint64_t n = 0; n < nonceSize; n += staggerSize){
    auto start = n * PLOT_SIZE + scoop * staggerSize * SCOOP_SIZE;
    auto MirrorStart = n * PLOT_SIZE + (4095 - scoop) * staggerSize * SCOOP_SIZE; //PoC2 Seek possition

    for (uint64_t i = 0; i < staggerSize; i += bufferSize){

      if (strcmp(currentHeight.c_str(), getenv(ENV_CURRENT_HEIGHT)) != 0){
        break;
      }          
      
      if (i + bufferSize > staggerSize){
        bufferSize = staggerSize - i;
      }

      log(printf("loop: %llX, %08zX, %llX\n", i, bufferSize, staggerSize));

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
      lseek(f, start + i * SCOOP_SIZE, SEEK_SET);      

      CTickTime tt;
    
      size_t cb = read(f, pBuffer, bufferSize * SCOOP_SIZE);
      if (cb != bufferSize * SCOOP_SIZE){
        printf("read error: %08zX %08zX\n", bufferSize * SCOOP_SIZE, cb);
        break;
      }

      pData->result.readedSize += cb;

      if (isPoc2Compat){
        lseek(f, MirrorStart + i * SCOOP_SIZE, SEEK_SET);
        cb = read(f, pBuffer2, bufferSize * SCOOP_SIZE);
        if (cb != bufferSize * SCOOP_SIZE){
          printf("read error: %08zX %08zX\n", bufferSize * SCOOP_SIZE, cb);
          break;
        }

        pData->result.readedSize += cb;
        pData->result.readElapsed += tt.tick();

        for (size_t t = 0; t < cb; t += SCOOP_SIZE) {
          memcpy(&pBuffer[t + HASH_SIZE], &pBuffer2[t + HASH_SIZE], HASH_SIZE); //copy second hash to correct place.
        }
      }else{
        pData->result.readElapsed += tt.tick();
      }

      tt.reInitialize();

      #ifdef __AVX2__        
        procscoop_m256_8(signature, n + nonceStart + i, bufferSize, pBuffer, pData);// Process block AVX2
      #else
        #ifdef __AVX__
          procscoop_m_4(signature, n + nonceStart + i, bufferSize, pBuffer, pData);// Process block AVX
        #else
          procscoop_sph(signature, n + nonceStart + i, bufferSize, pBuffer, pData);// Process block SSE4
        #endif
      #endif

      pData->result.calcElapsed += tt.tick();

      // if (pBuffer){
      //   munmap(pBuffer, bufferSize);
      // }      
    }
  }

  if (f){
    close(f);
  }

  if (pBuffer){
    delete[] pBuffer;
  }

  if (pBuffer2){
    delete[] pBuffer2;
  }
}


// napi_status testCallback(napi_env env, arg_example_method *pData){
//   napi_status status;

//   // napi_handle_scope s1;
//   // status = napi_open_handle_scope(env, &s1);
//   // printf("napi_open_handle_scope: %08X\n", status);

//   napi_value global;
//   napi_get_global(env, &global);

//   napi_value callback;
//   napi_get_named_property(env, global, "fuckall", &callback);
//   printf("napi_get_named_property fuckall: %llX\n", callback);

//   napi_value r;  
//   // status = napi_call_function(env, global, callback, 0, NULL, &r);
//   // printf("napi_call_function status: %llX\n", status);
//   status = napi_make_callback(env, pData->ctx, global, callback, 0, NULL, &r);

  

//   // napi_value callback;
//   // status = napi_get_reference_value(env, pData->callback, &callback);
//   // printf("napi_get_reference_value: %llX %llX\n", status, callback);

//   // status = napi_call_function(env, pData->jsThis, callback, 0, NULL, NULL);
//   // printf("status: %llX\n", status);
  
  
//   // napi_value result;
//   // status = napi_make_callback(env, pData->ctx, pData->jsThis, callback, 0, NULL , &result);
//   // printf("napi_make_callback: %llX %llX\n", status, result);

//   // napi_value result;
//   // status = napi_call_function(env, NULL, callback, 0, NULL, &result);
//   // printf("napi_call_function: %08X\n", status);    

//   const napi_extended_error_info *error = NULL;
//   napi_get_last_error_info(env, &error);
//   printf("error: %s\n", error->error_message);

//   return napi_ok;
// }

// napi_value TestResolveAsync(napi_env env, napi_callback_info info) {
//   napi_status status;
  
//   arg_example_method *pData = new arg_example_method;  
//   memset(pData, 0, sizeof(arg_example_method));

//   napi_value args[2];
//   size_t argc = sizeof(args) / sizeof(napi_value);  
//   status = napi_get_cb_info(env, info, &argc, args, &pData->jsThis, nullptr);
//   printf("napi_get_cb_info: %llX\n", pData->jsThis);
  
  
//   // status = napi_get_string_from_object(env, args[0], "generationSignature", pData->generationSignature, sizeof(pData->generationSignature));
//   // status = napi_get_int64_from_object(env, args[0], "baseTarget", (int64_t*)&pData->baseTarget);
//   // status = napi_get_int64_from_object(env, args[0], "height", (int64_t*)&pData->height);
//   // status = napi_get_int64_from_object(env, args[0], "targetDeadline", (int64_t*)&pData->targetDeadline);  
//   // status = napi_get_string_from_object(env, args[0], "fullPath", pData->path, sizeof(pData->path));  
//   // status = napi_get_string_from_object(env, args[0], "fileName", pData->name, sizeof(pData->name));
//   // status = napi_get_int64_from_object(env, args[0], "isPoc2", (int64_t*)&pData->isPoc2);
  
//   napi_create_reference(env, args[1], 1, &pData->callback);  

//   // const napi_extended_error_info *error = NULL;
//   // napi_get_last_error_info(env, &error);
//   // printf("error: %s\n", error->error_message);

//   printf("pthread_self: %llX\n", pthread_self());
  
//   napi_value promise;
//   napi_create_promise(env, &pData->deferred, &promise);

//   napi_value arg1, arg2;
//   napi_create_object(env, &arg1);
//   napi_create_object(env, &arg2);
//   napi_create_async_work(env, arg1, arg2, [](napi_env env, void* data){
//     // if (1){
//     //   napi_throw_type_error(env, "123", "haha");
//     //   return;
//     // }

//     printf("pthread_self execute: %llX\n", pthread_self());
//     arg_example_method* pData = (arg_example_method*)data;

//     // testCallback(env, pData);    
    

//     mine(pData);
//     printf("execute done.\n");
  
//   }, [](napi_env env, napi_status nd_status, void* data){
//     printf("completed status: %llX\n", nd_status);
//     printf("pthread_self completed: %llX\n", pthread_self());

//     napi_status status;
//     arg_example_method *pData = (arg_example_method*)data;              

//     // testCallback(env, pData);    
    
//     if (nd_status != napi_ok){
//       const napi_extended_error_info* err_info_ptr;
//       status = napi_get_last_error_info(env, &err_info_ptr);

//       napi_value error, error_code, error_msg;
//       status = napi_create_string_utf8(env, "NAPI_ERROR", NAPI_AUTO_LENGTH, &error_code);
//       status = napi_create_string_utf8(env, err_info_ptr->error_message, NAPI_AUTO_LENGTH, &error_msg);

//       status = napi_create_error(env, error_code, error_msg, &error);
//       status = napi_reject_deferred(env, pData->deferred, error);
//     } else {
//       napi_value result;      
//       napi_create_object(env, &result);

//       napi_value resultNonce;
//       napi_create_int64(env, pData->result.nonce, &resultNonce);

//       napi_value resultDeadline;
//       napi_create_int64(env, pData->result.deadline, &resultDeadline);
      
//       napi_set_named_property(env, result, "nonce", resultNonce);    
//       napi_set_named_property(env, result, "deadline", resultDeadline);    

//       napi_resolve_deferred(env, pData->deferred, result);
//     }

//     if (pData){
//       napi_delete_reference(env, pData->callback);
//       napi_delete_async_work(env, pData->mainWorker);
//       delete pData;
//     }

//     printf("that's all.\n");
//   }, pData, &pData->mainWorker);
  
//   napi_queue_async_work(env, pData->mainWorker);
  
//   return promise;
// }

// napi_value Init(napi_env env, napi_value exports){
//   napi_status status;

//   napi_property_descriptor desc[] = {
//     { "test", 0, TestResolveAsync, 0, 0, 0, napi_default, 0 }
//   };

//   status = napi_define_properties(env, exports, sizeof(desc) / sizeof(*desc), desc);

//   return exports;
// }

// NAPI_MODULE(hello, Init)

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

  static Value getScoop(const CallbackInfo& info) {
    auto params = info[0].As<Object>();

    auto generationSignature = params.Get("generationSignature").As<String>().Utf8Value();    
    auto height = params.Get("height").As<Number>().Int64Value();

    char signature[33] = {};
    xstr2strr(signature, sizeof(signature), generationSignature.c_str());  

    auto scoop = Mine::getScoop(signature, sizeof(signature), height);

    return Value(Number::New(info.Env(), scoop));
  }

private:
  MineWorker(Function cb, CALLBACK_CONTEXT &ctx) : AsyncWorker(cb) {
    _context = ctx;
  }  

protected:
  void Execute() override {
    // if (!_succeed) {
    //   SetError("test error");
    // }
    
    log(printf("pthread_self: %llX\n", (uint64_t)pthread_self()));    
    
    log(printf("Execute\n"));
    mine(&_context);
    log(printf("Execute done\n"));
  }

  void OnOK() override {
    // HandleScope scope(_env);
    log(printf("pthread_self: %llX\n", (uint64_t)pthread_self()));

    auto result = Object::New(Env());
    result.Set("nonce", Number::New(Env(), _context.result.nonce));
    result.Set("deadline", Number::New(Env(), _context.result.deadline));
    result.Set("best", Number::New(Env(), _context.result.best));
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
};

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  log(printf("pthread_self: %llX\n", (uint64_t)pthread_self()));

  auto debug = getenv("DEBUG");
  if (debug){
    _debug = strcmp(debug, "true") == 0;
  }

  exports["run"] = Function::New(env, MineWorker::run);
  exports["getScoop"] = Function::New(env, MineWorker::getScoop);
  return exports;
}

NODE_API_MODULE(addon, Init)

}  // namespace Helper