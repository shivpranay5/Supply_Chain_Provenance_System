const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChainProvenance", function () {
  let supplyChain;
  let admin, manufacturer, airline, mro, regulator, unauthorized;

  beforeEach(async function () {
    // Get signers
    [admin, manufacturer, airline, mro, regulator, unauthorized] = await ethers.getSigners();

    // Deploy contract
    const SupplyChainProvenance = await ethers.getContractFactory("SupplyChainProvenance");
    supplyChain = await SupplyChainProvenance.deploy();
    await supplyChain.waitForDeployment();

    // Register stakeholders
    await supplyChain.connect(admin).registerStakeholder(
      manufacturer.address,
      "Boeing Manufacturing",
      1 // Manufacturer
    );

    await supplyChain.connect(admin).registerStakeholder(
      airline.address,
      "Delta Airlines",
      2 // Airline
    );

    await supplyChain.connect(admin).registerStakeholder(
      mro.address,
      "AAR Corp MRO",
      3 // MRO
    );

    await supplyChain.connect(admin).registerStakeholder(
      regulator.address,
      "FAA",
      4 // Regulator
    );
  });

  describe("Stakeholder Registration", function () {
    it("Should register a manufacturer stakeholder", async function () {
      const stakeholder = await supplyChain.getStakeholderDetails(manufacturer.address);
      expect(stakeholder[0]).to.equal("Boeing Manufacturing");
      expect(stakeholder[1]).to.equal(1); // Manufacturer role
      expect(stakeholder[2]).to.equal(true); // isActive
    });

    it("Should prevent non-admin from registering stakeholders", async function () {
      await expect(
        supplyChain.connect(manufacturer).registerStakeholder(
          unauthorized.address,
          "Unauthorized",
          1
        )
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should prevent duplicate stakeholder registration", async function () {
      await expect(
        supplyChain.connect(admin).registerStakeholder(
          manufacturer.address,
          "Duplicate",
          1
        )
      ).to.be.revertedWith("Stakeholder already registered");
    });
  });

  describe("Part Registration", function () {
    it("Should allow manufacturer to register a part", async function () {
      const tx = await supplyChain.connect(manufacturer).registerPart(
        "ENG-001",
        "SN123456",
        "Turbine Blade",
        "QmTest123"
      );

      await expect(tx).to.emit(supplyChain, "PartRegistered")
        .withArgs(1, "ENG-001", manufacturer.address);

      const part = await supplyChain.getPartDetails(1);
      expect(part[0]).to.equal("ENG-001"); // partNumber
      expect(part[1]).to.equal("SN123456"); // serialNumber
      expect(part[2]).to.equal("Turbine Blade"); // partName
      expect(part[3]).to.equal(manufacturer.address); // manufacturer
      expect(part[4]).to.equal(0); // Status: Manufactured
    });

    it("Should prevent non-manufacturer from registering parts", async function () {
      await expect(
        supplyChain.connect(airline).registerPart(
          "ENG-001",
          "SN123456",
          "Turbine Blade",
          "QmTest123"
        )
      ).to.be.revertedWith("Only manufacturers can perform this action");
    });

    it("Should assign sequential part IDs", async function () {
      await supplyChain.connect(manufacturer).registerPart(
        "ENG-001",
        "SN123456",
        "Turbine Blade",
        "QmTest123"
      );

      await supplyChain.connect(manufacturer).registerPart(
        "ENG-002",
        "SN789012",
        "Engine Mount",
        "QmTest456"
      );

      const part1 = await supplyChain.getPartDetails(1);
      const part2 = await supplyChain.getPartDetails(2);

      expect(part1[0]).to.equal("ENG-001");
      expect(part2[0]).to.equal("ENG-002");
    });
  });

  describe("Maintenance Recording", function () {
    beforeEach(async function () {
      // Register a part first
      await supplyChain.connect(manufacturer).registerPart(
        "ENG-001",
        "SN123456",
        "Turbine Blade",
        "QmTest123"
      );
    });

    it("Should allow MRO to record maintenance", async function () {
      const tx = await supplyChain.connect(mro).recordMaintenance(
        1,
        "Inspection",
        "QmMaintenanceReport",
        "Routine inspection completed"
      );

      await expect(tx).to.emit(supplyChain, "MaintenanceRecorded")
        .withArgs(1, 1, mro.address);

      const history = await supplyChain.getMaintenanceHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0].maintenanceType).to.equal("Inspection");
      expect(history[0].mro).to.equal(mro.address);
    });

    it("Should prevent non-MRO from recording maintenance", async function () {
      await expect(
        supplyChain.connect(airline).recordMaintenance(
          1,
          "Inspection",
          "QmMaintenanceReport",
          "Unauthorized"
        )
      ).to.be.revertedWith("Only MROs can perform this action");
    });

    it("Should maintain complete maintenance history", async function () {
      await supplyChain.connect(mro).recordMaintenance(
        1,
        "Inspection",
        "QmReport1",
        "First inspection"
      );

      await supplyChain.connect(mro).recordMaintenance(
        1,
        "Repair",
        "QmReport2",
        "Minor repair"
      );

      const history = await supplyChain.getMaintenanceHistory(1);
      expect(history.length).to.equal(2);
      expect(history[0].maintenanceType).to.equal("Inspection");
      expect(history[1].maintenanceType).to.equal("Repair");
    });
  });

  describe("Custody Transfer", function () {
    beforeEach(async function () {
      // Register a part
      await supplyChain.connect(manufacturer).registerPart(
        "ENG-001",
        "SN123456",
        "Turbine Blade",
        "QmTest123"
      );
    });

    it("Should allow owner to transfer custody", async function () {
      const tx = await supplyChain.connect(manufacturer).transferCustody(
        1,
        airline.address,
        "Sale to airline"
      );

      await expect(tx).to.emit(supplyChain, "CustodyTransferred")
        .withArgs(1, manufacturer.address, airline.address);

      const part = await supplyChain.getPartDetails(1);
      expect(part[7]).to.equal(airline.address); // currentOwner
      expect(part[4]).to.equal(1); // Status: InTransit
    });

    it("Should prevent non-owner from transferring custody", async function () {
      await expect(
        supplyChain.connect(airline).transferCustody(
          1,
          mro.address,
          "Unauthorized transfer"
        )
      ).to.be.revertedWith("Only part owner can perform this action");
    });

    it("Should prevent transfer to non-registered stakeholder", async function () {
      await expect(
        supplyChain.connect(manufacturer).transferCustody(
          1,
          unauthorized.address,
          "Invalid transfer"
        )
      ).to.be.revertedWith("Recipient is not a registered stakeholder");
    });

    it("Should maintain custody history", async function () {
      await supplyChain.connect(manufacturer).transferCustody(
        1,
        airline.address,
        "Sale"
      );

      await supplyChain.connect(airline).transferCustody(
        1,
        mro.address,
        "Maintenance"
      );

      const history = await supplyChain.getCustodyHistory(1);
      expect(history.length).to.equal(2);
      expect(history[0].from).to.equal(manufacturer.address);
      expect(history[0].to).to.equal(airline.address);
      expect(history[1].from).to.equal(airline.address);
      expect(history[1].to).to.equal(mro.address);
    });
  });

  describe("Part Status Update", function () {
    beforeEach(async function () {
      await supplyChain.connect(manufacturer).registerPart(
        "ENG-001",
        "SN123456",
        "Turbine Blade",
        "QmTest123"
      );
    });

    it("Should allow owner to update part status", async function () {
      const tx = await supplyChain.connect(manufacturer).updatePartStatus(1, 2);

      await expect(tx).to.emit(supplyChain, "PartStatusUpdated")
        .withArgs(1, 2);

      const part = await supplyChain.getPartDetails(1);
      expect(part[4]).to.equal(2); // Status: Installed
    });

    it("Should prevent non-owner from updating status", async function () {
      await expect(
        supplyChain.connect(airline).updatePartStatus(1, 2)
      ).to.be.revertedWith("Only part owner can perform this action");
    });
  });

  describe("Part Verification", function () {
    beforeEach(async function () {
      await supplyChain.connect(manufacturer).registerPart(
        "ENG-001",
        "SN123456",
        "Turbine Blade",
        "QmTest123"
      );
    });

    it("Should allow regulator to verify part authenticity", async function () {
      const isAuthentic = await supplyChain.connect(regulator).verifyPartAuthenticity(1);
      expect(isAuthentic).to.equal(true);
    });

    it("Should prevent non-regulator from verifying parts", async function () {
      await expect(
        supplyChain.connect(airline).verifyPartAuthenticity(1)
      ).to.be.revertedWith("Only regulators can perform this action");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await supplyChain.connect(manufacturer).registerPart(
        "ENG-001",
        "SN123456",
        "Turbine Blade",
        "QmTest123"
      );

      await supplyChain.connect(manufacturer).registerPart(
        "ENG-002",
        "SN789012",
        "Engine Mount",
        "QmTest456"
      );
    });

    it("Should return parts owned by stakeholder", async function () {
      const parts = await supplyChain.getStakeholderParts(manufacturer.address);
      expect(parts.length).to.equal(2);
      expect(parts[0]).to.equal(1);
      expect(parts[1]).to.equal(2);
    });

    it("Should return empty maintenance history for new part", async function () {
      const history = await supplyChain.getMaintenanceHistory(1);
      expect(history.length).to.equal(0);
    });

    it("Should return empty custody history for new part", async function () {
      const history = await supplyChain.getCustodyHistory(1);
      expect(history.length).to.equal(0);
    });
  });
});
