# Blockchain-Based Supply Chain Provenance System

**CSE 540: Engineering Blockchain Applications - Group 3**

## Project Overview

A blockchain-based system for tracking aviation parts across their entire lifecycle, ensuring transparency, authenticity, and compliance in the aviation supply chain.

## Team Members
- **Pranay Reddy Palle** - Planning, Integration, Coordination
- **Satvik Reddy** - Blockchain Logic Development
- **Geethan Sannidhi** - Web Interface & Smart Contract Integration
- **Preethi Kotturu** - IPFS Storage & Off-chain Data
- **Rahul Varma Cherukuri** - Research, Reports & Presentations

## Architecture

### Smart Contract (Solidity)
- **SupplyChainProvenance.sol**: Main contract managing parts, stakeholders, maintenance, and custody transfers
- Roles: Manufacturer, Airline, MRO (Maintenance), Regulator
- Features:
  - Part registration with IPFS certificate storage
  - Maintenance record tracking
  - Custody transfer management
  - Part status updates
  - Regulatory verification

### Frontend (React)
- **Web3 Integration**: Connects to MetaMask wallet
- **Real-time Updates**: Event-driven updates from blockchain
- **Role-based UI**: Different views for different stakeholders
- **Part Tracking**: Complete lifecycle visibility

### Backend
- **Blockchain**: Ethereum/Polygon testnet
- **Off-chain Storage**: IPFS for certificates and maintenance reports
- **Development Tools**: Hardhat, Ethers.js

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension
- Git

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/shivpranay5/Supply_Chain_Provenance_System.git
cd Supply_Chain_Provenance_System
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Compile Smart Contracts
```bash
npx hardhat compile
```

## Running the Demo

### Option 1: Automated Demo Script (Recommended for Interim Demo)

This script demonstrates the complete workflow with sample data:

```bash
# Start local blockchain
npx hardhat node

# In a new terminal, run demo
npx hardhat run scripts/demo.js --network localhost
```

**Demo Flow:**
1. ✅ Deploy contract
2. ✅ Register 4 stakeholders (Manufacturer, Airline, MRO, Regulator)
3. ✅ Manufacturer registers 3 aviation parts
4. ✅ Transfer part from Manufacturer to Airline
5. ✅ Airline installs part
6. ✅ Transfer part to MRO for maintenance
7. ✅ MRO records maintenance activities
8. ✅ Return part to Airline
9. ✅ View complete part history
10. ✅ Regulator verifies authenticity

**Expected Output:**
```
============================================================
Supply Chain Provenance System - Demo Script
============================================================

📋 Deploying contract...
✅ Contract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

============================================================
STEP 1: Register Stakeholders
============================================================
...
```

### Option 2: Interactive Frontend

```bash
# In terminal 1: Start blockchain
npx hardhat node

# In terminal 2: Deploy contract
npx hardhat run scripts/deploy.js --network localhost

# In terminal 3: Start frontend
cd frontend
npm install
npm start
```

Open http://localhost:3000 in your browser with MetaMask installed.

## Testing

Run comprehensive test suite:

```bash
npx hardhat test
```

**Test Coverage:**
- ✅ Stakeholder registration
- ✅ Part registration
- ✅ Maintenance recording
- ✅ Custody transfers
- ✅ Status updates
- ✅ Regulatory verification
- ✅ Access control
- ✅ History tracking

**Expected Output:**
```
  SupplyChainProvenance
    Stakeholder Registration
      ✓ Should register a manufacturer stakeholder
      ✓ Should prevent non-admin from registering stakeholders
      ✓ Should prevent duplicate stakeholder registration
    Part Registration
      ✓ Should allow manufacturer to register a part
      ✓ Should prevent non-manufacturer from registering parts
      ✓ Should assign sequential part IDs
    ...
  
  33 passing (2s)
```

## Smart Contract Functions

### Admin Functions
- `registerStakeholder()` - Register new stakeholders with roles

### Manufacturer Functions
- `registerPart()` - Register new aviation parts
- `transferCustody()` - Transfer parts to other stakeholders

