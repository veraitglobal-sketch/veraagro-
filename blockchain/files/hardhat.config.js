require("./load-env.js");
require("@nomicfoundation/hardhat-toolbox");
const path = require("path");

const raw = (process.env.DEPLOYER_PRIVATE_KEY || "").trim().replace(/^0x/i, "");
const hexOnly = raw.replace(/[^0-9a-fA-F]/g, "");
if (hexOnly.length !== 64) {
  throw new Error(
    "DEPLOYER_PRIVATE_KEY nije postavljen (ima " + hexOnly.length + " hex karaktera, treba 64). " +
    "Pokreni: DEPLOYER_PRIVATE_KEY=tvoj_64_hex_key npm run deploy:amoy   ili stavi key u blockchain/files/deploy.key (jedan red, samo 64 hex znaka)."
  );
}
process.env.DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY.startsWith("0x") ? process.env.DEPLOYER_PRIVATE_KEY : "0x" + hexOnly;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  paths: {
    sources: './contracts',
    tests: './',
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // ─── Local development ───────────────────────────────────────
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    // ─── Polygon Amoy Testnet (za testiranje, besplatno) – Mumbai je ugašen ───────
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      chainId: 80002,
    },

    // ─── Polygon Mainnet (produkcija) ────────────────────────────
    polygon: {
      url: process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-rpc.com",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      chainId: 137,
    },
  },

  // ─── Polygonscan verifikacija (opciono, za public explorer) ───
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
    },
  },

  // ─── Gas reporter (opciono, za optimizaciju) ──────────────────
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
};
