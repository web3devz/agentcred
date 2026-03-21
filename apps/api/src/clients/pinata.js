const PINATA_ENDPOINT = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

export async function pinJsonToIpfs(payload) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error('pinata_not_configured');
  }

  const res = await fetch(PINATA_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`pinata_error:${res.status}:${txt}`);
  }

  const data = await res.json();
  const cid = data.IpfsHash;
  if (!cid) throw new Error('pinata_missing_cid');

  return {
    cid,
    gateway: `https://gateway.pinata.cloud/ipfs/${cid}`,
    uri: `ipfs://${cid}`,
  };
}
