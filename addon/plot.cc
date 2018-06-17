#include "miner.h"
#include "shabal.h"

int selecttype = 2;
uint64_t addr = 399604754858490715l;
int noncesperthread = 1;
int startnonce = 810000000;
uint32_t staggersize = 40960;

// char *cache, *wcache, *acache[2];

// Not to be changed below this
#define SCOOP_SIZE      64
#define NUM_SCOOPS      4096
#define NONCE_SIZE      (NUM_SCOOPS * SCOOP_SIZE)

#define HASH_SIZE       32
#define HASH_CAP        4096

char *cache = (char*)calloc( NONCE_SIZE, staggersize );

#define SET_NONCE(gendata, nonce, offset)      \
    xv = (char*)&nonce;                        \
    gendata[NONCE_SIZE + offset]     = xv[7];  \
    gendata[NONCE_SIZE + offset + 1] = xv[6];  \
    gendata[NONCE_SIZE + offset + 2] = xv[5];  \
    gendata[NONCE_SIZE + offset + 3] = xv[4];  \
    gendata[NONCE_SIZE + offset + 4] = xv[3];  \
    gendata[NONCE_SIZE + offset + 5] = xv[2];  \
    gendata[NONCE_SIZE + offset + 6] = xv[1];  \
    gendata[NONCE_SIZE + offset + 7] = xv[0]


