{       
  "variables": {
    "avx": "",
    "avx2": "",
  },    

  "targets": [
    {    
      "target_name": "miner",
      "sources": [
        "addon/miner.cc",
        "addon/sph_shabal.c",
        "addon/mshabal_sse4.c",
        "addon/shabal64-darwin.s"
      ],
      'include_dirs': ["<!@(node -p \"require('node-addon-api').include\")"],
      'dependencies': ["<!(node -p \"require('node-addon-api').gyp\")"],                
      "defines": [],
      "conditions": [
        ["OS=='mac'", {          
          "xcode_settings": {
            'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
            'CLANG_CXX_LIBRARY': 'libc++',
            'MACOSX_DEPLOYMENT_TARGET': '10.7',            
          },
          "conditions": [
            ["avx2 == 'true'", {
              "sources": ["addon/mshabal256_avx2.c"],
              "xcode_settings": {
                "OTHER_CFLAGS": [
                  "-mavx2"
                ]              
              }              
            }],
            ["avx == 'true'", {
              "sources": ["addon/mshabal_avx1.c"],
              "xcode_settings": {
                "OTHER_CFLAGS": [
                  "-mavx"
                ]              
              }              
            }]
          ]
        }],
        ["OS=='linux'", {          
          'cflags!': [ '-fno-exceptions' ],
          'cflags_cc!': [ '-fno-exceptions' ],
          "conditions": [
            ["avx2 == 'true'", {
              "sources": ["addon/mshabal256_avx2.c"],
              'cflags_cc': [ '-mavx2' ],
            }],
            ["avx == 'true'", {
              "sources": ["addon/mshabal_avx1.c"],
              'cflags_cc': [ '-mavx' ],
            }]
          ]
        }],
        ["OS=='win'", {
          'msvs_settings': {
            'VCCLCompilerTool': { 'ExceptionHandling': 1 },
          },                    
          "conditions": [
            ["avx2 == 'true'", {
              "sources": ["addon/mshabal256_avx2.c"],
              'cflags_cc': [ '-mavx2' ],
            }],
            ["avx == 'true'", {
              "sources": ["addon/mshabal_avx1.c"],
              'cflags_cc': [ '-mavx' ],
            }]
          ]
        }]
      ]
    },

    {
      "target_name": "plot",
      "sources": [
        "addon/plot.cc",
        "addon/mshabal_sse4.c",
        "addon/shabal64-darwin.s"
      ],
      'include_dirs': ["<!@(node -p \"require('node-addon-api').include\")"],
      'dependencies': ["<!(node -p \"require('node-addon-api').gyp\")"],                
      "defines": [],
      'cflags': ['-m64'],
      'cflags_cc': ['-m64'],
      "conditions": [
        ["OS=='mac'", {          
          "xcode_settings": {
            'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
            'CLANG_CXX_LIBRARY': 'libc++',
            'MACOSX_DEPLOYMENT_TARGET': '10.7',            
          },
          "conditions": [
            ["avx2 == 'true'", {
              "sources": ["addon/mshabal256_avx2.c"],
              "xcode_settings": {
                "OTHER_CFLAGS": [
                  "-mavx2"
                ]              
              }              
            }],
            ["avx == 'true'", {
              "sources": ["addon/mshabal_avx1.c"],
              "xcode_settings": {
                "OTHER_CFLAGS": [
                  "-mavx"
                ]              
              }              
            }]
          ]
        }],
        ["OS=='linux'", {          
          'cflags!': [ '-fno-exceptions' ],
          'cflags_cc!': [ '-fno-exceptions' ],
          "conditions": [
            ["avx2 == 'true'", {
              "sources": ["addon/mshabal256_avx2.c"],
              'cflags_cc': [ '-mavx2' ],
            }],
            ["avx == 'true'", {
              "sources": ["addon/mshabal_avx1.c"],
              'cflags_cc': [ '-mavx' ],
            }]
          ]
        }],
        ["OS=='win'", {
          'msvs_settings': {
            'VCCLCompilerTool': { 'ExceptionHandling': 1 },
          },                    
          "conditions": [
            ["avx2 == 'true'", {
              "sources": ["addon/mshabal256_avx2.c"],
              'cflags_cc': [ '-mavx2' ],
            }],
            ["avx == 'true'", {
              "sources": ["addon/mshabal_avx1.c"],
              'cflags_cc': [ '-mavx' ],
            }]
          ]
        }]
      ]
    }
  ]
}