const assert = require("node:assert/strict");
const { ethers } = require("hardhat");

describe("NpcHood", function () {
  async function deployCollection({ open = true } = {}) {
    const [owner, collector] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("NpcHood");
    const collection = await Factory.deploy("https://metadata.example/npc/");
    await collection.waitForDeployment();
    if (open) await collection.setMintOpen(true);
    return { collection, owner, collector };
  }

  async function expectRevert(action, fragment) {
    let error;
    try {
      await action;
    } catch (caught) {
      error = caught;
    }
    assert.ok(error, "Expected transaction to revert");
    assert.ok(String(error).includes(fragment), `Expected revert containing ${fragment}; got ${error}`);
  }

  it("mints at the free-route fee and advances sequential token IDs", async function () {
    const { collection, collector } = await deployCollection();
    const payment = ethers.parseEther("0.0002");
    await collection.connect(collector).freeMint(2, { value: payment });
    assert.equal(await collection.totalMinted(), 2n);
    assert.equal(await collection.ownerOf(1), collector.address);
    assert.equal(await collection.ownerOf(2), collector.address);
    assert.equal(await ethers.provider.getBalance(await collection.getAddress()), payment);
  });

  it("starts closed and lets only the owner control mint availability", async function () {
    const { collection, owner, collector } = await deployCollection({ open: false });
    assert.equal(await collection.mintOpen(), false);
    await expectRevert(
      collection.connect(collector).freeMint(1, { value: ethers.parseEther("0.0001") }),
      "MintNotOpen",
    );
    await expectRevert(collection.connect(collector).setMintOpen(true), "OwnableUnauthorizedAccount");
    await collection.connect(owner).setMintOpen(true);
    assert.equal(await collection.mintOpen(), true);
    await collection.connect(collector).freeMint(1, { value: ethers.parseEther("0.0001") });
    await collection.connect(owner).setMintOpen(false);
    assert.equal(await collection.mintOpen(), false);
    await expectRevert(
      collection.connect(collector).freeMint(1, { value: ethers.parseEther("0.0001") }),
      "MintNotOpen",
    );
  });

  it("mints paid items only at the exact per-item price", async function () {
    const { collection, collector } = await deployCollection();
    await expectRevert(
      collection.connect(collector).paidMint(1, { value: ethers.parseEther("0.0002") }),
      "IncorrectPayment",
    );
    assert.equal(await collection.totalMinted(), 0n);
    await collection.connect(collector).paidMint(2, { value: ethers.parseEther("0.0006") });
    assert.equal(await collection.totalMinted(), 2n);
  });

  it("caps the shared collection at 10,000 NFTs across safe-size batches", async function () {
    this.timeout(60_000);
    const { collection, collector } = await deployCollection();
    const batchPayment = ethers.parseEther("0.002");
    for (let batch = 0; batch < 500; batch += 1) {
      await collection.connect(collector).freeMint(20, { value: batchPayment });
    }
    assert.equal(await collection.totalMinted(), 10_000n);
    await expectRevert(
      collection.connect(collector).freeMint(1, { value: ethers.parseEther("0.0001") }),
      "SupplyExceeded",
    );
  });

  it("rejects quantities above the safe per-transaction limit", async function () {
    const { collection, collector } = await deployCollection();
    await expectRevert(
      collection.connect(collector).freeMint(21, { value: ethers.parseEther("0.0021") }),
      "TransactionLimitExceeded",
    );
    assert.equal(await collection.totalMinted(), 0n);
  });

  it("lets only the owner withdraw collected proceeds to the owner", async function () {
    const { collection, owner, collector } = await deployCollection();
    const proceeds = ethers.parseEther("0.0001");
    await collection.connect(collector).freeMint(1, { value: proceeds });
    await expectRevert(collection.connect(collector).withdraw(), "OwnableUnauthorizedAccount");
    await collection.connect(owner).withdraw();
    assert.equal(await ethers.provider.getBalance(await collection.getAddress()), 0n);
  });

  it("rejects direct payments that bypass the mint functions", async function () {
    const { collection, collector } = await deployCollection();
    await expectRevert(
      collector.sendTransaction({ to: await collection.getAddress(), value: 1n }),
      "DirectPaymentDisabled",
    );
  });
});
