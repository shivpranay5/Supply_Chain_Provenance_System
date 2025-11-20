# 🚀 QUICK START GUIDE
## Get Your Demo Running in 5 Minutes

### Prerequisites Check
```bash
node --version  # Should be v16+
npm --version   # Should be 8+
```

If not installed, download from: https://nodejs.org/

---

## OPTION 1: Automated Demo (RECOMMENDED FOR INTERIM DEMO)

This is the fastest way to show working functionality.

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Compile Contract
```bash
npx hardhat compile
```

### Step 3: Run Tests (Optional but Recommended)
```bash
npx hardhat test
```

**Expected Output:** 33 passing tests

### Step 4: Start Local Blockchain
**Open Terminal 1:**
```bash
npx hardhat node
```

**Leave this running!** You should see:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

### Step 5: Run Demo Script
**Open Terminal 2:**
```bash
npx hardhat run scripts/demo.js --network localhost
```

**Watch the magic happen!** You'll see:
- Contract deployment
- 4 stakeholders registered
- 3 parts registered
- Custody transfers
- Maintenance records
- Complete history tracking

**This demo takes about 10-15 seconds to complete.**

---

## OPTION 2: Interactive Frontend

### Step 1-3: Same as Option 1
```bash
npm install
npx hardhat compile
npx hardhat test
```

### Step 4: Start Blockchain
**Terminal 1:**
```bash
npx hardhat node
```

### Step 5: Deploy Contract
**Terminal 2:**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

**Copy the contract address from output!**

### Step 6: Configure Frontend
Edit `frontend/.env`:
```
REACT_APP_CONTRACT_ADDRESS=<paste_your_contract_address_here>
```

### Step 7: Start Frontend
**Terminal 3:**
```bash
cd frontend
npm install
npm start
```

**Open browser:** http://localhost:3000

### Step 8: Connect MetaMask
1. Install MetaMask if not already installed
2. Add Local Network:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

3. Import Account (use any private key from Terminal 1's output)

4. Interact with the UI!

---

## TROUBLESHOOTING

### "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Network connection error"
- Make sure `npx hardhat node` is still running in Terminal 1
- Check that you're using the correct network in MetaMask

### "Contract not deployed"
- Run `npx hardhat run scripts/deploy.js --network localhost` again
- Update the contract address in frontend/.env

### MetaMask nonce issues
- Settings → Advanced → Clear Activity Tab Data

---

## FOR YOUR INTERIM DEMO RECORDING

### What to Show (5 minutes):

**1. Introduction (30 sec)**
- Brief project overview

**2. Run Automated Demo (90 sec)**
```bash
# Terminal 1
npx hardhat node

# Terminal 2
npx hardhat run scripts/demo.js --network localhost
```
- Narrate what's happening as output appears

**3. Show Code (60 sec)**
- Open `contracts/SupplyChainProvenance.sol`
- Highlight key functions:
  - `registerPart()`
  - `recordMaintenance()`
  - `transferCustody()`

**4. Show Tests (30 sec)**
```bash
npx hardhat test
```
- Show 33 passing tests

**5. Show Frontend (if ready) (60 sec)**
- Connect wallet
- Query a part
- Show history

**6. Wrap Up (30 sec)**
- Summary of completed features
- Next steps

---

## FILE STRUCTURE

```
Supply_Chain_Provenance_System/
├── contracts/
│   └── SupplyChainProvenance.sol    ← Main smart contract
├── scripts/
│   ├── deploy.js                     ← Deployment
│   └── demo.js                       ← Demo script (USE THIS!)
├── test/
│   └── SupplyChainProvenance.test.js ← Test suite
├── frontend/
│   ├── src/
│   │   ├── App.js                    ← React app
│   │   └── App.css                   ← Styling
│   └── package.json
├── hardhat.config.js
├── package.json
├── README.md
├── QUICKSTART.md                      ← This file!
└── PRESENTATION_SCRIPT.md             ← Demo script
```

---

## DEMO SCRIPT COMMANDS (Copy-Paste Ready)

```bash
# Setup (run once)
npm install
npx hardhat compile

# For demo (2 terminals)
# Terminal 1:
npx hardhat node

# Terminal 2:
npx hardhat run scripts/demo.js --network localhost
```

That's it! 🎉

---

## NEED HELP?

Common issues:
1. Node version too old → Update Node.js
2. Port 8545 in use → Kill other Hardhat instances
3. MetaMask issues → Clear activity data

For the interim demo, **Option 1 (Automated Demo)** is sufficient and impressive!

Good luck with your presentation! 🚀
