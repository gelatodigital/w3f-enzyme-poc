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


The task is live on poligon [here](https://beta.app.gelato.network/task/0x17a724c7a9c39674291e220f75254b323051f922a2a11af4da16619784f28648?chainId=137)


