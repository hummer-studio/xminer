{
  "targets": [
    {
      "target_name": "miner",
      "sources": [
        "addon/miner.cc",
        "addon/sph_shabal.c",
        "addon/mshabal_avx1.c"
      ],
      'include_dirs': ["<!@(node -p \"require('node-addon-api').include\")"],
      'dependencies': ["<!(node -p \"require('node-addon-api').gyp\")"],      
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'xcode_settings': {
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'CLANG_CXX_LIBRARY': 'libc++',
        'MACOSX_DEPLOYMENT_TARGET': '10.7',
      },
      'msvs_settings': {
        'VCCLCompilerTool': { 'ExceptionHandling': 1 },
      },
      
      "defines": [],
      "conditions": [
        ["OS=='mac'", {
          # "sources": ["addon/mshabal256_avx2.c"],
          "xcode_settings": {
            "OTHER_CFLAGS": [
              # "-mavx2"
              ]
            }
          }
        ]
      ]
    }
  ]
}