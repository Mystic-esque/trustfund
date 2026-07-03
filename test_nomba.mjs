const fetch = globalThis.fetch || (await import('node-fetch')).default;

async function runTests() {
  const authUrl = "https://api.nomba.com/v1/auth/token/issue";
  const parentAccountId = "f666ef9b-888e-4799-85ce-acb505b28023";
  const clientId = "e5e85b13-f560-4643-814e-c87435dbbc15";
  const clientSecret = "8/doS7Q3w77EANpk3vpgSrc05hhOiRWp3eBs01sXyZ1AmovtZUXlmrxie+xnEF2tR4q79t0IFufMD1d4JrkT8g==";
  const subAccountId = process.argv[2];

  if (!subAccountId) {
    console.error("Please provide the subAccountId as an argument.");
    process.exit(1);
  }

  // 1. Get Token
  const authRes = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "accountId": parentAccountId
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret
    })
  });
  const authData = await authRes.json();
  const token = authData.data.access_token;

  console.log("=========================================");
  console.log("Request 1: List Virtual Accounts on Parent");
  console.log("GET https://api.nomba.com/v1/accounts/virtual");
  console.log("Headers: accountId: " + parentAccountId);
  console.log("=========================================");
  
  const req1Res = await fetch("https://api.nomba.com/v1/accounts/virtual", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "accountId": parentAccountId
    }
  });
  console.log("Status:", req1Res.status);
  console.log("Data:", JSON.stringify(await req1Res.json(), null, 2));


  console.log("\n=========================================");
  console.log("Request 2: Fetch Sub-account Details");
  console.log(`GET https://api.nomba.com/v1/accounts/${subAccountId}`);
  console.log("Headers: accountId: " + parentAccountId);
  console.log("=========================================");

  const req2Res = await fetch(`https://api.nomba.com/v1/accounts/${subAccountId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "accountId": parentAccountId
    }
  });
  console.log("Status:", req2Res.status);
  console.log("Data:", JSON.stringify(await req2Res.json(), null, 2));

}

runTests();
