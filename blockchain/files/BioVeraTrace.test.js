const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

// Helper: SHA-256 hash -> bytes32
function sha256ToBytes32(data) {
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  return "0x" + hash;
}

describe("BioVeraTrace", function () {
  let contract;
  let owner;
  let backend;
  let unauthorized;

  const BATCH_ID = "VERA-2026-001";
  const BATCH_DATA = JSON.stringify({
    batchId: "VERA-2026-001",
    estateId: "ESTATE-RS-001",
    harvestDate: "2026-06-15",
    productType: "Organic Raspberry",
    quantityKg: 500,
  });

  beforeEach(async function () {
    [owner, backend, unauthorized] = await ethers.getSigners();

    const BioVeraTrace = await ethers.getContractFactory("BioVeraTrace");
    contract = await BioVeraTrace.deploy();
    await contract.waitForDeployment();
  });

  // ─── Deployment ────────────────────────────────────────────────
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should authorize owner by default", async function () {
      expect(await contract.isAuthorized(owner.address)).to.equal(true);
    });
  });

  // ─── Authorization ──────────────────────────────────────────────
  describe("Authorization", function () {
    it("Should allow owner to add authorized backend", async function () {
      await contract.addAuthorizedBackend(backend.address);
      expect(await contract.isAuthorized(backend.address)).to.equal(true);
    });

    it("Should allow owner to remove authorized backend", async function () {
      await contract.addAuthorizedBackend(backend.address);
      await contract.removeAuthorizedBackend(backend.address);
      expect(await contract.isAuthorized(backend.address)).to.equal(false);
    });

    it("Should NOT allow unauthorized to add backend", async function () {
      await expect(
        contract.connect(unauthorized).addAuthorizedBackend(backend.address)
      ).to.be.revertedWith("BioVera: caller is not the owner");
    });
  });

  // ─── Register Batch ────────────────────────────────────────────
  describe("registerBatch", function () {
    it("Should register a new batch successfully", async function () {
      const dataHash = sha256ToBytes32(BATCH_DATA);

      const tx = await contract.registerBatch(BATCH_ID, dataHash);
      const receipt = await tx.wait();

      expect(receipt.status).to.equal(1);
      expect(await contract.batchRegistered(BATCH_ID)).to.equal(true);
    });

    it("Should emit BatchRegistered event", async function () {
      const dataHash = sha256ToBytes32(BATCH_DATA);

      await expect(contract.registerBatch(BATCH_ID, dataHash))
        .to.emit(contract, "BatchRegistered")
        .withArgs(BATCH_ID, dataHash, await getLatestTimestamp(), owner.address);
    });

    it("Should NOT register duplicate batch", async function () {
      const dataHash = sha256ToBytes32(BATCH_DATA);
      await contract.registerBatch(BATCH_ID, dataHash);

      await expect(
        contract.registerBatch(BATCH_ID, dataHash)
      ).to.be.revertedWith("BioVera: batch already registered");
    });

    it("Should NOT allow unauthorized to register batch", async function () {
      const dataHash = sha256ToBytes32(BATCH_DATA);

      await expect(
        contract.connect(unauthorized).registerBatch(BATCH_ID, dataHash)
      ).to.be.revertedWith("BioVera: caller is not authorized");
    });
  });

  // ─── Record Events ─────────────────────────────────────────────
  describe("recordEvent", function () {
    beforeEach(async function () {
      const dataHash = sha256ToBytes32(BATCH_DATA);
      await contract.registerBatch(BATCH_ID, dataHash);
    });

    it("Should record HARVEST event", async function () {
      const eventData = JSON.stringify({
        batchId: BATCH_ID,
        event: "HARVEST",
        date: "2026-06-15",
        workerCount: 12,
        temperatureC: 18,
      });
      const eventHash = sha256ToBytes32(eventData);

      await contract.recordEvent(BATCH_ID, 0 /* HARVEST */, eventHash);
      const events = await contract.getBatchEvents(BATCH_ID);

      expect(events.length).to.equal(1);
      expect(events[0].eventType).to.equal(0);
      expect(events[0].dataHash).to.equal(eventHash);
    });

    it("Should record full journey: HARVEST -> PACKAGING -> HANDOVER -> DELIVERY", async function () {
      const eventTypes = [0, 1, 2, 3]; // HARVEST, PACKAGING, HANDOVER, DELIVERY

      for (const eventType of eventTypes) {
        const hash = sha256ToBytes32(`event-${eventType}-${Date.now()}`);
        await contract.recordEvent(BATCH_ID, eventType, hash);
      }

      const events = await contract.getBatchEvents(BATCH_ID);
      expect(events.length).to.equal(4);

      const [batch] = await Promise.all([contract.getBatch(BATCH_ID)]);
      expect(batch.eventCount).to.equal(4n);
    });

    it("Should NOT record event for non-existent batch", async function () {
      const hash = sha256ToBytes32("test");

      await expect(
        contract.recordEvent("FAKE-BATCH", 0, hash)
      ).to.be.revertedWith("BioVera: batch does not exist");
    });
  });

  // ─── Verification ──────────────────────────────────────────────
  describe("verifyBatch", function () {
    it("Should verify correct hash", async function () {
      const dataHash = sha256ToBytes32(BATCH_DATA);
      await contract.registerBatch(BATCH_ID, dataHash);

      const [isValid] = await contract.verifyBatch(BATCH_ID, dataHash);
      expect(isValid).to.equal(true);
    });

    it("Should reject wrong hash", async function () {
      const dataHash = sha256ToBytes32(BATCH_DATA);
      await contract.registerBatch(BATCH_ID, dataHash);

      const wrongHash = sha256ToBytes32("tampered data");
      const [isValid] = await contract.verifyBatch(BATCH_ID, wrongHash);
      expect(isValid).to.equal(false);
    });

    it("Should return false for non-existent batch", async function () {
      const [isValid] = await contract.verifyBatch("FAKE-BATCH", sha256ToBytes32("x"));
      expect(isValid).to.equal(false);
    });
  });

  // ─── Helper ────────────────────────────────────────────────────
  async function getLatestTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }
});
