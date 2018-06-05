#include <string.h>
#include <sstream>
//#include <iostream>
//#include <fstream>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <sys/mman.h>

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

namespace Mine {

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
  printf("generationSignature: %s, height: %llu\n", pData->generationSignature, pData->height);
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

  // std::ifstream f;
  // f.open(pData->path, std::ios::binary);
  // printf("open: %08X\n", f.fail());

  auto f = open(pData->path, O_RDONLY);  
  printf("open: %s %08X\n", pData->path, f);
  

  // staggerSize = staggerSize / 8 * 8;
  uint64_t cacheSize = staggerSize;
  size_t bufferSize = staggerSize * 64;
  bufferSize = (bufferSize - 1) / getpagesize() * getpagesize() + getpagesize();
  
  char *pBuffer = NULL; //new char[bufferSize];
  

  printf("nonceSize: %llu, BufferSize: %llX, scoop: %08X\n", nonceSize, bufferSize, scoop);

  for (auto n = 0; n < nonceSize; n += staggerSize){
    auto start = 1L * n * 4096 * 64 + scoop * staggerSize * 64;
		auto MirrorStart = 1L * n * 4096 * 64 + (4095 - scoop) * staggerSize * 64; //PoC2 Seek possition

    for (unsigned long long i = 0; i < staggerSize; i += cacheSize){

      if (i + cacheSize > staggerSize){
        __asm__("int3");
        cacheSize = staggerSize - i;
      }

      size_t d1 = (start + i * 64) % getpagesize();
      size_t d2 = getpagesize() - d1;

      if (d1 > 0){
        bufferSize += 4096 * 64;
      }
      
      pBuffer = (char*)mmap(NULL, bufferSize, PROT_READ, MAP_SHARED, f, start + i * 64 - d1);
      if (pBuffer == MAP_FAILED){
        perror("fuick");
      }
      printf("mmap: %08X\n", pBuffer);

      // printf("seek: %llX %llX\n", (uint64_t)start + i * 64, (uint64_t)MirrorStart + i * 64);
      // f.seekg(start + i * 64);
      // printf("seekg: %08X\n", f.fail());

      
      // f.read(pBuffer, bufferSize);
      // if (bufferSize != f.gcount()){
      //   printf("error: %llX %llX\n", bufferSize, f.gcount());
      //   __asm__("int3");        
      // }
      
      // printf("%08X, currentPos: %llx\n", *(uint32_t*)pBuffer, (uint64_t)f.tellg());

      #ifdef __AVX2__        
        procscoop_m256_8(signature, n + nonceStart + i, cacheSize, pBuffer + d1, pData);// Process block AVX2
      #else
        #ifdef __AVX__
          procscoop_m_4(signature, n + nonceStart + i, cacheSize, pBuffer + d1, pData);// Process block AVX
        #else
          procscoop_sph(signature, n + nonceStart + i, cacheSize, pBuffer + d1, pData);// Process block SSE4
        #endif
      #endif

      if (pBuffer){
        munmap(pBuffer, bufferSize);
      }      
    }
  }

  if (f){
    close(f);
  }

  if (pBuffer){
    //delete[] pBuffer;
  }
}

napi_status napi_get_string_from_object(napi_env env, napi_value obj, const char *key, char *value, size_t size){
  napi_status r;

  napi_value result;
  r = napi_get_named_property(env, obj, key, &result);

  size_t cb;
  return napi_get_value_string_utf8(env, result, value, size, &cb);  
}

napi_status napi_get_int64_from_object(napi_env env, napi_value obj, const char *key, int64_t *value){
  napi_status r;

  napi_value result;
  r = napi_get_named_property(env, obj, key, &result);

  return napi_get_value_int64(env, result, value);  
}

