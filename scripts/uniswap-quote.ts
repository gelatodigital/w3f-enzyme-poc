import { ethers } from 'ethers'
import { computePoolAddress, FeeAmount } from '@uniswap/v3-sdk'
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'

import { toReadableAmount, fromReadableAmount } from './conversion'

import { SupportedChainId, Token } from '@uniswap/sdk-core'

const POOL_FACTORY_CONTRACT_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
const QUOTER_CONTRACT_ADDRESS =  '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'


const WETH_TOKEN = new Token(
  SupportedChainId.POLYGON,
  '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  18,
  'WETH',
  'Wrapped Ether'
)

export const USDC_TOKEN = new Token(
  SupportedChainId.POLYGON,
  '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  6,
  'USDC',
  'USD//C'
)


const   tokens =  {
  in: USDC_TOKEN,
  amountIn: 1000,
  out: WETH_TOKEN,
  poolFee: FeeAmount.MEDIUM,
};

export async function uniswapQuote(hre:any): Promise<number> {
  const quoterContract = new ethers.Contract(
    QUOTER_CONTRACT_ADDRESS,
    Quoter.abi,
    hre.ethers.provider
  )
  const poolConstants = await getPoolConstants(hre)

  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
    poolConstants.token0,
    poolConstants.token1,
    poolConstants.fee,
    fromReadableAmount(
      tokens.amountIn,
      tokens.in.decimals
    ).toString(),
    0
  )

  return 1000*10**18/+quotedAmountOut.toString()
}

async function getPoolConstants(hre:any): Promise<{
  token0: string
  token1: string
  fee: number
}> {
  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: tokens.in,
    tokenB: tokens.out,
    fee: tokens.poolFee,
  })

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    hre.ethers.provider
  )
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ])

  return {
    token0,
    token1,
    fee,
  }
}