namespace NPlot{

int m256nonce(uint64_t addr,
          uint64_t nonce1, uint64_t nonce2, uint64_t nonce3, uint64_t nonce4,
          uint64_t nonce5, uint64_t nonce6, uint64_t nonce7, uint64_t nonce8,
          uint64_t cachepos) {
  char final1[32], final2[32], final3[32], final4[32];
  char final5[32], final6[32], final7[32], final8[32];
  char gendata1[16 + NONCE_SIZE], gendata2[16 + NONCE_SIZE], gendata3[16 + NONCE_SIZE], gendata4[16 + NONCE_SIZE];
  char gendata5[16 + NONCE_SIZE], gendata6[16 + NONCE_SIZE], gendata7[16 + NONCE_SIZE], gendata8[16 + NONCE_SIZE];

  char *xv;

  SET_NONCE(gendata1, addr,  0);

  for (int i = NONCE_SIZE; i <= NONCE_SIZE + 7; ++i) {
    gendata2[i] = gendata1[i];
    gendata3[i] = gendata1[i];
    gendata4[i] = gendata1[i];
    gendata5[i] = gendata1[i];
    gendata6[i] = gendata1[i];
    gendata7[i] = gendata1[i];
    gendata8[i] = gendata1[i];
  }

  SET_NONCE(gendata1, nonce1, 8);
  SET_NONCE(gendata2, nonce2, 8);
  SET_NONCE(gendata3, nonce3, 8);
  SET_NONCE(gendata4, nonce4, 8);
  SET_NONCE(gendata5, nonce5, 8);
  SET_NONCE(gendata6, nonce6, 8);
  SET_NONCE(gendata7, nonce7, 8);
  SET_NONCE(gendata8, nonce8, 8);

  mshabal256_context x;
  int len;

  for (int i = NONCE_SIZE; i;) {
    mshabal256_init(&x);

    len = NONCE_SIZE + 16 - i;
    if (len > HASH_CAP)
      len = HASH_CAP;

    mshabal256(&x, &gendata1[i], &gendata2[i], &gendata3[i], &gendata4[i], &gendata5[i], &gendata6[i], &gendata7[i], &gendata8[i], len);

    i -= HASH_SIZE;
    mshabal256_close(&x,
                      (uint32_t *)&gendata1[i], (uint32_t *)&gendata2[i], (uint32_t *)&gendata3[i], (uint32_t *)&gendata4[i],
                      (uint32_t *)&gendata5[i], (uint32_t *)&gendata6[i], (uint32_t *)&gendata7[i], (uint32_t *)&gendata8[i]);

  }

  mshabal256_init(&x);
  mshabal256(&x, gendata1, gendata2, gendata3, gendata4, gendata5, gendata6, gendata7, gendata8, 16 + NONCE_SIZE);
  mshabal256_close(&x,
                    (uint32_t *)final1, (uint32_t *)final2, (uint32_t *)final3, (uint32_t *)final4,
                    (uint32_t *)final5, (uint32_t *)final6, (uint32_t *)final7, (uint32_t *)final8);

  // XOR with final
  for (int i = 0; i < NONCE_SIZE; i++) {
    gendata1[i] ^= final1[i % 32];
    gendata2[i] ^= final2[i % 32];
    gendata3[i] ^= final3[i % 32];
    gendata4[i] ^= final4[i % 32];
    gendata5[i] ^= final5[i % 32];
    gendata6[i] ^= final6[i % 32];
    gendata7[i] ^= final7[i % 32];
    gendata8[i] ^= final8[i % 32];
  }

  // Sort them:
  // PoC2
  uint64_t revPosition = NONCE_SIZE-SCOOP_SIZE;
  for (int i = 0; i < NONCE_SIZE; i += 64) {
      memmove(&cache[cachepos * 64 +       (uint64_t)i * staggersize], &gendata1[i], 32);
      memmove(&cache[cachepos * 64 +  64 + (uint64_t)i * staggersize], &gendata2[i], 32);
      memmove(&cache[cachepos * 64 + 128 + (uint64_t)i * staggersize], &gendata3[i], 32);
      memmove(&cache[cachepos * 64 + 192 + (uint64_t)i * staggersize], &gendata4[i], 32);
      memmove(&cache[cachepos * 64 + 256 + (uint64_t)i * staggersize], &gendata5[i], 32);
      memmove(&cache[cachepos * 64 + 320 + (uint64_t)i * staggersize], &gendata6[i], 32);
      memmove(&cache[cachepos * 64 + 384 + (uint64_t)i * staggersize], &gendata7[i], 32);
      memmove(&cache[cachepos * 64 + 448 + (uint64_t)i * staggersize], &gendata8[i], 32);
      memmove(&cache[cachepos * 64 +     + 32 + revPosition * staggersize], &gendata1[i+32], 32);
      memmove(&cache[cachepos * 64 +  64 + 32 + revPosition * staggersize], &gendata2[i+32], 32);
      memmove(&cache[cachepos * 64 + 128 + 32 + revPosition * staggersize], &gendata3[i+32], 32);
      memmove(&cache[cachepos * 64 + 192 + 32 + revPosition * staggersize], &gendata4[i+32], 32);
      memmove(&cache[cachepos * 64 + 256 + 32 + revPosition * staggersize], &gendata5[i+32], 32);
      memmove(&cache[cachepos * 64 + 320 + 32 + revPosition * staggersize], &gendata6[i+32], 32);
      memmove(&cache[cachepos * 64 + 384 + 32 + revPosition * staggersize], &gendata7[i+32], 32);
      memmove(&cache[cachepos * 64 + 448 + 32 + revPosition * staggersize], &gendata8[i+32], 32);
      revPosition -= SCOOP_SIZE;
  }
  // PoC1
  // for (int i = 0; i < NONCE_SIZE; i += 64) {
  //   memmove(&cache[cachepos * 64 +       (uint64_t)i * staggersize], &gendata1[i], 64);
  //   memmove(&cache[cachepos * 64 +  64 + (uint64_t)i * staggersize], &gendata2[i], 64);
  //   memmove(&cache[cachepos * 64 + 128 + (uint64_t)i * staggersize], &gendata3[i], 64);
  //   memmove(&cache[cachepos * 64 + 192 + (uint64_t)i * staggersize], &gendata4[i], 64);
  //   memmove(&cache[cachepos * 64 + 256 + (uint64_t)i * staggersize], &gendata5[i], 64);
  //   memmove(&cache[cachepos * 64 + 320 + (uint64_t)i * staggersize], &gendata6[i], 64);
  //   memmove(&cache[cachepos * 64 + 384 + (uint64_t)i * staggersize], &gendata7[i], 64);
  //   memmove(&cache[cachepos * 64 + 448 + (uint64_t)i * staggersize], &gendata8[i], 64);
  // }


  return 0;
}

void nonce(uint64_t addr, uint64_t nonce, uint64_t cachepos) {
  char final[32];
  char gendata[16 + NONCE_SIZE];
  char *xv;
      
  SET_NONCE(gendata, addr,  0);
  SET_NONCE(gendata, nonce, 8);

  shabal_context init_x, x;
  uint32_t len = NONCE_SIZE + 16;

  shabal_init(&init_x, 256);
  for (uint32_t i = NONCE_SIZE; i > 0; i -= HASH_SIZE) {
      memcpy(&x, &init_x, sizeof(init_x));
      len -= i;
      if (len > HASH_CAP)
          len = HASH_CAP;
      shabal(&x, &gendata[i], len);
      shabal_close(&x, 0, 0, &gendata[i - HASH_SIZE]);
  }
      
  shabal_init(&x, 256);
  shabal(&x, gendata, 16 + NONCE_SIZE);
  shabal_close(&x, 0, 0, final);

  // XOR with final
  uint64_t *start = (uint64_t*)gendata;
  uint64_t *fint  = (uint64_t*)&final;

  for (uint32_t i = 0; i < NONCE_SIZE; i += 32) {
      *start ^= fint[0]; start++;
      *start ^= fint[1]; start++;
      *start ^= fint[2]; start++;
      *start ^= fint[3]; start++;
  }	

  // Sort them:
  // PoC2
  uint64_t revPosition = NONCE_SIZE-SCOOP_SIZE;
  for (uint32_t i = 0; i < NONCE_SIZE; i += SCOOP_SIZE){
      memmove(&cache[cachepos * SCOOP_SIZE + (uint64_t)i * staggersize], &gendata[i], 32);
      memmove(&cache[cachepos * SCOOP_SIZE + 32 + revPosition * staggersize], &gendata[i+32], 32);
      revPosition -= SCOOP_SIZE;
  }
  // PoC1
  // for (uint32_t i = 0; i < NONCE_SIZE; i += SCOOP_SIZE)
  //    memmove(&cache[cachepos * SCOOP_SIZE + (uint64_t)i * staggersize], &gendata[i], SCOOP_SIZE);
}

int mnonce(uint64_t addr,
       uint64_t nonce1, uint64_t nonce2, uint64_t nonce3, uint64_t nonce4,
       uint64_t cachepos1, uint64_t cachepos2, uint64_t cachepos3, uint64_t cachepos4) {
  char final1[32], final2[32], final3[32], final4[32];
  char gendata1[16 + NONCE_SIZE], gendata2[16 + NONCE_SIZE], gendata3[16 + NONCE_SIZE], gendata4[16 + NONCE_SIZE];

  char *xv;

  SET_NONCE(gendata1, addr,  0);

  for (int i = NONCE_SIZE; i <= NONCE_SIZE + 7; ++i) {
      gendata2[i] = gendata1[i];
      gendata3[i] = gendata1[i];
      gendata4[i] = gendata1[i];
  }

  SET_NONCE(gendata1, nonce1, 8);
  SET_NONCE(gendata2, nonce2, 8);
  SET_NONCE(gendata3, nonce3, 8);
  SET_NONCE(gendata4, nonce4, 8);

  mshabal_context x;
  int len;

  for (int i = NONCE_SIZE; i > 0; i -= HASH_SIZE) {
    sse4_mshabal_init(&x, 256);

    len = NONCE_SIZE + 16 - i;
    if (len > HASH_CAP)
        len = HASH_CAP;

    sse4_mshabal(&x, &gendata1[i], &gendata2[i], &gendata3[i], &gendata4[i], len);
    sse4_mshabal_close(&x, 0, 0, 0, 0, 0, &gendata1[i - HASH_SIZE], &gendata2[i - HASH_SIZE], &gendata3[i - HASH_SIZE], &gendata4[i - HASH_SIZE]);
  }

  sse4_mshabal_init(&x, 256);
  sse4_mshabal(&x, gendata1, gendata2, gendata3, gendata4, 16 + NONCE_SIZE);
  sse4_mshabal_close(&x, 0, 0, 0, 0, 0, final1, final2, final3, final4);

  // XOR with final
  for (int i = 0; i < NONCE_SIZE; i++) {
      gendata1[i] ^= (final1[i % 32]);
      gendata2[i] ^= (final2[i % 32]);
      gendata3[i] ^= (final3[i % 32]);
      gendata4[i] ^= (final4[i % 32]);
  }

  // Sort them:
  // PoC2
  uint64_t revPosition = NONCE_SIZE-SCOOP_SIZE;
  for (int i = 0; i < NONCE_SIZE; i += 64) {
      memmove(&cache[cachepos1 * 64 + (uint64_t)i * staggersize], &gendata1[i], 32);
      memmove(&cache[cachepos2 * 64 + (uint64_t)i * staggersize], &gendata2[i], 32);
      memmove(&cache[cachepos3 * 64 + (uint64_t)i * staggersize], &gendata3[i], 32);
      memmove(&cache[cachepos4 * 64 + (uint64_t)i * staggersize], &gendata4[i], 32);
      memmove(&cache[cachepos1 * 64 + 32 + revPosition * staggersize], &gendata1[i+32], 32);
      memmove(&cache[cachepos2 * 64 + 32 + revPosition * staggersize], &gendata2[i+32], 32);
      memmove(&cache[cachepos3 * 64 + 32 + revPosition * staggersize], &gendata3[i+32], 32);
      memmove(&cache[cachepos4 * 64 + 32 + revPosition * staggersize], &gendata4[i+32], 32);
      revPosition -= SCOOP_SIZE;
  }

  // PoC1
  // for (int i = 0; i < NONCE_SIZE; i += 64) {
  //     memmove(&cache[cachepos1 * 64 + (uint64_t)i * staggersize], &gendata1[i], 64);
  //     memmove(&cache[cachepos2 * 64 + (uint64_t)i * staggersize], &gendata2[i], 64);
  //     memmove(&cache[cachepos3 * 64 + (uint64_t)i * staggersize], &gendata3[i], 64);
  //     memmove(&cache[cachepos4 * 64 + (uint64_t)i * staggersize], &gendata4[i], 64);
  // }

  return 0;
}

void work_i(void *x_void_ptr) {
  uint64_t i = *(uint64_t *)x_void_ptr;

  uint32_t n;

  if (selecttype == 2) { // AVX2
    for (n = 0; n < noncesperthread; n += 8) {            
      m256nonce(addr,
                (i + n + 0), (i + n + 1), (i + n + 2), (i + n + 3),
                (i + n + 4), (i + n + 5), (i + n + 6), (i + n + 7),
                (i - startnonce + n));
    }
  }
  else {
    for (n = 0; n < noncesperthread; n++) {
      if (selecttype == 1) { // SSE4
        if (n + 4 <= noncesperthread) {
          mnonce(addr,
                  (i + n), (i + n + 1), (i + n + 2), (i + n + 3),
                  (uint64_t)(i - startnonce + n),
                  (uint64_t)(i - startnonce + n + 1),
                  (uint64_t)(i - startnonce + n + 2),
                  (uint64_t)(i - startnonce + n + 3));
          n += 3;
        }
        else {
          printf("SSE4 inefficiency\n");
          nonce(addr,(i + n), (uint64_t)(i - startnonce + n));
        }
      }
      else { // STANDARD
        nonce(addr, (i + n), (uint64_t)(i - startnonce + n));
      }
    }
  }
}

using namespace Napi;

class MineWorker : public AsyncWorker {
private:
  // CALLBACK_CONTEXT _context;

public:
  static void run(const CallbackInfo& info) {
  }
};

Object Init(Env env, Object exports) {

  exports["run"] = Function::New(env, MineWorker::run);
  
  return exports;
}

NODE_API_MODULE(addon, Init)
}