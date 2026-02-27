"use strict";
const path = require("path");
const fs = require("fs");
const dir = __dirname;

function setKey(val) {
  const clean = (val || "").trim().replace(/\s/g, "").replace(/^0x/i, "");
  if (clean.length === 64 && /^[0-9a-fA-F]+$/.test(clean)) {
    process.env.DEPLOYER_PRIVATE_KEY = "0x" + clean;
    return true;
  }
  return false;
}

if (process.env.DEPLOYER_PRIVATE_KEY && setKey(process.env.DEPLOYER_PRIVATE_KEY)) {
  // već postavljeno iz shell-a
} else {
  const envPath = path.join(dir, ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (!line.includes("DEPLOYER_PRIVATE_KEY=")) continue;
      const val = line.split("=", 2)[1];
      if (val != null && setKey(val)) break;
    }
  }
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    const keyPath = path.join(dir, "deploy.key");
    if (fs.existsSync(keyPath)) {
      const keyContent = fs.readFileSync(keyPath, "utf8").trim().replace(/\s/g, "");
      setKey(keyContent);
    }
  }
}
