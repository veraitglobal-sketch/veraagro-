// ============================================================
// Bio Vera - Blockchain Service (NestJS)
// ============================================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

const CONTRACT_ABI = [
  'function registerBatch(string calldata batchId, bytes32 dataHash) external',
  'function recordEvent(string calldata batchId, uint8 eventType, bytes32 dataHash) external',
  'function getBatch(string calldata batchId) external view returns (bytes32 initialHash, uint256 createdAt, address createdBy, uint256 eventCount)',
  'function getBatchEvents(string calldata batchId) external view returns (tuple(uint8 eventType, bytes32 dataHash, uint256 timestamp, address recordedBy, bool exists)[])',
  'function verifyBatch(string calldata batchId, bytes32 dataHash) external view returns (bool isValid, uint256 registeredAt)',
  'function batchRegistered(string calldata batchId) external view returns (bool)',
  'event BatchRegistered(string indexed batchId, bytes32 dataHash, uint256 timestamp, address registeredBy)',
  'event EventRecorded(string indexed batchId, uint8 eventType, bytes32 dataHash, uint256 timestamp, address recordedBy)',
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
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private explorerBaseUrl = 'https://polygonscan.com';
  private enabled = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const rpcUrl = this.config.get<string>('POLYGON_RPC_URL');
    const privateKey = this.config.get<string>('BLOCKCHAIN_PRIVATE_KEY');
    const contractAddress = this.config.get<string>('CONTRACT_ADDRESS');

    if (!rpcUrl || !privateKey || !contractAddress) {
      this.logger.warn(
        'Blockchain disabled: set POLYGON_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS to enable',
      );
      return;
    }

    try {
      const network = this.config.get<string>('BLOCKCHAIN_NETWORK', 'polygon');
      this.explorerBaseUrl =
        network === 'polygon'
          ? 'https://polygonscan.com'
          : 'https://mumbai.polygonscan.com';

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        this.wallet,
      );

      const address = await this.wallet.getAddress();
      this.enabled = true;
      this.logger.log('Blockchain service initialized');
      this.logger.log(`Wallet: ${address}`);
      this.logger.log(`Contract: ${contractAddress}`);
    } catch (error) {
      this.logger.error('Failed to initialize blockchain service', error);
      this.enabled = false;
    }
  }

  isEnabled(): boolean {
    return this.enabled && this.contract != null;
  }

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

  createEventHash(data: {
    batchId: string;
    eventType: string;
    timestamp: string;
    locationCode?: string;
  }): string {
    const payload = JSON.stringify(data);
    return '0x' + crypto.createHash('sha256').update(payload).digest('hex');
  }

  async registerBatch(batchData: {
    batchId: string;
    estateId: string;
    harvestDate: string;
    productType: string;
  }): Promise<BatchRegistrationResult> {
    if (!this.contract) {
      throw new Error('BLOCKCHAIN_NOT_CONFIGURED');
    }
    this.logger.log(`Registering batch ${batchData.batchId} on blockchain...`);
    const dataHash = this.createBatchHash(batchData);
    const tx = await this.contract.registerBatch(batchData.batchId, dataHash);
    const receipt = await tx.wait();
    const result: BatchRegistrationResult = {
      batchId: batchData.batchId,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl: `${this.explorerBaseUrl}/tx/${receipt.hash}`,
      timestamp: new Date(),
    };
    this.logger.log(`Batch ${batchData.batchId} registered. TX: ${receipt.hash}`);
    return result;
  }

  async recordEvent(
    batchId: string,
    eventType: ChainEventType,
    eventData: { timestamp: string; locationCode?: string },
  ): Promise<EventRecordResult> {
    if (!this.contract) {
      throw new Error('BLOCKCHAIN_NOT_CONFIGURED');
    }
    const dataHash = this.createEventHash({
      batchId,
      eventType: ChainEventType[eventType],
      timestamp: eventData.timestamp,
      locationCode: eventData.locationCode,
    });
    const tx = await this.contract.recordEvent(batchId, eventType, dataHash);
    const receipt = await tx.wait();
    return {
      batchId,
      eventType,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl: `${this.explorerBaseUrl}/tx/${receipt.hash}`,
      timestamp: new Date(),
    };
  }

  async verifyBatch(
    batchId: string,
    batchData: {
      estateId: string;
      harvestDate: string;
      productType: string;
    },
  ): Promise<BatchVerificationResult> {
    if (!this.contract) {
      throw new Error('BLOCKCHAIN_NOT_CONFIGURED');
    }
    const dataHash = this.createBatchHash({ batchId, ...batchData });
    const [isValid, registeredAtTimestamp] = await this.contract.verifyBatch(
      batchId,
      dataHash,
    );
    const batchInfo = isValid ? await this.contract.getBatch(batchId) : null;
    return {
      batchId,
      isVerified: isValid,
      registeredAt: isValid
        ? new Date(Number(registeredAtTimestamp) * 1000)
        : undefined,
      eventCount: batchInfo ? Number(batchInfo.eventCount) : undefined,
      explorerUrl: `${this.explorerBaseUrl}/address/${await this.contract.getAddress()}`,
    };
  }

  async getBatchJourney(batchId: string) {
    if (!this.contract) {
      throw new Error('BLOCKCHAIN_NOT_CONFIGURED');
    }
    const [batchInfo, events] = await Promise.all([
      this.contract.getBatch(batchId),
      this.contract.getBatchEvents(batchId),
    ]);
    return {
      batchId,
      registeredAt: new Date(Number(batchInfo.createdAt) * 1000),
      eventCount: Number(batchInfo.eventCount),
      events: events.map((e: { eventType: number; timestamp: number; dataHash: string }) => ({
        eventType: ChainEventType[Number(e.eventType)],
        timestamp: new Date(Number(e.timestamp) * 1000),
        txHash: e.dataHash,
      })),
      contractUrl: `${this.explorerBaseUrl}/address/${await this.contract.getAddress()}`,
    };
  }
}
