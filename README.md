# xMiner
The xMiner is a client application for mining Burst on a pool.

# Highlights
- AVX + AVX2 support 
- Poc1 and Poc2 compat
- PoC Pool and account data show

# Requirements
- node > 8.11.0
- python = 2.7

# How to use
```
git clone https://github.com/hummer-studio/xminer.git
cd xminer  
npm run build-addon
NODE_ENV=production npm run deploy
```

## Configure
Edit the file: `config/config.js`, replace your `pool_address`, `plots` paths and `deadline`

## Run
`npm run deploy`


then, visit `http://localhost:3000`

# How to enable AVX/AVX2
replace `npm run build-addon` to `npm run build-addon -- --avx` or `npm run build-addon -- --avx2`