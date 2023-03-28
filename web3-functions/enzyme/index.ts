/* eslint-disable @typescript-eslint/naming-convention */
import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { Contract, BigNumber, utils } from "ethers";
import { uniswapQuote, USDC_ADDRESS, WETH_ADDRESS } from "./helpers/uniswap-quote";
const coder = utils.defaultAbiCoder;

const NFT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "function revealNft(uint256 tokenId, string memory tokenURI) external",
  "function tokenURI(uint256 tokenId) public view returns (string memory) ",
  "function tokenIds() public view returns(uint256)",
  "function tokenIdByUser(address) public view returns(uint256)",
  "function nightTimeByToken(uint256) public view returns(bool)",
  "function mint(bool _isNight) external",
  "event MintEvent(uint256 _tokenId)",
];
const NOT_REVEALED_URI = "ipfs://bafyreicwi7sbomz7lu5jozgeghclhptilbvvltpxt3hbpyazz5zxvqh62m/metadata.json";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, secrets, provider } = context;

  // ////// User Arguments
  // const nftAddress = userArgs.nftAddress;
  // if (!nftAddress) throw new Error("Missing userArgs.nftAddress please provide");

  ////// User Storage
  const lastMin = +((await storage.get("lastMin")) ?? "0");
  const lastMax = +((await storage.get("lastMax")) ?? "0");

  //// Secrets
  const ENTRY = +((await secrets.get("ENTRY")) as string);
  const EXIT = +((await secrets.get("EXIT")) as string);

  const VAULT_ABI = [
    "function symbol() public view returns (memory string)",
    "function balanceOf(address) public view returns(uint256)",
  ];
  const COMPT_PROXY_ABI = ["function callOnExtension(address,uint256, bytes calldata) external"];

  const VAULT_ADDRESS = "0x4e35a88965676B2d39e17293568DfCF30ddD7076";
  const COMPT_ADDRESS = "0xa4f70beba3746aa1befa15e6ef67d956eb1682e1";

  const usdcContract = new Contract(USDC_ADDRESS, VAULT_ABI, provider);
  const wethContract = new Contract(WETH_ADDRESS, VAULT_ABI, provider);

  let usdcBalance = await usdcContract.balanceOf(VAULT_ADDRESS);
  let wethBalance = await wethContract.balanceOf(VAULT_ADDRESS);

  console.log("USDC: " + (usdcBalance / 10 ** 6).toString());
  console.log("WETH: " + (wethBalance / 10 ** 18).toString());

  let price = await uniswapQuote(provider);
  let currentPosition = (+wethBalance.toString() / 10 ** 18) * price + +(usdcBalance / 10 ** 6).toString();
  console.log(`Current Position: ${currentPosition}$`);

  const activeTrade = wethBalance == 0 ? false : true;
  console.log(activeTrade ? "Active Trade" : "No trade");

  if (activeTrade) {
    /////  ==== We are IN TRADE ===================== /////
    ///  *****************************************************  ///
    if (lastMax == 0) {
      await storage.set("lastMax", price.toString());
      return { canExec: false, message: "Initiatig Price Exit" };
    }

    let diff = lastMax - price;
    if (diff < 0) {
      ///  *****************************************************  ///
      ///  Price is goind up, update to new max
      ///  *****************************************************  ///
      await storage.set("lastMax", price.toString());
      console.log(`Old lastMax: ${lastMax.toString()}, New lastMax: ${price.toString()}`);
      return { canExec: false, message: "No Trade Exit ---> Price UP " };


    } else if (diff == 0) {
      ///  *****************************************************  ///
      ///  Price not moving doing Nothing
      ///  *****************************************************  ///
      return { canExec: false, message: `No Trade Exit ---> No Price change: ${price.toString()} ` };


    } else if (diff / lastMax < EXIT / 100) {
      ///  *****************************************************  ///
      ///  Price decrease too small, doing Nothing
      ///  *****************************************************  ///
      console.log(`Current lastMax: ${lastMax.toString()}, currentPrice: ${price.toString()}`);
      return {
        canExec: false,
        message: `No Trade Exit ---> Price decrease Small ${((diff / lastMax) * 100).toFixed(2)} %`,
      };

    } else {
      ///  *****************************************************  ///
      ///  Price Decrease Greater than threshold ---> EXIT THE TRADE
      ///  *****************************************************  ///
      await storage.set("lastMin", price.toString());

      console.log(`Trade Exit---> Price Decrease ${((diff / lastMax) * 100).toFixed(2)} greater than ${EXIT} %`);
      let price1 = price * 0.995;
      let minValue = price1 * 0.99;
      let amounToChange = wethBalance;

      let amountMin = Math.floor((+amounToChange.toString() * minValue) / 10 ** 12);
      let data = coder.encode(
        ["address[]", "uint24[]", "uint256", "uint256"],
        [[WETH_ADDRESS, USDC_ADDRESS], ["500"], amounToChange, amountMin]
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
 
      return { canExec: true, callData };
    }
  } else {
    /////  ==== We are NOT in a trade ===================== /////
    ///  *****************************************************  ///
    if (lastMin == 0) {
      await storage.set("lastMin", price.toString());
      return { canExec: false, message: "Initiatig Price Entry" };
    }

    let diff = price - lastMin;

    if (diff < 0) {
      ///  *****************************************************  ///
      ///  Price is going down, update to new min
      ///  *****************************************************  ///
      console.log(`Old lastMin: ${lastMin.toString()}, New lastMin: ${price.toString()}`);
      await storage.set("lastMin", price.toString());
      return { canExec: false, message: "No Trade Entry ---> Price Down " };
    } else if (diff == 0) {
      ///  *****************************************************  ///
      ///  Price not moving doing Nothing
      ///  *****************************************************  ///
      return { canExec: false, message: `No Trade Entry ---> No Price change: ${price.toString()} ` };

    } else if (diff / lastMin < ENTRY / 100) {
      ///  *****************************************************  ///
      ///  Price Increate too small, doing Nothing
      ///  *****************************************************  ///
      console.log(`Current lastMin: ${lastMin.toString()}, currentPrice: ${price.toString()}`);
      return {
        canExec: false,
        message: `No Trade Entry ---> Price Increase too small ${((diff / lastMin) * 100).toFixed(2)} %`,
      };
    } else {
      ///  *****************************************************  ///
      ///  Price Increate Greater than threshold ---> Enter a TRADE
      ///  *****************************************************  ///

      await storage.set("lastMax", price.toString());
      let weth = ((1 / price) * 0.995 * 0.99 * 1e18).toFixed(0);

      let amountMin = BigNumber.from(+weth)
        .mul(usdcBalance)
        .div(1e12);

      let data = coder.encode(
        ["address[]", "uint24[]", "uint256", "uint256"],
        [[USDC_ADDRESS, WETH_ADDRESS], ["500"], usdcBalance, amountMin]
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
    
      return { canExec: true, callData };
    }
  }
});
