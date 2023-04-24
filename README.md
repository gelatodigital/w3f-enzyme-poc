# Enzyme PoC

### Summary

This project showcases how to use Gelato Web3 Functions to implement automatic trading strategies using [Enzyme Vaults](https://enzyme.finance/)

Ift includes two different Web3 Functions demo:

1 - Trailing stop and Bounce entry
2 - Purge Uniswapv3 LP positions 

## Trailing stop

We have created a [Gelato Vault](https://app.enzyme.finance/vault/0x4e35a88965676b2d39e17293568dfcf30ddd7076?network=polygon) on Polygon 


We implement two simple trading strategies:

a) Trailing Stop:
   We will push up or stop loss as long as the price goes up.
   When hitting the stop loss we will exist the trade

b) "Bounce Entry" 
   If we are not in a trade and the price start to move up more than a certain threshold we will en ter the trade


The task is live on poligon [here](https://beta.app.gelato.network/task/0x17a724c7a9c39674291e220f75254b323051f922a2a11af4da16619784f28648?chainId=137)


## Purge UniswapV3 LP positions

Please copy the `.env-example`and fill the `PROVIDER_URL=` endpoint with your mainnet rpc for the deployment. 

We will interact with an existing deployed vault on ethereum. The code for the web3 function can be found here

The web3 function takes three params:
- Vault
- Percentage of lost to Purge the LP position, default 10%
- FinalCoin, after LP exit, we will swap the asset to the Finalcoin

We assume the FinalCoin is part of every LP position

### Steps to step the web3 function

1) Deploy the web3 function code too IPFS:

```
npx w3f deploy web3-functions/enzyme/purge-lp/purge-lp.ts
```
and be will get:
```
 ✓ Web3Function deployed to ipfs.
 ✓ CID: QmNS5Gi3FvoSgeQTnTpCwkNxHebDg5iDpW2pd8bkdW3Vzt

To create a task that runs your Web3 Function every minute, visit:
> https://beta.app.gelato.network/new-task?cid=QmNS5Gi3FvoSgeQTnTpCwkNxHebDg5iDpW2pd8bkdW3Vzt
```

2) Create the Task:

Clicking in the above link we will forwarded to the creating task UI where we wil input our 

<p align="left">
  <img src="https://github.com/gelatodigital/enzyme-poc/blob/master/images/task_1.png?raw=true" width="350" title="hover text">
</p>

The contract address in this case is not the vault itself but the comptroller proxy associated with the vault

<p align="left">
  <img src="https://github.com/gelatodigital/enzyme-poc/blob/master/images/task_2.png?raw=true" width="350" title="hover text">
</p>


It is worth noticing that we can see the dedicated msg.sender in the task creation UI.


3) Fund the 1Balance

We wil need to fund 1Balance to pay for the transactions, for the time being we fund 1balance depositing USDC on Polygon

<p align="left">
  <img src="https://github.com/gelatodigital/enzyme-poc/blob/master/images/balance.png?raw=true" width="350" title="hover text">
</p>


4) Declare the dedicaed msg.sender as vault manager