async function getBalance() {
  const authUrl = "https://sandbox.nomba.com/v1/auth/token/issue";
  const parentAccountId = "f666ef9b-888e-4799-85ce-acb505b28023";
  const subAccountId = "85972410-bc12-4928-b690-f0b60b32a951";
  const baseUrl = "https://sandbox.nomba.com/v1";

  // 1. Get Token
  const authRes = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "accountId": parentAccountId
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: "706df6c4-b8bb-4130-88c4-d21b052f8631",
      client_secret: "k8UobYk3APgOoxUnNL7VpuxzwTsH4LsXtydfjcHs8RH0YISBB4OMqJsaafG+U8fWETu9YZ96bNXE+DelCDuMPw=="
    })
  });

  const authJson = await authRes.json();
  const token = authJson.data.access_token;

  // Run the exact user requested snippet:
  const balRes = await fetch(
    `${baseUrl}/accounts/${subAccountId}/balance`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accountId': parentAccountId
      }
    }
  );
  const bal = await balRes.json();
  console.log('Sub-account balance:', JSON.stringify(bal, null, 2));
}

getBalance();
