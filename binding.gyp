{
  "targets": [
    {
      "target_name": "miner",
      "sources": [
        "miner_core/miner.cc",
        "miner_core/sph_shabal.c",
        "miner_core/mshabal_avx1.c"
      ],
      "include_dirs": [
      ],
      "defines": [],
      "conditions": [
        ["OS=='mac'", {
          # "sources": ["miner_core/mshabal256_avx2.c"],
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