napi_status testCallback(napi_env env, arg_example_method *pData){
  napi_status status;

  // napi_handle_scope s1;
  // status = napi_open_handle_scope(env, &s1);
  // printf("napi_open_handle_scope: %08X\n", status);

  napi_value global;
  napi_get_global(env, &global);

  napi_value callback;
  napi_get_named_property(env, global, "fuckall", &callback);
  printf("napi_get_named_property fuckall: %llX\n", callback);

  napi_value r;  
  // status = napi_call_function(env, global, callback, 0, NULL, &r);
  // printf("napi_call_function status: %llX\n", status);
  status = napi_make_callback(env, pData->ctx, global, callback, 0, NULL, &r);

  

  // napi_value callback;
  // status = napi_get_reference_value(env, pData->callback, &callback);
  // printf("napi_get_reference_value: %llX %llX\n", status, callback);

  // status = napi_call_function(env, pData->jsThis, callback, 0, NULL, NULL);
  // printf("status: %llX\n", status);
  
  
  // napi_value result;
  // status = napi_make_callback(env, pData->ctx, pData->jsThis, callback, 0, NULL , &result);
  // printf("napi_make_callback: %llX %llX\n", status, result);

  // napi_value result;
  // status = napi_call_function(env, NULL, callback, 0, NULL, &result);
  // printf("napi_call_function: %08X\n", status);    

  const napi_extended_error_info *error = NULL;
  napi_get_last_error_info(env, &error);
  printf("error: %s\n", error->error_message);

  return napi_ok;
}

napi_value TestResolveAsync(napi_env env, napi_callback_info info) {
  napi_status status;
  
  arg_example_method *pData = new arg_example_method;  
  memset(pData, 0, sizeof(arg_example_method));

  napi_value args[2];
  size_t argc = sizeof(args) / sizeof(napi_value);  
  status = napi_get_cb_info(env, info, &argc, args, &pData->jsThis, nullptr);
  printf("napi_get_cb_info: %llX\n", pData->jsThis);
  
  
  status = napi_get_string_from_object(env, args[0], "generationSignature", pData->generationSignature, sizeof(pData->generationSignature));
  status = napi_get_int64_from_object(env, args[0], "baseTarget", (int64_t*)&pData->baseTarget);
  status = napi_get_int64_from_object(env, args[0], "height", (int64_t*)&pData->height);
  status = napi_get_int64_from_object(env, args[0], "targetDeadline", (int64_t*)&pData->targetDeadline);  
  status = napi_get_string_from_object(env, args[0], "fullPath", pData->path, sizeof(pData->path));  
  status = napi_get_string_from_object(env, args[0], "fileName", pData->name, sizeof(pData->name));
  status = napi_get_int64_from_object(env, args[0], "isPoc2", (int64_t*)&pData->isPoc2);
  
  napi_create_reference(env, args[1], 1, &pData->callback);  

  // const napi_extended_error_info *error = NULL;
  // napi_get_last_error_info(env, &error);
  // printf("error: %s\n", error->error_message);

  printf("pthread_self: %llX\n", pthread_self());
  
  napi_value promise;
  napi_create_promise(env, &pData->deferred, &promise);

  napi_value arg1, arg2;
  napi_create_object(env, &arg1);
  napi_create_object(env, &arg2);
  napi_create_async_work(env, arg1, arg2, [](napi_env env, void* data){
    // if (1){
    //   napi_throw_type_error(env, "123", "haha");
    //   return;
    // }

    printf("pthread_self execute: %llX\n", pthread_self());
    arg_example_method* pData = (arg_example_method*)data;

    // testCallback(env, pData);    
    

    mine(pData);
    printf("execute done.\n");
  
  }, [](napi_env env, napi_status nd_status, void* data){
    printf("completed status: %llX\n", nd_status);
    printf("pthread_self completed: %llX\n", pthread_self());

    napi_status status;
    arg_example_method *pData = (arg_example_method*)data;              

    // testCallback(env, pData);    
    
    if (nd_status != napi_ok){
      const napi_extended_error_info* err_info_ptr;
      status = napi_get_last_error_info(env, &err_info_ptr);

      napi_value error, error_code, error_msg;
      status = napi_create_string_utf8(env, "NAPI_ERROR", NAPI_AUTO_LENGTH, &error_code);
      status = napi_create_string_utf8(env, err_info_ptr->error_message, NAPI_AUTO_LENGTH, &error_msg);

      status = napi_create_error(env, error_code, error_msg, &error);
      status = napi_reject_deferred(env, pData->deferred, error);
    } else {
      napi_value result;      
      napi_create_object(env, &result);

      napi_value resultNonce;
      napi_create_int64(env, pData->result.nonce, &resultNonce);

      napi_value resultDeadline;
      napi_create_int64(env, pData->result.deadline, &resultDeadline);
      
      napi_set_named_property(env, result, "nonce", resultNonce);    
      napi_set_named_property(env, result, "deadline", resultDeadline);    

      napi_resolve_deferred(env, pData->deferred, result);
    }

    if (pData){
      napi_delete_reference(env, pData->callback);
      napi_delete_async_work(env, pData->mainWorker);
      delete pData;
    }

    printf("that's all.\n");
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