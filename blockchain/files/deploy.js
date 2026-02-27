const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Bio Vera Blockchain - Deploying BioVeraTrace contract...\n");

  // ─── Get deployer ──────────────────────────────────────────────
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "MATIC\n");

  // ─── Deploy contract ───────────────────────────────────────────
  console.log("📦 Deploying BioVeraTrace...");
  const BioVeraTrace = await ethers.getContractFactory("BioVeraTrace");
  const contract = await BioVeraTrace.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ BioVeraTrace deployed to:", contractAddress);
  console.log("🔗 Network:", (await ethers.provider.getNetwork()).name);
  console.log("📍 Block:", await ethers.provider.getBlockNumber());

  // ─── Save deployment info ──────────────────────────────────────
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    contractAddress,
    deployerAddress: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `deployment-${deploymentInfo.network}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📄 Deployment info saved to deployments/");
  console.log("\n─────────────────────────────────────────────");
  console.log("🎉 Deployment complete!");
  console.log("─────────────────────────────────────────────");
  console.log("\nNext steps:");
  console.log("1. Copy CONTRACT_ADDRESS to your .env:");
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  console.log("2. Start the NestJS backend service");
  console.log("3. Register your first batch!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
