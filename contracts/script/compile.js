import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';

const contractsDir = path.resolve(process.cwd(), 'src');
const outDir = path.resolve(process.cwd(), 'out');

const files = fs.readdirSync(contractsDir).filter((f) => f.endsWith('.sol'));
if (!files.length) {
  console.error('No Solidity files found in contracts/src');
  process.exit(1);
}

const sources = {};
for (const file of files) {
  const full = path.join(contractsDir, file);
  sources[file] = { content: fs.readFileSync(full, 'utf8') };
}

const input = {
  language: 'Solidity',
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object']
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  const fatal = output.errors.filter((e) => e.severity === 'error');
  for (const e of output.errors) console.log(e.formattedMessage);
  if (fatal.length) process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

for (const [sourceName, contracts] of Object.entries(output.contracts || {})) {
  for (const [contractName, artifact] of Object.entries(contracts)) {
    const bytecode = artifact?.evm?.bytecode?.object || '';
    const outPath = path.join(outDir, `${contractName}.json`);
    fs.writeFileSync(
      outPath,
      JSON.stringify({ abi: artifact.abi, bytecode: bytecode.startsWith('0x') ? bytecode : `0x${bytecode}` }, null, 2)
    );
    console.log(`Wrote ${outPath}`);
  }
}
