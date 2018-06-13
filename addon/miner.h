#ifndef X_MINER_H
#define X_MINER_H

#include <napi.h>

#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <sys/mman.h>
#include <sys/time.h>
#include <algorithm>

#include <uv.h>
#include <utility>
#include <unistd.h>

#include "sph_shabal.h"
#include "mshabal.h"
#include "mshabal256.h"
#include "shabal_asm.h"


#ifndef memcpy_s
#define memcpy_s(x1, x2, x3, x4) memcpy(x1, x3, x4)
#endif

#define ENV_CURRENT_HEIGHT "currentHeight"

#define HASH_SIZE             32
#define HASHES_PER_SCOOP      2
#define SCOOP_SIZE            (HASHES_PER_SCOOP * HASH_SIZE)
#define SCOOPS_PER_PLOT       4096 // original 1MB/plot = 16384
#define PLOT_SIZE             (SCOOPS_PER_PLOT * SCOOP_SIZE)

#define MAX_CACHE_SCOOP_SIZE  (1024 * 1024 * 512 / SCOOP_SIZE)
#define POC2_START_BLOCK      502000

#define log(x)                if (_debug) {           \
                                x;                    \
                              }


extern bool _debug;

typedef struct {
  // napi_deferred deferred;

  bool isPoc2;
  std::string path;
  std::string name;
  std::string generationSignature;
  uint64_t height;
  uint64_t baseTarget;
  uint64_t targetDeadline;

  // napi_async_context ctx;
  // napi_ref callback;
  // napi_value jsThis;

  struct {
    uint64_t nonce;
    uint32_t scoop;
    uint64_t deadline;
    uint64_t best;

    size_t readedSize;
    time_t readElapsed;
    time_t calcElapsed;
  } result;

  // napi_async_work mainWorker;
} CALLBACK_CONTEXT;


class CTickTime{
private:
  timeval _tt;

public:
  CTickTime(){
    gettimeofday(&_tt, NULL);
  }

public:
  void reInitialize(){
    gettimeofday(&_tt, NULL);
  }

  time_t tick(){
    timeval t;
    gettimeofday(&t, NULL);

    return (t.tv_sec - _tt.tv_sec) * 1000 + (t.tv_usec - _tt.tv_usec) / 1000;
  }
};

inline void procscoop_callback(CALLBACK_CONTEXT* pData, uint64_t wertung, uint64_t nonce){    

  if (wertung / pData->baseTarget <= pData->targetDeadline){    
    log(printf("procscoop_callback: %s %llu %llu %llu %llu %llu\n", pData->name.c_str(), nonce, wertung, wertung / pData->baseTarget, pData->baseTarget, pData->targetDeadline));
    
    if (wertung < pData->result.best || pData->result.best == 0){
      pData->result.best = wertung;
      pData->result.nonce = nonce;
      pData->result.deadline = wertung / pData->baseTarget;
    }
  } 
}

inline void procscoop_m_4(char *signature, unsigned long long const nonce,
                          unsigned long long const n, char const *const data, CALLBACK_CONTEXT *context) {
  char const *cache;
  char sig0[32 + 64];
  char sig1[32 + 64];
  char sig2[32 + 64];
  char sig3[32 + 64];
  cache = data;

  memcpy(sig0, signature, 32);
  memcpy(sig1, signature, 32);
  memcpy(sig2, signature, 32);
  memcpy(sig3, signature, 32);

  char res0[32];
  char res1[32];
  char res2[32];
  char res3[32];
  unsigned posn;
  mshabal_context x, init_x;
  avx1_mshabal_init(&init_x, 256);

  for (unsigned long long v = 0; v < n; v += 4) {
    memcpy(&sig0[32], &cache[(v + 0) * 64], 64);
    memcpy(&sig1[32], &cache[(v + 1) * 64], 64);
    memcpy(&sig2[32], &cache[(v + 2) * 64], 64);
    memcpy(&sig3[32], &cache[(v + 3) * 64], 64);

    memcpy(&x, &init_x,
           sizeof(init_x));  // optimization: avx1_mshabal_init(&x, 256);
    avx1_mshabal(&x, (const unsigned char *)sig0, (const unsigned char *)sig1,
                 (const unsigned char *)sig2, (const unsigned char *)sig3,
                 64 + 32);
    avx1_mshabal_close(&x, 0, 0, 0, 0, 0, res0, res1, res2, res3);

    unsigned long long *wertung = (unsigned long long *)res0;
    unsigned long long *wertung1 = (unsigned long long *)res1;
    unsigned long long *wertung2 = (unsigned long long *)res2;
    unsigned long long *wertung3 = (unsigned long long *)res3;
    posn = 0;
    if (*wertung1 < *wertung) {
      *wertung = *wertung1;
      posn = 1;
    }
    if (*wertung2 < *wertung) {
      *wertung = *wertung2;
      posn = 2;
    }
    if (*wertung3 < *wertung) {
      *wertung = *wertung3;
      posn = 3;
    }

    procscoop_callback(context, *wertung, nonce + v + posn);

    // if ((*wertung / baseTarget) <= bests[acc].targetDeadline) {
    //   if (bests[acc].nonce == 0 || *wertung < bests[acc].best) {
    //     // EnterCriticalSection(&bestsLock);
    //     // bests[acc].best = *wertung;
    //     // bests[acc].nonce = nonce + v + posn;
    //     // bests[acc].DL = *wertung / baseTarget;
    //     // LeaveCriticalSection(&bestsLock);
    //     // EnterCriticalSection(&sharesLock);
    //     // shares.push_back({file_name, bests[acc].account_id,
    //     // bests[acc].best,
    //     //                   bests[acc].nonce});
    //     // LeaveCriticalSection(&sharesLock);
    //   }
    // }
  }
}

