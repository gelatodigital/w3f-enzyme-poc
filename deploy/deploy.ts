// import {HardhatRuntimeEnvironment} from 'hardhat/types';
// import {DeployFunction} from 'hardhat-deploy/types';


// const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
// 	const {deployments, getNamedAccounts} = hre;
// 	const {deploy} = deployments;

// 	const {deployer} = await getNamedAccounts();

//     console.log(deployer)
//     console.log(await hre.ethers.provider.getBalance(deployer))

// 	await deploy('GelatoBotNft', {
// 		from: deployer,
// 		args: [deployer],
// 		log: true,
// 		autoMine: true,
//         gasLimit:1000000, 
//         gasPrice: "190000000000" // speed up deployment on local network (ganache, hardhat), no effect on live networks
// 	});
// };
// export default func;
// func.tags = ['GelatoBotNft'];