### MRO Functions
- `recordMaintenance()` - Record maintenance activities

### Airline Functions
- `updatePartStatus()` - Update part installation status
- `transferCustody()` - Send parts for maintenance

### Regulator Functions
- `verifyPartAuthenticity()` - Verify parts are genuine

### Query Functions (All Roles)
- `getPartDetails()` - Get part information
- `getMaintenanceHistory()` - View maintenance records
- `getCustodyHistory()` - View ownership transfers
- `getStakeholderParts()` - List parts owned by stakeholder

## Interim Demo Checklist

### ✅ Completed Features
1. **Smart Contract**: Fully implemented with all core functions
2. **Stakeholder Management**: Role-based access control
3. **Part Registration**: Complete with IPFS integration
4. **Custody Tracking**: Full transfer history
5. **Maintenance Records**: Complete logging system
6. **Testing**: Comprehensive test suite (33 tests)
7. **Demo Script**: Automated demonstration workflow

### 🚧 In Progress
1. **Frontend UI**: React interface (90% complete)
2. **IPFS Integration**: File upload/retrieval
3. **QR Code Generation**: For part verification

### 📋 Planned for Final Demo
1. Mobile responsive design
2. Advanced analytics dashboard
3. Multi-language support
4. PDF report generation

## Project Structure

```
Supply_Chain_Provenance_System/
├── contracts/
│   └── SupplyChainProvenance.sol    # Main smart contract
├── scripts/
│   ├── deploy.js                     # Deployment script
│   └── demo.js                       # Demo script
├── test/
│   └── SupplyChainProvenance.test.js # Test suite
├── frontend/
│   ├── src/
│   │   ├── App.js                    # Main React component
│   │   ├── App.css                   # Styling
│   │   └── contracts/                # Contract ABIs
│   └── package.json
├── hardhat.config.js                 # Hardhat configuration
├── package.json                      # Project dependencies
└── README.md                         # This file
```

## Deployment

### Local Network
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### Sepolia Testnet
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Polygon Mumbai Testnet
```bash
npx hardhat run scripts/deploy.js --network polygon_mumbai
```

## Technology Stack

- **Blockchain**: Ethereum / Polygon
- **Smart Contracts**: Solidity 0.8.19
- **Development**: Hardhat
- **Frontend**: React, Web3.js, Ethers.js
- **Storage**: IPFS
- **Testing**: Hardhat Chai Matchers
- **Wallet**: MetaMask

## Key Features

### 1. Immutable Record Keeping
- All part registrations, transfers, and maintenance records are permanently stored on blockchain
- Tamper-proof audit trail for regulatory compliance

### 2. Role-Based Access Control
- Four distinct roles with specific permissions
- Ensures only authorized actions can be performed

### 3. Complete Lifecycle Tracking
- Track parts from manufacturing through installation, maintenance, and retirement
- Full custody chain with timestamps and reasons

### 4. Maintenance History
- Detailed maintenance records with IPFS-stored reports
- Searchable and verifiable by all stakeholders

### 5. Regulatory Compliance
- Dedicated regulator role for verification
- Real-time authenticity checking

## Security Considerations

- ✅ Access control modifiers for all critical functions
- ✅ Input validation and existence checks
- ✅ Reentrancy protection
- ✅ Safe ownership transfers
- ✅ Event emission for audit trail

## Future Enhancements

1. **IoT Integration**: Automatic part condition monitoring
2. **AI/ML Analytics**: Predictive maintenance recommendations
3. **Mobile App**: Native iOS/Android applications
4. **Multi-chain Support**: Cross-chain part tracking
5. **NFT Certificates**: Digital twin representation

## Support

For questions or issues:
- Create an issue in the GitHub repository
- Contact team members via ASU email

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Arizona State University, CSE 540 Course
- Anthropic (Claude AI for development assistance)
- Ethereum Foundation
- IPFS Protocol Labs

---

**Group 3** | CSE 540 | Fall 2024 | Arizona State University
