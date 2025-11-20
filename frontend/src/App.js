import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import SupplyChainABI from './contracts/SupplyChainProvenance.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "YOUR_CONTRACT_ADDRESS_HERE";

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [role, setRole] = useState('None');
  const [stakeholderName, setStakeholderName] = useState('');
  
  // Part registration state
  const [partNumber, setPartNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  
  // Part query state
  const [queryPartId, setQueryPartId] = useState('');
  const [partDetails, setPartDetails] = useState(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [custodyHistory, setCustodyHistory] = useState([]);
  
  // Maintenance state
  const [maintPartId, setMaintPartId] = useState('');
  const [maintType, setMaintType] = useState('');
  const [maintIpfsHash, setMaintIpfsHash] = useState('');
  const [maintNotes, setMaintNotes] = useState('');
  
  // Transfer state
  const [transferPartId, setTransferPartId] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferReason, setTransferReason] = useState('');
  
  // Status state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    connectWallet();
  }, []);

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, SupplyChainABI.abi, signer);
        setContract(contractInstance);
        
        // Get stakeholder info
        try {
          const stakeholder = await contractInstance.getStakeholderDetails(accounts[0]);
          setStakeholderName(stakeholder[0]);
          const roleNames = ['None', 'Manufacturer', 'Airline', 'MRO', 'Regulator'];
          setRole(roleNames[stakeholder[1]]);
        } catch (err) {
          setRole('None');
        }
        
        setMessage('Wallet connected successfully!');
      } else {
        setMessage('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setMessage('Error connecting wallet');
    }
  };

  const registerPart = async () => {
    if (!contract) {
      setMessage('Contract not loaded');
      return;
    }
    
    try {
      setLoading(true);
      setMessage('Registering part...');
      
      const tx = await contract.registerPart(partNumber, serialNumber, partName, ipfsHash);
      await tx.wait();
      
      setMessage('Part registered successfully!');
      setPartNumber('');
      setSerialNumber('');
      setPartName('');
      setIpfsHash('');
    } catch (error) {
      console.error('Error registering part:', error);
      setMessage('Error: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const queryPart = async () => {
    if (!contract) {
      setMessage('Contract not loaded');
      return;
    }
    
    try {
      setLoading(true);
      setMessage('Querying part...');
      
      const details = await contract.getPartDetails(queryPartId);
      const maintenance = await contract.getMaintenanceHistory(queryPartId);
      const custody = await contract.getCustodyHistory(queryPartId);
      
      setPartDetails({
        partNumber: details[0],
        serialNumber: details[1],
        partName: details[2],
        manufacturer: details[3],
        status: ['Manufactured', 'InTransit', 'Installed', 'InMaintenance', 'Retired'][details[4]],
        manufacturedDate: new Date(Number(details[5]) * 1000).toLocaleString(),
        ipfsHash: details[6],
        currentOwner: details[7]
      });
      
      setMaintenanceHistory(maintenance);
      setCustodyHistory(custody);
      setMessage('Part details retrieved successfully!');
    } catch (error) {
      console.error('Error querying part:', error);
      setMessage('Error: ' + (error.reason || error.message));
      setPartDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const recordMaintenance = async () => {
    if (!contract) {
      setMessage('Contract not loaded');
      return;
    }
    
    try {
      setLoading(true);
      setMessage('Recording maintenance...');
      
      const tx = await contract.recordMaintenance(maintPartId, maintType, maintIpfsHash, maintNotes);
      await tx.wait();
      
      setMessage('Maintenance recorded successfully!');
      setMaintPartId('');
      setMaintType('');
      setMaintIpfsHash('');
      setMaintNotes('');
    } catch (error) {
      console.error('Error recording maintenance:', error);
      setMessage('Error: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const transferCustody = async () => {
    if (!contract) {
      setMessage('Contract not loaded');
      return;
    }
    
    try {
      setLoading(true);
      setMessage('Transferring custody...');
      
      const tx = await contract.transferCustody(transferPartId, transferTo, transferReason);
      await tx.wait();
      
      setMessage('Custody transferred successfully!');
      setTransferPartId('');
      setTransferTo('');
      setTransferReason('');
    } catch (error) {
      console.error('Error transferring custody:', error);
      setMessage('Error: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🛩️ Aviation Supply Chain Provenance</h1>
        <div className="wallet-info">
          <p><strong>Account:</strong> {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'}</p>
          <p><strong>Role:</strong> {role}</p>
          {stakeholderName && <p><strong>Name:</strong> {stakeholderName}</p>}
        </div>
        {!account && (
          <button onClick={connectWallet} className="connect-button">
            Connect Wallet
          </button>
        )}
      </header>

      <div className="container">
        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {/* Register Part Section */}
        {role === 'Manufacturer' && (
          <div className="section">
            <h2>Register New Part</h2>
            <div className="form-group">
              <input
                type="text"
                placeholder="Part Number (e.g., ENG-001)"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
              />
              <input
                type="text"
                placeholder="Serial Number (e.g., SN123456)"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
              <input
                type="text"
                placeholder="Part Name (e.g., Turbine Blade)"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
              />
              <input
                type="text"
                placeholder="IPFS Hash (e.g., QmXxx...)"
                value={ipfsHash}
                onChange={(e) => setIpfsHash(e.target.value)}
              />
              <button onClick={registerPart} disabled={loading}>
                {loading ? 'Registering...' : 'Register Part'}
              </button>
            </div>
          </div>
        )}

        {/* Query Part Section */}
        <div className="section">
          <h2>Query Part Details</h2>
          <div className="form-group">
            <input
              type="number"
              placeholder="Part ID"
              value={queryPartId}
              onChange={(e) => setQueryPartId(e.target.value)}
            />
            <button onClick={queryPart} disabled={loading}>
              {loading ? 'Querying...' : 'Query Part'}
            </button>
          </div>

          {partDetails && (
            <div className="part-details">
              <h3>Part Information</h3>
              <table>
                <tbody>
                  <tr><td><strong>Part Number:</strong></td><td>{partDetails.partNumber}</td></tr>
                  <tr><td><strong>Serial Number:</strong></td><td>{partDetails.serialNumber}</td></tr>
                  <tr><td><strong>Part Name:</strong></td><td>{partDetails.partName}</td></tr>
                  <tr><td><strong>Manufacturer:</strong></td><td>{partDetails.manufacturer}</td></tr>
                  <tr><td><strong>Status:</strong></td><td><span className="status-badge">{partDetails.status}</span></td></tr>
                  <tr><td><strong>Manufactured:</strong></td><td>{partDetails.manufacturedDate}</td></tr>
                  <tr><td><strong>Current Owner:</strong></td><td>{partDetails.currentOwner}</td></tr>
                  <tr><td><strong>Certificate (IPFS):</strong></td><td>{partDetails.ipfsHash}</td></tr>
                </tbody>
              </table>

              {maintenanceHistory.length > 0 && (
                <div className="history-section">
                  <h4>Maintenance History ({maintenanceHistory.length} records)</h4>
                  {maintenanceHistory.map((record, index) => (
                    <div key={index} className="history-item">
                      <p><strong>Type:</strong> {record.maintenanceType}</p>
                      <p><strong>MRO:</strong> {record.mro}</p>
                      <p><strong>Date:</strong> {new Date(Number(record.timestamp) * 1000).toLocaleString()}</p>
                      <p><strong>Notes:</strong> {record.notes}</p>
                    </div>
                  ))}
                </div>
              )}

              {custodyHistory.length > 0 && (
                <div className="history-section">
                  <h4>Custody History ({custodyHistory.length} transfers)</h4>
                  {custodyHistory.map((transfer, index) => (
                    <div key={index} className="history-item">
                      <p><strong>From:</strong> {transfer.from}</p>
                      <p><strong>To:</strong> {transfer.to}</p>
                      <p><strong>Date:</strong> {new Date(Number(transfer.timestamp) * 1000).toLocaleString()}</p>
                      <p><strong>Reason:</strong> {transfer.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Record Maintenance Section */}
        {role === 'MRO' && (
          <div className="section">
            <h2>Record Maintenance</h2>
            <div className="form-group">
              <input
                type="number"
                placeholder="Part ID"
                value={maintPartId}
                onChange={(e) => setMaintPartId(e.target.value)}
              />
              <input
                type="text"
                placeholder="Maintenance Type (e.g., Inspection, Repair)"
                value={maintType}
                onChange={(e) => setMaintType(e.target.value)}
              />
              <input
                type="text"
                placeholder="Report IPFS Hash"
                value={maintIpfsHash}
                onChange={(e) => setMaintIpfsHash(e.target.value)}
              />
              <textarea
                placeholder="Maintenance Notes"
                value={maintNotes}
                onChange={(e) => setMaintNotes(e.target.value)}
                rows="3"
              />
              <button onClick={recordMaintenance} disabled={loading}>
                {loading ? 'Recording...' : 'Record Maintenance'}
              </button>
            </div>
          </div>
        )}

        {/* Transfer Custody Section */}
        {(role === 'Manufacturer' || role === 'Airline' || role === 'MRO') && (
          <div className="section">
            <h2>Transfer Custody</h2>
            <div className="form-group">
              <input
                type="number"
                placeholder="Part ID"
                value={transferPartId}
                onChange={(e) => setTransferPartId(e.target.value)}
              />
              <input
                type="text"
                placeholder="Recipient Address (0x...)"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
              />
              <input
                type="text"
                placeholder="Transfer Reason (e.g., Sale, Maintenance)"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
              />
              <button onClick={transferCustody} disabled={loading}>
                {loading ? 'Transferring...' : 'Transfer Custody'}
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="App-footer">
        <p>CSE 540 - Group 3 | Blockchain-Based Supply Chain Provenance System</p>
      </footer>
    </div>
  );
}

export default App;
