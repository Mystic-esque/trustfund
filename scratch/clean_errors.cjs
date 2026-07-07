const fs = require('fs');
const path = require('path');

function cleanErrors(fileRelPath) {
  const fullPath = path.join(process.cwd(), fileRelPath);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Find the block where Nomba API error is handled
  // Currently:
  // const errorText = await transferRes.text();
  // return new Response(JSON.stringify({ error: `Nomba API Error: ${errorText}` }), ...
  
  const safeErrorHandling = `
      const errorText = await transferRes.text();
      let cleanMessage = "The payment gateway declined the transaction.";
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.message) {
          cleanMessage = errJson.message;
        } else if (errJson.description) {
          cleanMessage = errJson.description;
        }
      } catch(e) {}
      
      console.error("Nomba API Error:", errorText);
  `;

  if (fileRelPath.includes('manual-withdraw')) {
    content = content.replace(
      /const errorText = await transferRes\.text\(\);\s*return new Response\(JSON\.stringify\(\{ error: `Nomba API Error: \$\{errorText\}` \}\).*?;/g,
      `${safeErrorHandling}
      return new Response(JSON.stringify({ error: \`Withdrawal failed: \$\{cleanMessage\}\` }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });`
    );
  } else if (fileRelPath.includes('settle-order')) {
    // In settle-order, we have:
    // const errorText = await transferRes.text();
    // console.error("Nomba API Error:", errorText);
    // ...
    // return new Response(JSON.stringify({ success: true, method: 'internal', message: `Auto-payout failed, funds settled to TrustFund wallet: ${errorText}` })
    content = content.replace(
      /const errorText = await transferRes\.text\(\);\s*console\.error\("Nomba API Error:", errorText\);/g,
      safeErrorHandling
    );
    content = content.replace(
      /Auto-payout failed, funds settled to TrustFund wallet: \$\{errorText\}/g,
      `Auto-payout failed (\${cleanMessage}). Funds safely settled to your TrustFund wallet.`
    );
  }

  // Also clean up generic error throws
  content = content.replace(
    /return new Response\(JSON\.stringify\(\{ error: err\.message \}\)/g,
    `return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again later." })`
  );

  fs.writeFileSync(fullPath, content);
  console.log(`Cleaned errors in ${fileRelPath}`);
}

cleanErrors('supabase/functions/manual-withdraw/index.ts');
cleanErrors('supabase/functions/settle-order/index.ts');
