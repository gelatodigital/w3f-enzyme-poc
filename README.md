# Enzyme PoC

## Summary

This project showcases how to use Gelato Web3 Functions to implement automatic trading strategies usind [Enzyme Vaults](https://enzyme.finance/)

We have created a [Gelato Vault](https://app.enzyme.finance/vault/0x4e35a88965676b2d39e17293568dfcf30ddd7076?network=polygon) on Polygon 


We implement two simple trading strategies:

1) Trailing Stop:
   We will push up or stop loss as long as the price goes up.
   When hitting the stop loss we will exist the trade

2) "Bounce Entry" 
   If we are not in a trade and the price start to move up more than a certain threshold we will en ter the trade


The task is live on poligon [here]()


## How to run

1. Install project dependencies:
```
yarn install
```

2. Create a `.env` file with your private config:
```
cp .env.example .env
```
You will need to create free accounts and get Api Keys from [OpenAI](https://platform.openai.com/) and [Nft.Storage](https://nft.storage/)

3. Test the Open AI NFT web3 function on polygon:
```
npx w3f test web3-functions/open-ai-nft/index.ts --show-logs --user-args=nftAddress:0xd47c74228038e8542a38e3e7fb1f4a44121ee14e
```

## Deploy your smart contract and web3 function
```
yarn run deploy --network goerli
```

## Verify
```
npx hardhat verify CONTRACT_ADDRESS DEDICATED_MSG_SENDER --network goerli
```
```ts
npx hardhat node --network hardhat 
```

```ts
npx hardhat run  scripts/deploy-contract.ts
```