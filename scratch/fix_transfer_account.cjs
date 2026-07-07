const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'supabase/functions/manual-withdraw/index.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\$\{baseUrl\.replace\('\/v1', '\/v2'\)\}\/transfers\/bank\/\$\{subAccountId\}/g, '${baseUrl.replace(\'/v1\', \'/v2\')}/transfers/bank/${parentAccountId}');

fs.writeFileSync(file, content);
console.log("Fixed manual-withdraw to use parentAccountId for transfers");
