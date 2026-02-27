// ============================================================
// Bio Vera - Blockchain Service (NestJS)
// Fajl: src/blockchain/blockchain.service.ts
// ============================================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

// ABI - samo funkcije koje koristimo
const CONTRACT_ABI = [
  "function registerBatch(string calldata batchId, bytes32 dataHash) external",
  "function recordEvent(string calldata batchId, uint8 eventType, bytes32 dataHash) external",
  "function getBatch(string calldata batchId) external view returns (bytes32 initialHash, uint256 createdAt, address createdBy, uint256 eventCount)",
  "function getBatchEvents(string calldata batchId) external view returns (tuple(uint8 eventType, bytes32 dataHash, uint256 timestamp, address recordedBy, bool exists)[])",
  "function verifyBatch(string calldata batchId, bytes32 dataHash) external view returns (bool isValid, uint256 registeredAt)",
  "function batchRegistered(string calldata batchId) external view returns (bool)",
  "event BatchRegistered(string indexed batchId, bytes32 dataHash, uint256 timestamp, address registeredBy)",
  "event EventRecorded(string indexed batchId, uint8 eventType, bytes32 dataHash, uint256 timestamp, address recordedBy)",
];

export enum ChainEventType {
  HARVEST = 0,
  PACKAGING = 1,
  HANDOVER = 2,
  DELIVERY = 3,
  CERTIFICATION = 4,
}

export interface BatchRegistrationResult {
  batchId: string;
  txHash: string;
  blockNumber: number;
  explorerUrl: string;
  timestamp: Date;
}

export interface EventRecordResult {
  batchId: string;
  eventType: ChainEventType;
  txHash: string;
  blockNumber: number;
  explorerUrl: string;
  timestamp: Date;
}

export interface BatchVerificationResult {
  batchId: string;
  isVerified: boolean;
  registeredAt?: Date;
  eventCount?: number;
  explorerUrl: string;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private explorerBaseUrl: string;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize() {
    try {
      const rpcUrl = this.config.get<string>('POLYGON_RPC_URL');
      const privateKey = this.config.get<string>('BLOCKCHAIN_PRIVATE_KEY');
      const contractAddress = this.config.get<string>('CONTRACT_ADDRESS');
      const network = this.config.get<string>('BLOCKCHAIN_NETWORK', 'polygon');

      this.explorerBaseUrl = network === 'polygon'
        ? 'https://polygonscan.com'
        : 'https://mumbai.polygonscan.com';

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(contractAddress, CONTRACT_ABI, this.wallet);

      const address = await this.wallet.getAddress();
      this.logger.log(`✅ Blockchain service initialized`);
      this.logger.log(`📋 Wallet: ${address}`);
      this.logger.log(`📄 Contract: ${contractAddress}`);
    } catch (error) {
      this.logger.error('❌ Failed to initialize blockchain service', error);
      throw error;
    }
  }

  // ─── Hash helpers ────────────────────────────────────────────

  /**
   * Creates SHA-256 hash of batch data for blockchain storage
   * Only hashes non-sensitive fields
   */
  createBatchHash(data: {
    batchId: string;
    estateId: string;
    harvestDate: string;
    productType: string;
  }): string {
    const payload = JSON.stringify({
      batchId: data.batchId,
      estateId: data.estateId,
      harvestDate: data.harvestDate,
      productType: data.productType,
    });
    return '0x' + crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Creates SHA-256 hash of a supply chain event
   */
  createEventHash(data: {
    batchId: string;
    eventType: string;
    timestamp: string;
    locationCode?: string;
  }): string {
    const payload = JSON.stringify(data);
    return '0x' + crypto.createHash('sha256').update(payload).digest('hex');
  }

  // ─── Write functions ─────────────────────────────────────────

  /**
   * Register a new batch on the blockchain
   * Call this when a farmer registers a new harvest batch
   */
  async registerBatch(batchData: {
    batchId: string;
    estateId: string;
    harvestDate: string;
    productType: string;
  }): Promise<BatchRegistrationResult> {
    this.logger.log(`Registering batch ${batchData.batchId} on blockchain...`);

    const dataHash = this.createBatchHash(batchData);

    try {
      const tx = await this.contract.registerBatch(batchData.batchId, dataHash);
      const receipt = await tx.wait();

      const result: BatchRegistrationResult = {
        batchId: batchData.batchId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        explorerUrl: `${this.explorerBaseUrl}/tx/${receipt.hash}`,
        timestamp: new Date(),
      };

      this.logger.log(`✅ Batch ${batchData.batchId} registered. TX: ${receipt.hash}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to register batch ${batchData.batchId}`, error);
      throw error;
    }
  }

  /**
   * Record a supply chain event (harvest, packaging, handover, delivery)
   */
  async recordEvent(
    batchId: string,
    eventType: ChainEventType,
    eventData: {
      timestamp: string;
      locationCode?: string;
    }
  ): Promise<EventRecordResult> {
    this.logger.log(`Recording ${ChainEventType[eventType]} event for batch ${batchId}...`);

    const dataHash = this.createEventHash({
      batchId,
      eventType: ChainEventType[eventType],
      timestamp: eventData.timestamp,
      locationCode: eventData.locationCode,
    });

    try {
      const tx = await this.contract.recordEvent(batchId, eventType, dataHash);
      const receipt = await tx.wait();

      const result: EventRecordResult = {
        batchId,
        eventType,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        explorerUrl: `${this.explorerBaseUrl}/tx/${receipt.hash}`,
        timestamp: new Date(),
      };

      this.logger.log(`✅ Event recorded. TX: ${receipt.hash}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to record event for batch ${batchId}`, error);
      throw error;
    }
  }

  // ─── Read / Verify functions ─────────────────────────────────

  /**
   * Verify a batch - used in QR code verification page
   */
  async verifyBatch(
    batchId: string,
    batchData: {
      estateId: string;
      harvestDate: string;
      productType: string;
    }
  ): Promise<BatchVerificationResult> {
    const dataHash = this.createBatchHash({ batchId, ...batchData });

    try {
      const [isValid, registeredAtTimestamp] = await this.contract.verifyBatch(batchId, dataHash);
      const batchInfo = isValid ? await this.contract.getBatch(batchId) : null;

      return {
        batchId,
        isVerified: isValid,
        registeredAt: isValid ? new Date(Number(registeredAtTimestamp) * 1000) : undefined,
        eventCount: batchInfo ? Number(batchInfo.eventCount) : undefined,
        explorerUrl: `${this.explorerBaseUrl}/address/${await this.contract.getAddress()}`,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to verify batch ${batchId}`, error);
      throw error;
    }
  }

  /**
   * Get full journey of a batch from blockchain
   */
  async getBatchJourney(batchId: string) {
    try {
      const [batchInfo, events] = await Promise.all([
        this.contract.getBatch(batchId),
        this.contract.getBatchEvents(batchId),
      ]);

      return {
        batchId,
        registeredAt: new Date(Number(batchInfo.createdAt) * 1000),
        eventCount: Number(batchInfo.eventCount),
        events: events.map((e: any) => ({
          eventType: ChainEventType[Number(e.eventType)],
          timestamp: new Date(Number(e.timestamp) * 1000),
          txHash: e.dataHash, // data hash, not tx hash
        })),
        contractUrl: `${this.explorerBaseUrl}/address/${await this.contract.getAddress()}`,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get journey for batch ${batchId}`, error);
      throw error;
    }
  }
}
