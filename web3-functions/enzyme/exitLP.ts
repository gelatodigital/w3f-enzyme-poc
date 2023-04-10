/* eslint-disable @typescript-eslint/naming-convention */
import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { Contract, BigNumber, utils } from "ethers";
import { uniswapQuote, USDC_ADDRESS, WETH_ADDRESS } from "./helpers/uniswap-quote";
import { gql } from "graphql-tag";
import { request } from "graphql-request";
import { erc20 } from "./abis/lp_abis";

const coder = utils.defaultAbiCoder;

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, secrets, provider } = context;

  const UNIV3_LP_POSITIONS_ADDRESSE = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
  const UNIV3_LP_POSITIONS_ABI = ["function balanceOf(address) returns(uint256)"];

 // const storedLpPositions = JSON.parse((await storage.get("storedLpPositions")) ?? "{}");
  const storedLpPositions:{[key:string]: number} =  {"464730":0,"481083":32597.79553038418};

  ///// Querying current LP positions
  const query = gql`
    query UniswapV3VaultLiquidityPositions($deployment: Deployment!, $vaultId: Address!) {
      uniswapV3VaultLiquidityPositions(deployment: $deployment, vaultId: $vaultId) {
        nfts {
          externalPositionId
          feeTier
          id
          liquidity
          nftTokenUri
          poolAddress
          poolCurrentTick
          tickLower
          tickUpper
          amount0
          amount1
          token0
          token1
          __typename
        }
        __typename
      }
    }
  `;

  let variables = { deployment: "ethereum", vaultId: "0x689be004eb78e731492e733b68e35911b3ad2c53" };

  const api = "https://app.enzyme.finance/api/graphql";
  const data: any = await request(api, query, variables);

  if (data.uniswapV3VaultLiquidityPositions.length == 0 || data.uniswapV3VaultLiquidityPositions[0].nfts.length == 0) {
    return { canExec: false, message: "No LP availables" };
  }

  const lookUpTokens: { [key: string]: { price: number; decimals: number } } = {};

  const lpPositions = data.uniswapV3VaultLiquidityPositions[0].nfts;

  for (const nft of lpPositions) {
    if (lookUpTokens[nft.token0] == undefined) {
      const erc20Contract = new Contract(nft.token0, erc20, provider);
      const decimals = await erc20Contract.decimals();
      lookUpTokens[nft.token0] = { price: 0, decimals: +decimals.toString() };
    }

    if (lookUpTokens[nft.token1] == undefined) {
      const erc20Contract = new Contract(nft.token1, erc20, provider);
      const decimals = await erc20Contract.decimals();
      lookUpTokens[nft.token1] = { price: 0, decimals: +decimals.toString() };
    }
    console.log("////// NEXT ////");
  }

  /////
  const queryAsset = gql`
    query AssetPrices($network: Deployment!, $currency: Currency!) {
      assetPrices(network: $network, currency: $currency) {
        id
        price
        change24h
        __typename
      }
    }
  `;

  const assetVariables = { currency: "usd", network: "ethereum" };

  const data2: any = await request(api, queryAsset, assetVariables);

  for (const assetPrice of data2.assetPrices) {
    if (lookUpTokens[assetPrice.id] !== undefined) {
      lookUpTokens[assetPrice.id].price = assetPrice.price;
    }
  }

  //// Assign values to current LP Positions
  for (const nft of lpPositions) {
    nft.value =
      lookUpTokens[nft.token0].price * (nft.amount0 / 10 ** lookUpTokens[nft.token0].decimals) +
      lookUpTokens[nft.token1].price * (nft.amount1 / 10 ** lookUpTokens[nft.token1].decimals);
  }

  //// Loop over stored positions and delete exited positions
  const storedLpArray = Object.keys(storedLpPositions) as Array<string>
  for (const storedLpKey of storedLpArray) {
    if (lpPositions.filter((fil:any)=> fil.id == storedLpKey).length == 0) {
        delete storedLpPositions[storedLpKey]
    }
  } 



  /// Loop over current lp positions and compare values with store positions
  let positionToExit:{id:string, porcentage:number, callData:string} | undefined;

  for (const lpPosition of lpPositions) {

    const prevValue =  storedLpPositions[lpPosition.id]

    if (prevValue == undefined) {
        storedLpPositions[lpPosition.id] = lpPosition.value;
    } else {

     const diff =  ((prevValue-lpPosition.value)/prevValue)*100

     if (lpPosition.value > prevValue) {
        storedLpPositions[lpPosition.id] = lpPosition.value;
     } else if (diff >= 10) {
    
        if (positionToExit == undefined){
            console.log(+lpPosition.amount0)
           // console.log(utils.hexlify(+lpPosition.amount0))
            let amountMin0 = (+lpPosition.amount0)*(1- 0.001)
            let amountMin0Big = utils.parseEther((amountMin0 / 10 ** lookUpTokens[lpPosition.token0].decimals).toString())
      
            let amountMin1 = (+lpPosition.amount1)*(1- 0.001)
            let amountMin1Big = utils.parseEther((amountMin1 / 10 ** lookUpTokens[lpPosition.token1].decimals).toString())
      
            let data = coder.encode(
                ["uint256", "uint128", "uint256", "uint256"],
                [lpPosition.id, lpPosition.liquidity, amountMin0Big, amountMin1Big]
              );
              let callArgs = coder.encode(
                ["address", "uint256", "bytes"],
                [lpPosition.externalPositionId,4, data]
              );
              const iface = new utils.Interface(["function callOnExtension(address,uint256, bytes calldata) external"]);
              let callData = iface.encodeFunctionData("callOnExtension", [
                "0x1e3da40f999cf47091f869ebac477d84b0827cf4",
                1,
                callArgs,
              ]);
        
            positionToExit = { id: lpPosition.id, porcentage: diff, callData }
        }
     } 
    }
  }

  ///// Store current Positions

  await storage.set("storedLpPositions", JSON.stringify(storedLpPositions));

  console.log(positionToExit)

  if (positionToExit == undefined) {
    return { canExec: false, message: "No LP positions to Exit" };
  } else {
    console.log(`Exiting position Id: ${positionToExit.id}, Decrease: ${positionToExit.porcentage.toFixed(2)}%`)
    return { canExec:true, callData: positionToExit.callData}
  }


});
