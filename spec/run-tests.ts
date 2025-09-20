#!/usr/bin/env bun


import { spawn } from "bun";

const testFolders = {
  controllers: "spec/controllers",
  services: "spec/services", 
  validators: "spec/validators",
  integration: "spec/integration",
  utilities: "spec/utilities",
  balance: "spec/controllers/balance.controller.spec.ts",
  blocks: "spec/controllers/blocks.controller.spec.ts spec/services/blocks.service.spec.ts spec/validators/block.validator.spec.ts",
  rollback: "spec/controllers/rollback.controller.spec.ts spec/services/rollback.service.spec.ts spec/validators/rollback.validator.spec.ts",
  all: "spec"
};

const folder = process.argv[2] || "all";

if (!testFolders[folder as keyof typeof testFolders]) {
  console.error(`Invalid test folder: ${folder}`);
  console.error(`Available folders: ${Object.keys(testFolders).join(", ")}`);
  process.exit(1);
}

const testPath = testFolders[folder as keyof typeof testFolders];

console.log(`🧪 Running tests in: ${testPath}`);
console.log(`📁 Folder: ${folder}`);
console.log("─".repeat(50));

try {
  const result = spawn({
    cmd: ["bun", "test", testPath],
    stdio: ["inherit", "inherit", "inherit"],
  });

  await result.exited;
  
  if (result.exitCode === 0) {
    console.log(`\nTests completed successfully for ${folder}`);
  } else {
    console.log(`\n Tests failed for ${folder}`);
    process.exit(result.exitCode);
  }
} catch (error) {
  console.error(`Error running tests: ${error}`);
  process.exit(1);
}
