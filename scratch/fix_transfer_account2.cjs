const fs = require('fs');
const path = require('path');

const file2 = path.join(process.cwd(), 'supabase/functions/settle-order/index.ts');
let content2 = fs.readFileSync(file2, 'utf8');

content2 = content2.replace(/\$\{baseUrl\.replace\('\/v1', '\/v2'\)\}\/transfers\/bank\/\$\{subAccountId\}/g, '${baseUrl.replace(\'/v1\', \'/v2\')}/transfers/bank/${parentAccountId}');

fs.writeFileSync(file2, content2);
console.log("Fixed settle-order to use parentAccountId for transfers");
