const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'supabase/functions/nomba-proxy/index.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\$\{baseUrl\}\/accounts\/accounts/g, '${baseUrl}/accounts/balance');

fs.writeFileSync(file, content);
console.log("Fixed balance endpoint to /accounts/balance");
