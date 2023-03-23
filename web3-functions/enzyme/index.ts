/* eslint-disable @typescript-eslint/naming-convention */
import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { Contract, BigNumber } from "ethers";
import { Configuration, OpenAIApi } from "openai";
import axios, { AxiosError } from "axios";

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

function generateNftProperties(isNight: boolean) {
  const timeSelected = isNight ? "at night" : "at sunset";

  const description = `A cute robot eating an icecream with Dubai background ${timeSelected} in a cyberpunk art, 3D, video game, and pastel salmon colors`;
  return {
    description,
    attributes: [
      { trait_type: "Time", value: timeSelected },
      { trait_type: "Place", value: "Eth Dubai" },
      { trait_type: "Eating", value: "Gelato" },
      { trait_type: "Powered", value: "Web 3 Functions" },
    ],
  };
}

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, secrets, provider } = context;

  ////// User Arguments
  const nftAddress = userArgs.nftAddress;
  if (!nftAddress) throw new Error("Missing userArgs.nftAddress please provide");

  ////// User Secrets
  const nftStorageApiKey = await secrets.get("NFT_STORAGE_API_KEY");
  if (!nftStorageApiKey) throw new Error("Missing secrets.NFT_STORAGE_API_KEY");

  const openAiApiKey = await secrets.get("OPEN_AI_API_KEY");
  if (!openAiApiKey) throw new Error("Missing secrets.OPEN_AI_API_KEY");

 ////// User Storage
  const lastProcessedId = parseInt((await storage.get("lastProcessedId")) ?? "0");


  const nft = new Contract(nftAddress as string, NFT_ABI, provider);


  const currentTokenId = await nft.tokenIds();
  if (currentTokenId.eq(BigNumber.from(lastProcessedId))) {
    return { canExec: false, message: "No New Tokens" };
  }

  const tokenId = lastProcessedId + 1;
  const tokenURI = await nft.tokenURI(tokenId);
    // Generate NFT properties
    const isNight = await nft.nightTimeByToken(tokenId);
    const nftProps = generateNftProperties(isNight);
    console.log(`Open AI prompt: ${nftProps.description}`);

    // Generate NFT image with OpenAI (Dall-E)


    await storage.set("lastProcessedId", tokenId.toString());

    return {
      canExec: true,
      callData: nft.interface.encodeFunctionData("revealNft", [tokenId]),
    };
  
});
