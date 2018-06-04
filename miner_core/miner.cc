#include <string.h>
#include <sstream>
#include <iostream>
#include <fstream>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include <node.h>
#include <node_api.h>
#include <uv.h>
#include <utility>
#include <unistd.h>

#include "sph_shabal.h"
#include "mshabal.h"
#include "mshabal256.h"
#include "shabal_asm.h"
#include "miner.h"


namespace Helper {
// using v8::FunctionCallbackInfo;
// using v8::Isolate;
// using v8::Local;
// using v8::Object;
// using v8::String;
// using v8::Value;

int xdigit(char const digit) {
  int val;
  if ('0' <= digit && digit <= '9')
    val = digit - '0';
  else if ('a' <= digit && digit <= 'f')
    val = digit - 'a' + 10;
  else if ('A' <= digit && digit <= 'F')
    val = digit - 'A' + 10;
  else
    val = -1;
  return val;
}

size_t xstr2strr(char *buf, size_t const bufsize, const char *const in) {
  if (!in) return 0;  // missing input string

  size_t inlen = (size_t)strlen(in);
  if (inlen % 2 != 0) inlen--;  // hex string must even sized

  size_t i, j;
  for (i = 0; i < inlen; i++)
    if (xdigit(in[i]) < 0) return 0;  // bad character in hex string

  if (!buf || bufsize < inlen / 2 + 1) return 0;  // no buffer or too small

  for (i = 0, j = 0; i < inlen; i += 2, j++)
    buf[j] = xdigit(in[i]) * 16 + xdigit(in[i + 1]);

  buf[inlen / 2] = '\0';
  return inlen / 2 + 1;
}

napi_value Echo(napi_env env, napi_callback_info info) {
  napi_status status;

  size_t argc = 1;
  napi_value argv[1];
  status = napi_get_cb_info(env, info, &argc, argv, 0, 0);

  if (status != napi_ok || argc < 1) {
    napi_throw_type_error(env, "1", "Wrong number of arguments");
    status = napi_get_undefined(env, argv);
  }

  return argv[0];
}

void mine(arg_example_method* pData){

  char signature[33] = {};
  xstr2strr(signature, sizeof(signature), pData->generationSignature);  

  uint64_t accountId;
  uint64_t nonceStart;
  uint64_t nonceSize;
  uint64_t staggerSize;
  if (pData->isPoc2){
    sscanf(pData->name, "%llu_%llu_%llu", &accountId, &nonceStart, &nonceSize);
    staggerSize = nonceSize;
  }else{
    sscanf(pData->name, "%llu_%llu_%llu_%llu", &accountId, &nonceStart, &nonceSize, &staggerSize);
  }
  
  printf("filename: %s poc2: %X\n", pData->name, pData->isPoc2);
  printf("generationSignature: %s, height: %d\n", pData->generationSignature, pData->height);
  printf("%llu_%llu_%llu_%llu\n", accountId, nonceStart, nonceSize, staggerSize);    

  // __asm__("int3");

  char scoopgen[40];  
  memmove(scoopgen, signature, sizeof(signature) - 1);
  const char *mov = (char*)&pData->height;
  scoopgen[32] = mov[7]; scoopgen[33] = mov[6]; scoopgen[34] = mov[5]; scoopgen[35] = mov[4]; scoopgen[36] = mov[3]; scoopgen[37] = mov[2]; scoopgen[38] = mov[1]; scoopgen[39] = mov[0];

  sph_shabal_context x;
  sph_shabal256_init(&x);
  sph_shabal256(&x, (const unsigned char*)(const unsigned char*)scoopgen, 40);
  char xcache[32];
  sph_shabal256_close(&x, xcache);

  uint32_t scoop = (((unsigned char)xcache[31]) + 256 * (unsigned char)xcache[30]) % 4096;

  // fopen
  // _fseeki64

  std::ifstream f;
  f.open(pData->path, std::ios::binary);

  // staggerSize = staggerSize / 8 * 8;
  uint64_t cacheSize = staggerSize;
  size_t bufferSize = staggerSize * 64;
  char *pBuffer = new char[bufferSize];
  

  printf("nonceSize: %08X, BufferSize: %08X, scoop: %08X\n", nonceSize, bufferSize, scoop);

  for (auto n = 0; n < nonceSize; n += staggerSize){
    auto start = 1L * n * 4096 * 64 + scoop * staggerSize * 64;
		auto MirrorStart = 1L * n * 4096 * 64 + (4095 - scoop) * staggerSize * 64; //PoC2 Seek possition

    for (unsigned long long i = 0; i < staggerSize; i += cacheSize){

      if (i + cacheSize > staggerSize){
        __asm__("int3");
        cacheSize = staggerSize - i;
      }

      printf("seek: %llX %llX\n", (uint64_t)start + i * 64, (uint64_t)MirrorStart + i * 64);
      f.seekg(start + i * 64);

      f.read(pBuffer, bufferSize);
      if (bufferSize != f.gcount()){
        printf("error: %08X %08X\n", bufferSize, f.gcount());
        __asm__("int3");        
      }
      
      printf("%08X, currentPos: %llx\n", *(uint32_t*)pBuffer, (uint64_t)f.tellg());

      #ifdef __AVX2__        
        procscoop_m256_8(signature, n + nonceStart + i, cacheSize, pBuffer, pData);// Process block AVX2
      #else
        #ifdef __AVX__
          procscoop_m_4(signature, n + nonceStart + i, cacheSize, pBuffer, pData);// Process block AVX
        #else
          procscoop_sph(signature, n + nonceStart + i, cacheSize, pBuffer, pData);// Process block SSE4
        #endif
      #endif
    }
  }

  if (pBuffer){
    delete[] pBuffer;
  }
}

napi_value TestResolveAsync(napi_env env, napi_callback_info info) {
  napi_status status;
  
  napi_value args[8];
  size_t argc = sizeof(args) / sizeof(napi_value);
  status = napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  
  arg_example_method *pData = new arg_example_method;  

  size_t cb;
  napi_get_value_string_utf8(env, args[0], pData->generationSignature, sizeof(pData->generationSignature), &cb);  
  napi_get_value_int64(env, args[1], (int64_t*)&pData->baseTarget);
  napi_get_value_int64(env, args[2], (int64_t*)&pData->height);
  napi_get_value_int64(env, args[3], (int64_t*)&pData->targetDeadline);
  
  napi_get_value_string_utf8(env, args[4], pData->path, sizeof(pData->path), &cb);  
  napi_get_value_string_utf8(env, args[5], pData->name, sizeof(pData->name), &cb);
  napi_get_value_int32(env, args[6], &pData->isPoc2);

  napi_create_reference(env, args[7], 1, &pData->callback);  

  // {
  //   napi_value arg1, arg2;
  //   status = napi_create_object(env, &arg1);
  //   status = napi_create_object(env, &arg2);
  //   napi_create_async_work(env, arg1, arg2, [](napi_env env, void* data){
  //     arg_example_method* _data = (arg_example_method*)data;

  //   }, [](napi_env env, napi_status status, void* data){
  //     arg_example_method* _data = (arg_example_method*)data;

  //     printf("fuck hahah\n");
  //     napi_value callback;
  //     napi_get_reference_value(env, _data->callback, &callback);

  //     napi_value global;
  //     napi_get_global(env, &global);
  //     napi_call_function(env, global, callback, 0, NULL, NULL);

  //     napi_delete_reference(env, _data->callback);
  //     napi_delete_async_work(env, _data->callbackWorker);

  //   }, pData, &pData->callbackWorker);
  // }  

  // napi_queue_async_work(env, pData->callbackWorker);


  
  
  napi_value promise;
  napi_create_promise(env, &pData->deferred, &promise);

  napi_value arg1, arg2;
  napi_create_object(env, &arg1);
  napi_create_object(env, &arg2);
  napi_create_async_work(env, arg1, arg2, [](napi_env env, void* data){      
    arg_example_method* pData = (arg_example_method*)data;

    napi_status status;

    

    // napi_value global;
    // napi_get_global(env, &global);

    // // printf("callback: %08X\n", pData->callback);
    // // status = napi_call_function(env, global, pData->callback, 0, NULL, NULL);
    // // printf("status: %d\n", status);

    // napi_value callback;
    // status = napi_get_reference_value(env, pData->callback, &callback);
    // printf("%08X %08X\n", status, callback);

    // status = napi_call_function(env, global, callback, 0, NULL, NULL);
    // printf("%08X %08X\n", status, callback);

    // for (auto i = 0; i < 10; i++){
    //   // printf("%08X\n", callback);

    //   napi_value global;
    //   napi_get_global(env, &global);
    //   napi_call_function(env, global, callback, 0, NULL, NULL);
    // }

    printf("begin mine\n");
    mine(pData);

  }, [](napi_env env, napi_status nd_status, void* data){
    napi_status status;
    arg_example_method *pData = (arg_example_method*)data;    

    napi_value error, error_code, error_msg;
    napi_value result;
    const napi_extended_error_info* err_info_ptr;
    
    if (nd_status != napi_ok){
      status = napi_get_last_error_info(env, &err_info_ptr);
      status = napi_create_string_utf8(env, "NAPI_ERROR", NAPI_AUTO_LENGTH, &error_code);
      status = napi_create_string_utf8(env, err_info_ptr->error_message, NAPI_AUTO_LENGTH, &error_msg);
      status = napi_create_error(env, error_code, error_msg, &error);
      status = napi_reject_deferred(env, pData->deferred, error);
    } else {
      // status = napi_create_double(env, pData->result, &result);
      status = napi_resolve_deferred(env, pData->deferred, result);
    }

    if (pData){
      napi_delete_async_work(env, pData->mainWorker);
      delete pData;
    }  
  }, pData, &pData->mainWorker);
  
  napi_queue_async_work(env, pData->mainWorker);
  
  return promise;
}

napi_value Init(napi_env env, napi_value exports){
  napi_status status;

  napi_property_descriptor desc[] = {
    { "test", 0, TestResolveAsync, 0, 0, 0, napi_default, 0 },
    { "echo", 0, Echo, 0, 0, 0, napi_default, 0 }      
  };

  status = napi_define_properties(env, exports, sizeof(desc) / sizeof(*desc), desc);

  return exports;
}

NAPI_MODULE(hello, Init)

}  // namespace Helper