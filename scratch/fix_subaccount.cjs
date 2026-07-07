const fs = require('fs');
const path = require('path');

// Revert manual-withdraw
const fileMW = path.join(process.cwd(), 'supabase/functions/manual-withdraw/index.ts');
let contentMW = fs.readFileSync(fileMW, 'utf8');
contentMW = contentMW.replace(/\$\{baseUrl\.replace\('\/v1', '\/v2'\)\}\/transfers\/bank\/\$\{parentAccountId\}/g, '${baseUrl.replace(\'/v1\', \'/v2\')}/transfers/bank/${subAccountId}');
fs.writeFileSync(fileMW, contentMW);

// Revert settle-order
const fileSO = path.join(process.cwd(), 'supabase/functions/settle-order/index.ts');
let contentSO = fs.readFileSync(fileSO, 'utf8');
contentSO = contentSO.replace(/\$\{baseUrl\.replace\('\/v1', '\/v2'\)\}\/transfers\/bank\/\$\{parentAccountId\}/g, '${baseUrl.replace(\'/v1\', \'/v2\')}/transfers/bank/${subAccountId}');
fs.writeFileSync(fileSO, contentSO);

// Fix provision-virtual-account
const filePVA = path.join(process.cwd(), 'supabase/functions/provision-virtual-account/index.ts');
let contentPVA = fs.readFileSync(filePVA, 'utf8');
// Look for body: JSON.stringify({ accountRef: userId, accountName: userFullName, currency: "NGN" })
contentPVA = contentPVA.replace(/currency:\s*"NGN"\n\s*\}/g, 'currency: "NGN",\n        accountId: subAccountId\n      }');
fs.writeFileSync(filePVA, contentPVA);

console.log("Fixed all files.");