inline void procscoop_m256_8(char *signature, unsigned long long const nonce,
                             unsigned long long const n,
                             char const *const data, CALLBACK_CONTEXT *context) {
  char const *cache;
  char sig0[32 + 64];
  char sig1[32 + 64];
  char sig2[32 + 64];
  char sig3[32 + 64];
  char sig4[32 + 64];
  char sig5[32 + 64];
  char sig6[32 + 64];
  char sig7[32 + 64];
  char res0[32];
  char res1[32];
  char res2[32];
  char res3[32];
  char res4[32];
  char res5[32];
  char res6[32];
  char res7[32];
  cache = data;
  unsigned long long v;

  memmove(sig0, signature, 32);
  memmove(sig1, signature, 32);
  memmove(sig2, signature, 32);
  memmove(sig3, signature, 32);
  memmove(sig4, signature, 32);
  memmove(sig5, signature, 32);
  memmove(sig6, signature, 32);
  memmove(sig7, signature, 32);

  mshabal256_context x, init_x;
  mshabal256_init(&init_x, 256);

  for (v = 0; v < n; v += 8) {
    memmove(&sig0[32], &cache[(v + 0) * 64], 64);
    memmove(&sig1[32], &cache[(v + 1) * 64], 64);
    memmove(&sig2[32], &cache[(v + 2) * 64], 64);
    memmove(&sig3[32], &cache[(v + 3) * 64], 64);
    memmove(&sig4[32], &cache[(v + 4) * 64], 64);
    memmove(&sig5[32], &cache[(v + 5) * 64], 64);
    memmove(&sig6[32], &cache[(v + 6) * 64], 64);
    memmove(&sig7[32], &cache[(v + 7) * 64], 64);

    memcpy(&x, &init_x,
           sizeof(init_x));  // optimization: mshabal256_init(&x, 256);
    mshabal256(&x, (const unsigned char *)sig0, (const unsigned char *)sig1,
               (const unsigned char *)sig2, (const unsigned char *)sig3,
               (const unsigned char *)sig4, (const unsigned char *)sig5,
               (const unsigned char *)sig6, (const unsigned char *)sig7,
               64 + 32);
    mshabal256_close(&x, 0, 0, 0, 0, 0, 0, 0, 0, 0, res0, res1, res2, res3,
                     res4, res5, res6, res7);

    unsigned long long *wertung = (unsigned long long *)res0;
    unsigned long long *wertung1 = (unsigned long long *)res1;
    unsigned long long *wertung2 = (unsigned long long *)res2;
    unsigned long long *wertung3 = (unsigned long long *)res3;
    unsigned long long *wertung4 = (unsigned long long *)res4;
    unsigned long long *wertung5 = (unsigned long long *)res5;
    unsigned long long *wertung6 = (unsigned long long *)res6;
    unsigned long long *wertung7 = (unsigned long long *)res7;
    unsigned posn = 0;
    if (*wertung1 < *wertung) {
      *wertung = *wertung1;
      posn = 1;
    }
    if (*wertung2 < *wertung) {
      *wertung = *wertung2;
      posn = 2;
    }
    if (*wertung3 < *wertung) {
      *wertung = *wertung3;
      posn = 3;
    }
    if (*wertung4 < *wertung) {
      *wertung = *wertung4;
      posn = 4;
    }
    if (*wertung5 < *wertung) {
      *wertung = *wertung5;
      posn = 5;
    }
    if (*wertung6 < *wertung) {
      *wertung = *wertung6;
      posn = 6;
    }
    if (*wertung7 < *wertung) {
      *wertung = *wertung7;
      posn = 7;
    }

    procscoop_callback(context, *wertung, nonce + v + posn);

    // if ((*wertung / baseTarget) <= bests[acc].targetDeadline) {
    //   if (bests[acc].nonce == 0 || *wertung < bests[acc].best) {
    //     // EnterCriticalSection(&bestsLock);
    //     // bests[acc].best = *wertung;
    //     // bests[acc].nonce = nonce + v + posn;
    //     // bests[acc].DL = *wertung / baseTarget;
    //     // LeaveCriticalSection(&bestsLock);
    //     // EnterCriticalSection(&sharesLock);
    //     // shares.push_back({file_name, bests[acc].account_id,
    //     // bests[acc].best,
    //     //                   bests[acc].nonce});
    //     // LeaveCriticalSection(&sharesLock);
    //   }
    // }
  }
}

