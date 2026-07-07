const fs = require('fs');
const file = 'supabase/migrations/00000_schema_and_rpc.sql';
let content = fs.readFileSync(file, 'utf8');

// Fix the $ issue caused by regex replacement $$ evaluation
content = content.replace(/DO \$ BEGIN/g, 'DO $$ BEGIN');
content = content.replace(/END \$;/g, 'END $$;');

fs.writeFileSync(file, content);
console.log('Fixed $$ syntax error in SQL file');
