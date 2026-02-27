// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BioVeraTrace
 * @notice Imutable proof of origin and product journey for Bio Vera platform
 * @dev Stores SHA-256 hashes of batch events on Polygon blockchain
 */
contract BioVeraTrace {

    // ─── Events ───────────────────────────────────────────────────────────────

    event BatchRegistered(
        string indexed batchId,
        bytes32 dataHash,
        uint256 timestamp,
        address registeredBy
    );

    event EventRecorded(
        string indexed batchId,
        EventType eventType,
        bytes32 dataHash,
        uint256 timestamp,
        address recordedBy
    );

    // ─── Types ────────────────────────────────────────────────────────────────

    enum EventType {
        HARVEST,        // Berba
        PACKAGING,      // Pakovanje
        HANDOVER,       // Predaja logistici
        DELIVERY,       // Isporuka kupcu
        CERTIFICATION   // EU sertifikacija
    }

    struct BatchEvent {
        EventType eventType;
        bytes32 dataHash;       // SHA-256 hash of event data
        uint256 timestamp;
        address recordedBy;
        bool exists;
    }

    struct Batch {
        string batchId;
        bytes32 initialHash;    // SHA-256 hash of initial batch data
        uint256 createdAt;
        address createdBy;
        bool exists;
        uint256 eventCount;
    }

    // ─── Storage ──────────────────────────────────────────────────────────────

    mapping(string => Batch) private batches;
    mapping(string => BatchEvent[]) private batchEvents;
    mapping(address => bool) private authorizedBackends;
    address public owner;

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "BioVera: caller is not the owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedBackends[msg.sender] || msg.sender == owner,
            "BioVera: caller is not authorized"
        );
        _;
    }

    modifier batchExists(string calldata batchId) {
        require(batches[batchId].exists, "BioVera: batch does not exist");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        authorizedBackends[msg.sender] = true;
    }

    // ─── Authorization ────────────────────────────────────────────────────────

    function addAuthorizedBackend(address backend) external onlyOwner {
        authorizedBackends[backend] = true;
    }

    function removeAuthorizedBackend(address backend) external onlyOwner {
        authorizedBackends[backend] = false;
    }

    function isAuthorized(address addr) external view returns (bool) {
        return authorizedBackends[addr];
    }

    // ─── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Register a new product batch on the blockchain
     * @param batchId Unique batch identifier (e.g. "VERA-2026-001")
     * @param dataHash SHA-256 hash of batch data (batchId + estateId + harvestDate + productType)
     */
    function registerBatch(
        string calldata batchId,
        bytes32 dataHash
    ) external onlyAuthorized {
        require(!batches[batchId].exists, "BioVera: batch already registered");
        require(bytes(batchId).length > 0, "BioVera: batchId cannot be empty");

        batches[batchId] = Batch({
            batchId: batchId,
            initialHash: dataHash,
            createdAt: block.timestamp,
            createdBy: msg.sender,
            exists: true,
            eventCount: 0
        });

        emit BatchRegistered(batchId, dataHash, block.timestamp, msg.sender);
    }

    /**
     * @notice Record a supply chain event for a batch
     * @param batchId Batch identifier
     * @param eventType Type of event (HARVEST, PACKAGING, etc.)
     * @param dataHash SHA-256 hash of event data
     */
    function recordEvent(
        string calldata batchId,
        EventType eventType,
        bytes32 dataHash
    ) external onlyAuthorized batchExists(batchId) {
        batchEvents[batchId].push(BatchEvent({
            eventType: eventType,
            dataHash: dataHash,
            timestamp: block.timestamp,
            recordedBy: msg.sender,
            exists: true
        }));

        batches[batchId].eventCount++;

        emit EventRecorded(batchId, eventType, dataHash, block.timestamp, msg.sender);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Get batch registration info
     */
    function getBatch(string calldata batchId)
        external
        view
        batchExists(batchId)
        returns (
            bytes32 initialHash,
            uint256 createdAt,
            address createdBy,
            uint256 eventCount
        )
    {
        Batch storage b = batches[batchId];
        return (b.initialHash, b.createdAt, b.createdBy, b.eventCount);
    }

    /**
     * @notice Get all events for a batch
     */
    function getBatchEvents(string calldata batchId)
        external
        view
        batchExists(batchId)
        returns (BatchEvent[] memory)
    {
        return batchEvents[batchId];
    }

    /**
     * @notice Verify that a specific hash matches a batch's registration
     */
    function verifyBatch(string calldata batchId, bytes32 dataHash)
        external
        view
        returns (bool isValid, uint256 registeredAt)
    {
        if (!batches[batchId].exists) return (false, 0);
        Batch storage b = batches[batchId];
        return (b.initialHash == dataHash, b.createdAt);
    }

    /**
     * @notice Check if a batch is registered
     */
    function batchRegistered(string calldata batchId) external view returns (bool) {
        return batches[batchId].exists;
    }
}
