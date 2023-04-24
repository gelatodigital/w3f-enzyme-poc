import { utils } from "ethers";

import { task } from "hardhat/config";
import { join } from "path";

task("etherscan-verify", "verify").setAction(async ({}, hre) => {
  await hre.run("verify:verify", {
    address: "0xD47c74228038E8542A38e3E7fb1f4a44121eE14E",
    constructorArguments: ["0x288A462c1d2403B86ED2c2F6C51D3B41a794dC54"],
  });
});
