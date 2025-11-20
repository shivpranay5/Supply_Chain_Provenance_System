const hre = require("hardhat");

async function main() {
  console.log("Deploying SupplyChainProvenance contract...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  const SupplyChainProvenance = await hre.ethers.getContractFactory("SupplyChainProvenance");
  const contract = await SupplyChainProvenance.deploy();

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("SupplyChainProvenance deployed to:", contractAddress);

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    './deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\nDeployment info saved to deployment-info.json");
  console.log("\nNext steps:");
  console.log("1. Update the CONTRACT_ADDRESS in frontend/.env");
  console.log("2. Copy the contract ABI from artifacts/contracts/SupplyChainProvenance.sol/SupplyChainProvenance.json");
  console.log("3. Start the frontend: cd frontend && npm start");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