inline void procscoop_sph(char *signature, const unsigned long long nonce,
                          const unsigned long long n, char const *const data, CALLBACK_CONTEXT *context) {
  char const *cache;
  char sig[32 + 64];
  cache = data;
  char res[32];
  memcpy_s(sig, sizeof(sig), signature, sizeof(char) * 32);

  sph_shabal_context x, init_x;
  sph_shabal256_init(&init_x);

  for (unsigned long long v = 0; v < n; v++) {
    memcpy_s(&sig[32], sizeof(sig) - 32, &cache[v * 64], sizeof(char) * 64);

    memcpy(&x, &init_x,
           sizeof(init_x));  // optimization: sph_shabal256_init(&x);
    sph_shabal256(&x, (const unsigned char *)sig, 64 + 32);
    sph_shabal256_close(&x, res);

    unsigned long long *wertung = (unsigned long long *)res;

    procscoop_callback(context, *wertung, nonce + v);
    // if ((*wertung / baseTarget) <= bests[acc].targetDeadline) {
    //   if (bests[acc].nonce == 0 || *wertung < bests[acc].best) {
    //     // EnterCriticalSection(&bestsLock);
    //     // bests[acc].best = *wertung;
    //     // bests[acc].nonce = nonce + v;
    //     // bests[acc].DL = *wertung / baseTarget;
    //     // LeaveCriticalSection(&bestsLock);
    //     // EnterCriticalSection(&sharesLock);
    //     // shares.push_back({file_name, bests[acc].account_id,
    //     // bests[acc].best,
    //     //                   bests[acc].nonce});
    //     // LeaveCriticalSection(&sharesLock);
    //   }
    // }
  }
}

inline void procscoop_asm(char *signature, const unsigned long long nonce,
                          const unsigned long long n, char const *const data, CALLBACK_CONTEXT *context) {
  char const *cache;
  char sig[32 + 64];
  cache = data;
  char res[32];
  memcpy_s(sig, sizeof(sig), signature, sizeof(char) * 32);
  asm_shabal_context x;
  for (unsigned long long v = 0; v < n; v++) {
    memcpy_s(&sig[32], sizeof(sig) - 32, &cache[v * 64], sizeof(char) * 64);

    asm_shabal_init(&x, 256);
    asm_shabal(&x, (const unsigned char *)sig, 64 + 32);
    asm_shabal_close(&x, 0, 0, res);

    unsigned long long *wertung = (unsigned long long *)res;
    procscoop_callback(context, *wertung, nonce + v);

    // if ((*wertung / baseTarget) <= bests[acc].targetDeadline) {
    //   if (bests[acc].nonce == 0 || *wertung < bests[acc].best) {
    //     // EnterCriticalSection(&bestsLock);
    //     // bests[acc].best = *wertung;
    //     // bests[acc].nonce = nonce + v;
    //     // bests[acc].DL = *wertung / baseTarget;
    //     // LeaveCriticalSection(&bestsLock);
    //     // EnterCriticalSection(&sharesLock);
    //     // shares.push_back({file_name, bests[acc].account_id,
    //     // bests[acc].best,
    //     //                   bests[acc].nonce});
    //     // LeaveCriticalSection(&sharesLock);
    //   }
    // }
  }
}

inline int xdigit(char const digit) {
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

inline size_t xstr2strr(char *buf, size_t const bufsize, const char *const in) {
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

#endif