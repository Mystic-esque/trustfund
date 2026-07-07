const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'supabase/functions/nomba-proxy/index.ts');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('action === "balance"')) {
  const balanceCode = `
    if (action === "balance") {
      const res = await fetch(\`\${baseUrl}/accounts/accounts\`, {
        method: "GET",
        headers: {
          "Authorization": \`Bearer \${token}\`,
          "accountId": parentAccountId,
        }
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
`;
  content = content.replace(/if \(action === "lookup"\) \{/, balanceCode + '\n    if (action === "lookup") {');
  fs.writeFileSync(file, content);
  console.log("Added balance action to nomba-proxy");
}
