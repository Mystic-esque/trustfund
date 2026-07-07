const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'supabase/functions/manual-withdraw/index.ts');
let content = fs.readFileSync(file, 'utf8');

// Replace all non-200 status codes with 200, so the Supabase client doesn't throw a generic FunctionsHttpError
// and instead parses the JSON body which contains the actual user-friendly error message.
content = content.replace(/status: 400/g, 'status: 200');
content = content.replace(/status: 401/g, 'status: 200');
content = content.replace(/status: 404/g, 'status: 200');
content = content.replace(/status: 500/g, 'status: 200');

fs.writeFileSync(file, content);
console.log('Fixed status codes in manual-withdraw');
