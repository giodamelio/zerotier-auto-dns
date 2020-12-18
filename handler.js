'use strict';

const fetch = require('node-fetch');

async function zerotierRequest(path, options = {}) {
  const request = await fetch(
    `https://my.zerotier.com/${path}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.ZEROTIER_TOKEN}`
      },
      ...options
    }
  );

  return await request.json();
}

module.exports.hello = async event => {
  // Get info from the ZeroTier API
  const members = await zerotierRequest(`/api/network/${process.env.ZEROTIER_NETWORK_ID}/member`);
  members.forEach(m => {
    console.log(m);
  });


  return {
    message: `Success. ${members.length} network members found`,
    event
  };
};
