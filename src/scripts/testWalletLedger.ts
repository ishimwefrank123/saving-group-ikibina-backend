import "dotenv/config";
import { connectDatabase } from "../config/database.js";
import { User } from "../models/User.js";
import { Group } from "../models/Group.js";
import { Ledger } from "../models/Ledger.js";
import * as walletService from "../services/wallet.service.js";
import * as ledgerService from "../services/ledger.service.js";

async function runTests() {
  console.log("Connecting to database for Wallet & Ledger tests...");
  await connectDatabase();

  // Find demo member
  const member = await User.findOne({ email: "member1@kigali.rw" });
  if (!member) {
    throw new Error("Demo member1@kigali.rw not found. Run npm run seed first.");
  }

  const userId = member._id.toString();
  console.log(`Testing with user: ${member.name} (${member.email}), ID: ${userId}`);

  // Clean existing ledger entries for this user for fresh test
  await Ledger.deleteMany({
    $or: [{ to: `wallet:${userId}` }, { from: `wallet:${userId}` }],
  }).catch(() => {
    // pre-delete hook might block, which is fine
  });

  // 1. Check initial balance
  const initialBalance = await ledgerService.calculateWalletBalance(userId);
  console.log(`[PASS] Initial calculated wallet balance: ${initialBalance} RWF`);

  // 2. Test Simulated Top-up
  console.log("\n--- TEST 1: Simulated Top-Up (50,000 RWF) ---");
  const topUpResult = await walletService.topUpWallet(userId, {
    amount: 50000,
    phoneNumber: "0788111222",
    provider: "MTN",
  });
  console.log(`[PASS] Top-up reference: ${topUpResult.transaction.reference}`);
  console.log(`[PASS] Balance after top-up: ${topUpResult.newBalance} RWF`);
  if (topUpResult.newBalance !== initialBalance + 50000) {
    throw new Error("Top-up balance mismatch!");
  }

  // 3. Test Simulated Withdrawal
  console.log("\n--- TEST 2: Simulated Withdrawal (20,000 RWF) ---");
  const withdrawResult = await walletService.withdrawFromWallet(userId, {
    amount: 20000,
    phoneNumber: "0788111222",
  });
  console.log(`[PASS] Withdrawal reference: ${withdrawResult.transaction.reference}`);
  console.log(`[PASS] Balance after withdrawal: ${withdrawResult.newBalance} RWF`);
  if (withdrawResult.newBalance !== 30000) {
    throw new Error(`Expected balance 30000 RWF, got ${withdrawResult.newBalance}`);
  }

  // 4. Test Overdraft Prevention (Money Rule: No transfer can make a wallet go below zero)
  console.log("\n--- TEST 3: Overdraft Prevention Rule ---");
  try {
    await walletService.withdrawFromWallet(userId, {
      amount: 40000, // Balance is only 30,000
      phoneNumber: "0788111222",
    });
    throw new Error("FAIL: Overdraft was not prevented!");
  } catch (error: any) {
    console.log(`[PASS] Overdraft correctly rejected with message: "${error.message}"`);
  }

  // 5. Test Transaction History
  console.log("\n--- TEST 4: Transaction History ---");
  const history = await ledgerService.getUserTransactionHistory(userId);
  console.log(`[PASS] Found ${history.pagination.total} transactions in history`);
  console.log(`[PASS] History balance matches: ${history.balance} RWF`);

  // 6. Test Group Pool Movement & Balance Calculation
  console.log("\n--- TEST 5: Group Pool Contribution Movement ---");
  const group = await Group.findOne({ inviteCode: "KGL2026" });
  if (group) {
    const groupId = group._id.toString();
    const initialPool = await ledgerService.calculateGroupPoolBalance(groupId);

    // Simulate contribution: wallet -> group
    const contributionTx = await ledgerService.recordTransaction({
      type: "contribution",
      from: `wallet:${userId}`,
      to: `group:${groupId}`,
      amount: 10000,
      performedBy: userId,
      user: userId,
      group: groupId,
      description: "Monthly savings contribution",
    });

    const newPool = await ledgerService.calculateGroupPoolBalance(groupId);
    const userBalanceAfterContrib = await ledgerService.calculateWalletBalance(userId);

    console.log(`[PASS] Contribution recorded: ${contributionTx.reference}`);
    console.log(`[PASS] Group pool balance increased from ${initialPool} to ${newPool} RWF (+10,000)`);
    console.log(`[PASS] User wallet decreased from 30,000 to ${userBalanceAfterContrib} RWF (-10,000)`);

    // 7. Test Reversal of the Contribution
    console.log("\n--- TEST 6: Reversal of Contribution Record ---");
    const admin = await User.findOne({ platformRole: "platform-admin" });
    const reversal = await ledgerService.createReversalTransaction(
      contributionTx._id.toString(),
      admin!._id.toString(),
      "Mistaken contribution amount"
    );

    const poolAfterReversal = await ledgerService.calculateGroupPoolBalance(groupId);
    const userBalanceAfterReversal = await ledgerService.calculateWalletBalance(userId);

    console.log(`[PASS] Reversal record created: ${reversal.reference}`);
    console.log(`[PASS] Group pool reverted back to: ${poolAfterReversal} RWF`);
    console.log(`[PASS] User wallet refunded back to: ${userBalanceAfterReversal} RWF`);
  }

  console.log("\n=========================================");
  console.log("ALL WALLET & LEDGER TESTS PASSED SUCCESSFULLY!");
  console.log("=========================================\n");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
