// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Aviation Part Provenance (Draft)
 * @author Team
 * @notice Minimal, readable prototype that tracks the lifecycle of aviation parts:
 *         - Part registration by manufacturers
 *         - Custody (ownership) transfers
 *         - Lifecycle status updates (Installed/InService/Removed/Retired)
 *         - Maintenance/inspection logging with IPFS artifacts
 *
 * @dev This contract is intentionally simple to meet draft requirements:
 *      - Emits events for major state changes (useful for UI/indexers)
 *      - Uses RBAC via OpenZeppelin AccessControl
 *      - Guards against duplicate part registration
 *      - Provides basic read helpers for a front-end
 *
 *      SECURITY/PRIVACY (for later iterations):
 *      - Consider storing only hashed identifiers (bytes32 serialHash) instead of raw strings.
 *      - Add pagination or off-chain indexing for large histories.
 *      - Add pausability, upgrade patterns, and more granular role separation if needed.
 *
 *      GAS/SCALABILITY (for later iterations):
 *      - Prefer bytes32 over string for IDs if you can hash off-chain.
 *      - Consider event-only logs with minimal on-chain structs for large-scale deployments.
 */
contract PartLifecycle is AccessControl {
    /*//////////////////////////////////////////////////////////////
                                ROLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Manufacturer can register parts.
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");

    /// @notice Airline/operator can update operational status (install/remove/in service).
    bytes32 public constant AIRLINE_ROLE      = keccak256("AIRLINE_ROLE");

    /// @notice MRO can add maintenance and inspection logs.
    bytes32 public constant MRO_ROLE          = keccak256("MRO_ROLE");

    /// @notice Regulator can log regulatory inspections/attestations (optional).
    bytes32 public constant REGULATOR_ROLE    = keccak256("REGULATOR_ROLE");

    /*//////////////////////////////////////////////////////////////
                               STATUS
    //////////////////////////////////////////////////////////////*/

    /// @notice Simple lifecycle states; extend as needed.
    enum Status { Registered, Installed, InService, Removed, Retired }

    /*//////////////////////////////////////////////////////////////
                              DATA TYPES
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev A single maintenance or inspection record.
     * @param description Short human-readable label (e.g., "A-check", "Bearing replace")
     * @param ipfsHash IPFS CID/URI for detailed report or certification (PDF/JSON)
     * @param timestamp Block timestamp when logged
     * @param performedBy Address that logged the event (MRO/regulator)
     */
    struct MaintenanceRecord {
        string description;
        string ipfsHash;
        uint256 timestamp;
        address performedBy;
    }

    /**
     * @dev Canonical part record stored on-chain.
     *      NOTE: For privacy, consider using a hashed ID in production.
     * @param partId Raw part identifier (prototype-friendly; consider hashing later)
     * @param manufacturer Manufacturer name/code (optional, human-readable)
     * @param currentOwner Address currently holding custodianship
     * @param status Lifecycle status enum
     * @param history Dynamic array of maintenance/inspection entries
     */
    struct Part {
        string partId;
        string manufacturer;
        address currentOwner;
        Status status;
        MaintenanceRecord[] history;
    }

    /*//////////////////////////////////////////////////////////////
                             STORAGE LAYOUT
    //////////////////////////////////////////////////////////////*/

    // Parts keyed by raw string ID (prototype). Prefer a bytes32 hash in production.
    mapping(string => Part) private parts;

    // Simple uniqueness guard to prevent duplicate registration.
    mapping(string => bool) private exists;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a part is first registered.
    event PartRegistered(string indexed partId, address indexed manufacturer, address custodian);

    /// @notice Emitted when custodianship changes hands.
    event CustodyTransferred(string indexed partId, address indexed from, address indexed to);

    /// @notice Emitted for any lifecycle status transition.
    event StatusUpdated(string indexed partId, Status previous, Status current);

    /// @notice Emitted when a maintenance/inspection record is appended.
    event MaintenanceLogged(string indexed partId, string ipfsHash, address indexed actor, uint256 timestamp);

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploy with an admin who can grant roles.
     * @param admin Address that receives DEFAULT_ADMIN_ROLE (can grant other roles)
     */
    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /*//////////////////////////////////////////////////////////////
                           EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Register a new part. Only manufacturers can call.
     * @dev Reverts if the part already exists to satisfy uniqueness.
     *
     * Visibility: external (saves gas vs public when large params)
     * Access: onlyRole(MANUFACTURER_ROLE)
     *
     * @param _partId Raw identifier (prototype). Consider bytes32 hash off-chain later.
     * @param _manufacturer Manufacturer name or code (for readability).
     */
    function registerPart(string memory _partId, string memory _manufacturer)
        external
        onlyRole(MANUFACTURER_ROLE)
    {
        require(!exists[_partId], "Part already exists");

        Part storage p = parts[_partId];
        p.partId = _partId;
        p.manufacturer = _manufacturer;
        p.currentOwner = msg.sender;
        p.status = Status.Registered;

        exists[_partId] = true;

        // Emit both registration and an initial status event for indexers/UI timelines.
        emit PartRegistered(_partId, msg.sender, msg.sender);
        emit StatusUpdated(_partId, Status.Registered, Status.Registered);
    }

    /**
     * @notice Transfer custodianship to a new address.
     * @dev Current owner or admin can transfer. This does not imply legal title—just on-chain custody.
     *
     * @param _partId Target part
     * @param _newOwner Recipient address (must be non-zero off-chain validated)
     */
    function transferOwnership(string memory _partId, address _newOwner) external {
        Part storage p = parts[_partId];
        require(exists[_partId], "Unknown part");
        require(
            msg.sender == p.currentOwner || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        address prev = p.currentOwner;
        p.currentOwner = _newOwner;

        emit CustodyTransferred(_partId, prev, _newOwner);
    }

    /**
     * @notice Update the lifecycle status (e.g., Installed → InService → Removed).
     * @dev Airline or admin can update. In a fuller model, you would enforce valid transitions.
     *
     * @param _partId Target part
     * @param newStatus New lifecycle status
     */
    function updateStatus(string memory _partId, Status newStatus) external {
        require(
            hasRole(AIRLINE_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        Part storage p = parts[_partId];
        require(exists[_partId], "Unknown part");

        Status prev = p.status;
        p.status = newStatus;

        emit StatusUpdated(_partId, prev, newStatus);
    }

    /**
     * @notice Append a maintenance or inspection log.
     * @dev MROs and regulators can log. The detailed report/attestation is stored off-chain on IPFS.
     *
     * @param _partId Target part
     * @param _description Short label for the event (e.g., "Inspection A", "Overhaul")
     * @param _ipfsHash IPFS CID/URI to the report PDF/JSON
     */
    function addMaintenanceLog(
        string memory _partId,
        string memory _description,
        string memory _ipfsHash
    ) external {
        require(
            hasRole(MRO_ROLE, msg.sender) || hasRole(REGULATOR_ROLE, msg.sender),
            "Not authorized"
        );
        Part storage p = parts[_partId];
        require(exists[_partId], "Unknown part");

        p.history.push(
            MaintenanceRecord({
                description: _description,
                ipfsHash: _ipfsHash,
                timestamp: block.timestamp,
                performedBy: msg.sender
            })
        );

        emit MaintenanceLogged(_partId, _ipfsHash, msg.sender, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                              READ HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Lightweight getter for UI: return core data and history length.
     * @param _partId Target part
     * @return partId Raw ID
     * @return manufacturer Manufacturer code/name
     * @return currentOwner Current custodian
     * @return status Lifecycle status
     * @return maintenanceCount Number of maintenance records for this part
     */
    function getPart(string memory _partId)
        external
        view
        returns (
            string memory partId,
            string memory manufacturer,
            address currentOwner,
            Status status,
            uint256 maintenanceCount
        )
    {
        Part storage p = parts[_partId];
        require(exists[_partId], "Unknown part");
        return (p.partId, p.manufacturer, p.currentOwner, p.status, p.history.length);
    }

    /**
     * @notice Fetch a specific maintenance record by index (for simple UIs/tests).
     * @dev This is O(1) access; for large arrays consider pagination patterns.
     * @param _partId Target part
     * @param index Zero-based index into the part's history array
     */
    function getMaintenanceRecord(string memory _partId, uint256 index)
        external
        view
        returns (MaintenanceRecord memory)
    {
        require(exists[_partId], "Unknown part");
        return parts[_partId].history[index];
    }

    /*//////////////////////////////////////////////////////////////
                              DEV NOTES
    //////////////////////////////////////////////////////////////*/
    // - Role management:
    //     grantRole(MANUFACTURER_ROLE, manufacturerAddr)
    //     grantRole(AIRLINE_ROLE, airlineAddr)
    //     grantRole(MRO_ROLE, mroAddr)
    //     grantRole(REGULATOR_ROLE, regulatorAddr)
    //
    // - For production hardening:
    //     * Replace string partId with bytes32 serialHash (hash off-chain).
    //     * Add a mapping(bytes32 => bool) to guard uniqueness.
    //     * Enforce allowed status transitions (e.g., only Installed -> InService).
    //     * Consider Pausable (OZ) for emergency stop.
    //     * Add EIP-712 typed data signatures if you want off-chain attestations.
    //
    // - For front-end:
    //     * Listen to events (PartRegistered, CustodyTransferred, StatusUpdated, MaintenanceLogged).
    //     * Build a timeline view from event logs + getPart()/getMaintenanceRecord().
}
