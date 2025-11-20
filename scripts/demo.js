const hre = require("hardhat");

async function main() {
  console.log("=".repeat(60));
  console.log("Supply Chain Provenance System - Demo Script");
  console.log("=".repeat(60));

  // Get signers
  const [admin, manufacturer, airline, mro, regulator] = await hre.ethers.getSigners();

  console.log("\n📋 Deploying contract...");
  const SupplyChainProvenance = await hre.ethers.getContractFactory("SupplyChainProvenance");
  const contract = await SupplyChainProvenance.deploy();
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);

  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Register Stakeholders");
  console.log("=".repeat(60));

  // Register Manufacturer
  console.log("\n👷 Registering Manufacturer...");
  await contract.connect(admin).registerStakeholder(
    manufacturer.address,
    "Boeing Manufacturing",
    1
  );
  console.log("✅ Manufacturer registered:", manufacturer.address);

  // Register Airline
  console.log("\n✈️  Registering Airline...");
  await contract.connect(admin).registerStakeholder(
    airline.address,
    "Delta Airlines",
    2
  );
  console.log("✅ Airline registered:", airline.address);

  // Register MRO
  console.log("\n🔧 Registering MRO...");
  await contract.connect(admin).registerStakeholder(
    mro.address,
    "AAR Corp MRO",
    3
  );
  console.log("✅ MRO registered:", mro.address);

  // Register Regulator
  console.log("\n📜 Registering Regulator...");
  await contract.connect(admin).registerStakeholder(
    regulator.address,
    "FAA",
    4
  );
  console.log("✅ Regulator registered:", regulator.address);

  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Manufacturer Registers Parts");
  console.log("=".repeat(60));

  console.log("\n🏭 Registering Part 1: Turbine Blade...");
  const tx1 = await contract.connect(manufacturer).registerPart(
    "ENG-001",
    "SN123456",
    "Turbine Blade",
    "QmTurbineBladeHash123"
  );
  await tx1.wait();
  console.log("✅ Part 1 registered: ENG-001 (Turbine Blade)");

  console.log("\n🏭 Registering Part 2: Engine Mount...");
  const tx2 = await contract.connect(manufacturer).registerPart(
    "ENG-002",
    "SN789012",
    "Engine Mount",
    "QmEngineMountHash456"
  );
  await tx2.wait();
  console.log("✅ Part 2 registered: ENG-002 (Engine Mount)");

  console.log("\n🏭 Registering Part 3: Landing Gear Strut...");
  const tx3 = await contract.connect(manufacturer).registerPart(
    "LG-003",
    "SN345678",
    "Landing Gear Strut",
    "QmLandingGearHash789"
  );
  await tx3.wait();
  console.log("✅ Part 3 registered: LG-003 (Landing Gear Strut)");

  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Query Part Details");
  console.log("=".repeat(60));

  console.log("\n🔍 Querying Part 1 details...");
  const part1 = await contract.getPartDetails(1);
  console.log("\nPart Details:");
  console.log("  Part Number:", part1[0]);
  console.log("  Serial Number:", part1[1]);
  console.log("  Part Name:", part1[2]);
  console.log("  Manufacturer:", part1[3]);
  console.log("  Status:", ["Manufactured", "InTransit", "Installed", "InMaintenance", "Retired"][part1[4]]);
  console.log("  Manufactured Date:", new Date(Number(part1[5]) * 1000).toLocaleString());
  console.log("  IPFS Hash:", part1[6]);
  console.log("  Current Owner:", part1[7]);

  console.log("\n" + "=".repeat(60));
  console.log("STEP 4: Transfer Custody to Airline");
  console.log("=".repeat(60));

  console.log("\n📦 Transferring Part 1 from Manufacturer to Airline...");
  const transferTx1 = await contract.connect(manufacturer).transferCustody(
    1,
    airline.address,
    "Initial sale to airline"
  );
  await transferTx1.wait();
  console.log("✅ Custody transferred successfully");

  console.log("\n🔍 Checking updated ownership...");
  const part1Updated = await contract.getPartDetails(1);
  console.log("  New Owner:", part1Updated[7]);
  console.log("  New Status:", ["Manufactured", "InTransit", "Installed", "InMaintenance", "Retired"][part1Updated[4]]);

  console.log("\n" + "=".repeat(60));
  console.log("STEP 5: Airline Installs Part");
  console.log("=".repeat(60));

  console.log("\n✈️  Airline updating part status to Installed...");
  const statusTx = await contract.connect(airline).updatePartStatus(1, 2);
  await statusTx.wait();
  console.log("✅ Part status updated to: Installed");

  console.log("\n" + "=".repeat(60));
  console.log("STEP 6: Transfer to MRO for Maintenance");
  console.log("=".repeat(60));

  console.log("\n🔧 Transferring Part 1 to MRO for maintenance...");
  const transferTx2 = await contract.connect(airline).transferCustody(
    1,
    mro.address,
    "Scheduled maintenance"
  );
  await transferTx2.wait();
  console.log("✅ Part transferred to MRO");

  console.log("\n" + "=".repeat(60));
  console.log("STEP 7: MRO Records Maintenance");
  console.log("=".repeat(60));

  console.log("\n🔧 Recording maintenance activity 1...");
  const maintTx1 = await contract.connect(mro).recordMaintenance(
    1,
    "Inspection",
    "QmInspectionReportHash",
    "Routine 500-hour inspection completed. No issues found."
  );
  await maintTx1.wait();
  console.log("✅ Maintenance record 1 created: Inspection");

  console.log("\n🔧 Recording maintenance activity 2...");
  const maintTx2 = await contract.connect(mro).recordMaintenance(
    1,
    "Repair",
    "QmRepairReportHash",
    "Minor surface crack repaired and re-certified."
  );
  await maintTx2.wait();
  console.log("✅ Maintenance record 2 created: Repair");

  console.log("\n" + "=".repeat(60));
  console.log("STEP 8: Return to Airline");
  console.log("=".repeat(60));

  console.log("\n✈️  Transferring Part 1 back to Airline...");
  const transferTx3 = await contract.connect(mro).transferCustody(
    1,
    airline.address,
    "Maintenance completed"
  );
  await transferTx3.wait();
  console.log("✅ Part returned to Airline");

  console.log("\n" + "=".repeat(60));
  console.log("STEP 9: View Complete Part History");
  console.log("=".repeat(60));

  console.log("\n📜 Custody History for Part 1:");
  const custodyHistory = await contract.getCustodyHistory(1);
  custodyHistory.forEach((transfer, index) => {
    console.log(`\n  Transfer ${index + 1}:`);
    console.log(`    From: ${transfer.from}`);
    console.log(`    To: ${transfer.to}`);
    console.log(`    Date: ${new Date(Number(transfer.timestamp) * 1000).toLocaleString()}`);
    console.log(`    Reason: ${transfer.reason}`);
  });

  console.log("\n🔧 Maintenance History for Part 1:");
  const maintenanceHistory = await contract.getMaintenanceHistory(1);
  maintenanceHistory.forEach((record, index) => {
    console.log(`\n  Maintenance ${index + 1}:`);
    console.log(`    Type: ${record.maintenanceType}`);
    console.log(`    MRO: ${record.mro}`);
    console.log(`    Date: ${new Date(Number(record.timestamp) * 1000).toLocaleString()}`);
    console.log(`    Notes: ${record.notes}`);
    console.log(`    IPFS Report: ${record.ipfsHash}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("STEP 10: Regulator Verification");
  console.log("=".repeat(60));

  console.log("\n📜 Regulator verifying part authenticity...");
  const isAuthentic = await contract.connect(regulator).verifyPartAuthenticity(1);
  console.log("✅ Part authenticity verified:", isAuthentic);

  console.log("\n" + "=".repeat(60));
  console.log("STEP 11: View All Parts by Stakeholder");
  console.log("=".repeat(60));

  console.log("\n🏭 Parts owned by Manufacturer:");
  const manufacturerParts = await contract.getStakeholderParts(manufacturer.address);
  console.log("  Part IDs:", manufacturerParts.map(id => id.toString()).join(", "));

  console.log("\n✈️  Parts owned by Airline:");
  const airlineParts = await contract.getStakeholderParts(airline.address);
  console.log("  Part IDs:", airlineParts.map(id => id.toString()).join(", "));

  console.log("\n🔧 Parts owned by MRO:");
  const mroParts = await contract.getStakeholderParts(mro.address);
  console.log("  Part IDs:", mroParts.map(id => id.toString()).join(", "));

  console.log("\n" + "=".repeat(60));
  console.log("Demo Completed Successfully! ✅");
  console.log("=".repeat(60));

  console.log("\n📊 Summary:");
  console.log("  Total Parts Registered: 3");
  console.log("  Total Stakeholders: 4");
  console.log("  Total Custody Transfers: 3");
  console.log("  Total Maintenance Records: 2");
  console.log("  Contract Address:", contractAddress);

  console.log("\n🎯 Next Steps for Interim Demo:");
  console.log("  1. Show this console output");
  console.log("  2. Demo the React frontend");
  console.log("  3. Show the smart contract code");
  console.log("  4. Explain the architecture");
  console.log("  5. Discuss stakeholder interactions");

  // Save demo results
  const fs = require('fs');
  const demoResults = {
    contractAddress: contractAddress,
    timestamp: new Date().toISOString(),
    partsRegistered: 3,
    stakeholders: 4,
    custodyTransfers: 3,
    maintenanceRecords: 2
  };

  fs.writeFileSync(
    './demo-results.json',
    JSON.stringify(demoResults, null, 2)
  );

  console.log("\n💾 Demo results saved to demo-results.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
