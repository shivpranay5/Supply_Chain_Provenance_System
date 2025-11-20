#!/bin/bash

echo "============================================"
echo "Supply Chain Provenance System - Quick Setup"
echo "============================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "\n${BLUE}Step 1: Installing dependencies...${NC}"
npm install

echo -e "\n${BLUE}Step 2: Compiling smart contracts...${NC}"
npx hardhat compile

echo -e "\n${BLUE}Step 3: Running tests...${NC}"
npx hardhat test

echo -e "\n${GREEN}✅ Setup complete!${NC}"

echo -e "\n============================================"
echo "QUICK START OPTIONS:"
echo "============================================"
echo ""
echo "Option 1: Run Automated Demo"
echo "  Terminal 1: npx hardhat node"
echo "  Terminal 2: npx hardhat run scripts/demo.js --network localhost"
echo ""
echo "Option 2: Deploy and Use Frontend"
echo "  Terminal 1: npx hardhat node"
echo "  Terminal 2: npx hardhat run scripts/deploy.js --network localhost"
echo "  Terminal 3: cd frontend && npm start"
echo ""
echo "Option 3: Run Tests Only"
echo "  npx hardhat test"
echo ""
echo "============================================"
