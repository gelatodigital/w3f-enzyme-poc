/* eslint-disable @typescript-eslint/naming-convention */
import hre from "hardhat";
import { BigNumber, Contract, utils } from "ethers";

import { uniswapQuote } from "./uniswap-quote";
import { constructSimpleSDK, SwapSide } from "@paraswap/sdk";
import axios from "axios";

async function main() {


  
  const chainId = hre.network.config.chainId as number;
  console.log(chainId);
  const [signer] = await hre.ethers.getSigners();
  const provider = hre.ethers.provider;

  let currentQuote = await uniswapQuote(hre);

  console.log(currentQuote, await provider.getBlockNumber());


  let coder = hre.ethers.utils.defaultAbiCoder;

  const VAULT_ABI = [
    "function symbol() public view returns (memory string)",
    "function balanceOf(address) public view returns(uint256)",
  ];

  // Init GelatoOpsSDK

  const vault = "0x4e35a88965676B2d39e17293568DfCF30ddD7076";
  const usd = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
  const weth2 = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";

  let vaultContract = new Contract(vault, VAULT_ABI, provider);
  let usdcContract = new Contract(usd, VAULT_ABI, provider);
  let wethContract = new Contract(weth2, VAULT_ABI, provider);

  let usdcToken = await usdcContract.balanceOf(vault);
  let wethToken = await wethContract.balanceOf(vault);

  let compt = "0xa4f70beba3746aa1befa15e6ef67d956eb1682e1";


  console.log("USDC: " + usdcToken.toString());
  console.log("WETH: " + wethToken.toString());


  if (+wethToken.toString()==0){


    let weth = ((1/currentQuote)*0.995*0.99*1e18).toFixed(0);

    let amountMin = BigNumber.from(+weth).mul(usdcToken).div(1e12)

    let data = coder.encode(
      ["address[]", "uint24[]", "uint256", "uint256"],
      [
        ["0x2791bca1f2de4661ed88a30c99a7a9449aa84174","0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"],
        ["500"],
        usdcToken,
        amountMin,
      ]
    );
  
    let callArgs = coder.encode(
      ["address", "bytes4", "bytes"],
      ["0xe11f3f7ac24a0839b3a3b13bd7eb5bc5e65e2483", "0x03e38a2b", data]
    );
  
    const iface = new utils.Interface(["function callOnExtension(address,uint256, bytes calldata) external"]);
  
    let callData = iface.encodeFunctionData("callOnExtension", [
      "0x92fCdE09790671cf085864182B9670c77da0884B",
      0,
      callArgs,
    ]);

    let contract = new Contract(
      compt,
      ["function callOnExtension(address,uint256, bytes calldata) external"],
      signer
    );
    let nonce = await signer.getTransactionCount();
    const tx = await contract.callOnExtension("0x92fCdE09790671cf085864182B9670c77da0884B", 0, callArgs,{
      nonce,
      gasPrice:300000000000,
      gasLimit:10000000}
    );
  
    await tx.wait();

  }
  else {
    
  
    

  let price1 = currentQuote * 0.995;
  let minValue = price1 * 0.99;
  let amounToChange = +wethToken.toString();

  amounToChange = wethToken; // +wethToken.toString();

  let amountMin = Math.floor((+amounToChange.toString() * minValue) / 10 ** 12);

  console.log(amountMin);


  let data = coder.encode(
    ["address[]", "uint24[]", "uint256", "uint256"],
    [
      ["0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"],
      ["500"],
      amounToChange,
      amountMin,
    ]
  );

  let callArgs = coder.encode(
    ["address", "bytes4", "bytes"],
    ["0xe11f3f7ac24a0839b3a3b13bd7eb5bc5e65e2483", "0x03e38a2b", data]
  );

  const iface = new utils.Interface(["function callOnExtension(address,uint256, bytes calldata) external"]);

  let callData = iface.encodeFunctionData("callOnExtension", [
    "0x92fCdE09790671cf085864182B9670c77da0884B",
    0,
    callArgs,
  ]);

  console.log(callData)

// return

//   let manager = "0xB65540bBA534E88EB4a5062D0E6519C07063b259";

//   await hre.network.provider.request({
//     method: "hardhat_impersonateAccount",
//     params: [manager],
//   });

//   let maanagerExecutor = await hre.ethers.provider.getSigner(manager);

  let contract = new Contract(
    compt,
    ["function callOnExtension(address,uint256, bytes calldata) external"],
    signer
  );
  let nonce = await signer.getTransactionCount();

    const data2 = await  contract.populateTransaction.callOnExtension("0x92fCdE09790671cf085864182B9670c77da0884B", 0, callArgs)

    console.log(data2)

  // const tx = await contract.callOnExtension("0x92fCdE09790671cf085864182B9670c77da0884B", 0, callArgs,{
  //   nonce,
  //   gasPrice:190000000000,
  //   gasLimit:10000000}
  // );

  // await tx.wait();
  } 
  let shares = await vaultContract.balanceOf("0xb65540bba534e88eb4a5062d0e6519c07063b259");
  let usdcToken2 = await usdcContract.balanceOf(vault);
  wethToken = await wethContract.balanceOf(vault);
 
  console.log("USDC: " + usdcToken2.toString());
  console.log("WETH: " + wethToken.toString());
}

main()
  .then((x) => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
