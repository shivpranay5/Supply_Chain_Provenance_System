// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SupplyChainProvenance
 * @dev Aviation parts supply chain tracking system
 */
contract SupplyChainProvenance {
    
    // Enum for stakeholder roles
    enum Role { None, Manufacturer, Airline, MRO, Regulator }
    
    // Enum for part status
    enum PartStatus { Manufactured, InTransit, Installed, InMaintenance, Retired }
    
    // Struct for stakeholders
    struct Stakeholder {
        address walletAddress;
        string name;
        Role role;
        bool isActive;
        uint256 registeredAt;
    }
    
    // Struct for aviation parts
    struct Part {
        uint256 partId;
        string partNumber;
        string serialNumber;
        string partName;
        address manufacturer;
        PartStatus status;
        uint256 manufacturedDate;
        string ipfsHash; // Certificate stored on IPFS
        address currentOwner;
        bool exists;
    }
    
    // Struct for maintenance records
    struct MaintenanceRecord {
        uint256 recordId;
        uint256 partId;
        address mro;
        string maintenanceType;
        uint256 timestamp;
        string ipfsHash; // Maintenance report on IPFS
        string notes;
    }
    
    // Struct for custody transfer
    struct CustodyTransfer {
        uint256 transferId;
        uint256 partId;
        address from;
        address to;
        uint256 timestamp;
        string reason;
    }
    
    // State variables
    address public admin;
    uint256 public partCounter;
    uint256 public maintenanceCounter;
    uint256 public transferCounter;
    
    // Mappings
    mapping(address => Stakeholder) public stakeholders;
    mapping(uint256 => Part) public parts;
    mapping(uint256 => MaintenanceRecord[]) public partMaintenanceHistory;
    mapping(uint256 => CustodyTransfer[]) public partCustodyHistory;
    mapping(address => uint256[]) public stakeholderParts;
    
    // Events
    event StakeholderRegistered(address indexed stakeholder, string name, Role role);
    event PartRegistered(uint256 indexed partId, string partNumber, address indexed manufacturer);
    event MaintenanceRecorded(uint256 indexed partId, uint256 recordId, address indexed mro);
    event CustodyTransferred(uint256 indexed partId, address indexed from, address indexed to);
    event PartStatusUpdated(uint256 indexed partId, PartStatus newStatus);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyManufacturer() {
        require(stakeholders[msg.sender].role == Role.Manufacturer, "Only manufacturers can perform this action");
        _;
    }
    
    modifier onlyMRO() {
        require(stakeholders[msg.sender].role == Role.MRO, "Only MROs can perform this action");
        _;
    }
    
    modifier onlyAirline() {
        require(stakeholders[msg.sender].role == Role.Airline, "Only airlines can perform this action");
        _;
    }
    
    modifier onlyRegulator() {
        require(stakeholders[msg.sender].role == Role.Regulator, "Only regulators can perform this action");
        _;
    }
    
    modifier partExists(uint256 _partId) {
        require(parts[_partId].exists, "Part does not exist");
        _;
    }
    
    modifier onlyPartOwner(uint256 _partId) {
        require(parts[_partId].currentOwner == msg.sender, "Only part owner can perform this action");
        _;
    }
    
    // Constructor
    constructor() {
        admin = msg.sender;
        partCounter = 0;
        maintenanceCounter = 0;
        transferCounter = 0;
    }
    
    /**
     * @dev Register a new stakeholder
     */
    function registerStakeholder(
        address _stakeholderAddress,
        string memory _name,
        Role _role
    ) public onlyAdmin {
        require(_role != Role.None, "Invalid role");
        require(!stakeholders[_stakeholderAddress].isActive, "Stakeholder already registered");
        
        stakeholders[_stakeholderAddress] = Stakeholder({
            walletAddress: _stakeholderAddress,
            name: _name,
            role: _role,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        emit StakeholderRegistered(_stakeholderAddress, _name, _role);
    }
    
    /**
     * @dev Register a new part (Manufacturer only)
     */
    function registerPart(
        string memory _partNumber,
        string memory _serialNumber,
        string memory _partName,
        string memory _ipfsHash
    ) public onlyManufacturer returns (uint256) {
        partCounter++;
        
        parts[partCounter] = Part({
            partId: partCounter,
            partNumber: _partNumber,
            serialNumber: _serialNumber,
            partName: _partName,
            manufacturer: msg.sender,
            status: PartStatus.Manufactured,
            manufacturedDate: block.timestamp,
            ipfsHash: _ipfsHash,
            currentOwner: msg.sender,
            exists: true
        });
        
        stakeholderParts[msg.sender].push(partCounter);
        
        emit PartRegistered(partCounter, _partNumber, msg.sender);
        return partCounter;
    }
    
    /**
     * @dev Record maintenance (MRO only)
     */
    function recordMaintenance(
        uint256 _partId,
        string memory _maintenanceType,
        string memory _ipfsHash,
        string memory _notes
    ) public onlyMRO partExists(_partId) returns (uint256) {
        maintenanceCounter++;
        
        MaintenanceRecord memory newRecord = MaintenanceRecord({
            recordId: maintenanceCounter,
            partId: _partId,
            mro: msg.sender,
            maintenanceType: _maintenanceType,
            timestamp: block.timestamp,
            ipfsHash: _ipfsHash,
            notes: _notes
        });
        
        partMaintenanceHistory[_partId].push(newRecord);
        
        emit MaintenanceRecorded(_partId, maintenanceCounter, msg.sender);
        return maintenanceCounter;
    }
    
    /**
     * @dev Transfer custody of a part
     */
    function transferCustody(
        uint256 _partId,
        address _to,
        string memory _reason
    ) public partExists(_partId) onlyPartOwner(_partId) {
        require(stakeholders[_to].isActive, "Recipient is not a registered stakeholder");
        require(_to != msg.sender, "Cannot transfer to yourself");
        
        transferCounter++;
        
        CustodyTransfer memory newTransfer = CustodyTransfer({
            transferId: transferCounter,
            partId: _partId,
            from: msg.sender,
            to: _to,
            timestamp: block.timestamp,
            reason: _reason
        });
        
        partCustodyHistory[_partId].push(newTransfer);
        
        // Update part owner
        parts[_partId].currentOwner = _to;
        parts[_partId].status = PartStatus.InTransit;
        
        // Update stakeholder parts
        stakeholderParts[_to].push(_partId);
        
        emit CustodyTransferred(_partId, msg.sender, _to);
    }
    
    /**
     * @dev Update part status
     */
    function updatePartStatus(
        uint256 _partId,
        PartStatus _newStatus
    ) public partExists(_partId) onlyPartOwner(_partId) {
        parts[_partId].status = _newStatus;
        emit PartStatusUpdated(_partId, _newStatus);
    }
    
    /**
     * @dev Get part details
     */
    function getPartDetails(uint256 _partId) 
        public 
        view 
        partExists(_partId) 
        returns (
            string memory partNumber,
            string memory serialNumber,
            string memory partName,
            address manufacturer,
            PartStatus status,
            uint256 manufacturedDate,
            string memory ipfsHash,
            address currentOwner
        ) 
    {
        Part memory part = parts[_partId];
        return (
            part.partNumber,
            part.serialNumber,
            part.partName,
            part.manufacturer,
            part.status,
            part.manufacturedDate,
            part.ipfsHash,
            part.currentOwner
        );
    }
    
    /**
     * @dev Get maintenance history for a part
     */
    function getMaintenanceHistory(uint256 _partId) 
        public 
        view 
        partExists(_partId) 
        returns (MaintenanceRecord[] memory) 
    {
        return partMaintenanceHistory[_partId];
    }
    
    /**
     * @dev Get custody history for a part
     */
    function getCustodyHistory(uint256 _partId) 
        public 
        view 
        partExists(_partId) 
        returns (CustodyTransfer[] memory) 
    {
        return partCustodyHistory[_partId];
    }
    
    /**
     * @dev Get parts owned by a stakeholder
     */
    function getStakeholderParts(address _stakeholder) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return stakeholderParts[_stakeholder];
    }
    
    /**
     * @dev Get stakeholder details
     */
    function getStakeholderDetails(address _stakeholder) 
        public 
        view 
        returns (
            string memory name,
            Role role,
            bool isActive,
            uint256 registeredAt
        ) 
    {
        Stakeholder memory stakeholder = stakeholders[_stakeholder];
        return (
            stakeholder.name,
            stakeholder.role,
            stakeholder.isActive,
            stakeholder.registeredAt
        );
    }
    
    /**
     * @dev Verify part authenticity (Regulator function)
     */
    function verifyPartAuthenticity(uint256 _partId) 
        public 
        view 
        onlyRegulator 
        partExists(_partId) 
        returns (bool) 
    {
        return parts[_partId].exists && 
               stakeholders[parts[_partId].manufacturer].role == Role.Manufacturer;
    }
}
