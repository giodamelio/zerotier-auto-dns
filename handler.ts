import fetch from 'node-fetch';
import { ScheduledEvent } from 'aws-lambda';
import { Route53 } from 'aws-sdk';

interface MemberConfig {
  ipAssignments: string[]
}

interface Member {
  name: string
  config: MemberConfig
}

async function zerotierRequest(path: string, options = {}): Promise<Member[]> {
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

module.exports.hello = async (event: ScheduledEvent) => {
  // Get info from the ZeroTier API
  const members = await zerotierRequest(`/api/network/${process.env.ZEROTIER_NETWORK_ID}/member`);

  const route53 = new Route53();

  // Make sure the hosted zone exists
  let zone: Route53.GetHostedZoneResponse;
  try {
    zone = await route53.getHostedZone({ Id: (process.env.ROUTE53_HOSTED_ZONE_ID as string) }).promise();
    console.log(`Got ${zone.HostedZone.Id} with name ${zone.HostedZone.Name}`);
  } catch (error) {
    throw new Error(`Route53 Hosted Zone Error: ${error.message}`)
  }

  // Convert members list to Route53 ChangeBatch
  const changeBatch: Route53.ChangeResourceRecordSetsRequest = {
    HostedZoneId: (process.env.ROUTE53_HOSTED_ZONE_ID as string),
    ChangeBatch: {
      Comment: 'Records for ZeroTier members',
      Changes: members.map((member): Route53.Change => {
        return {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: `${member.name}.${zone.HostedZone.Name}`,
            TTL: 60,
            Type: 'A',
            ResourceRecords: member.config.ipAssignments.map((ip: string): Route53.ResourceRecord => {
              return {
                Value: ip,
              };
            })
          }
        };
      }),
    }
  };

  console.log(`About to update ${changeBatch.ChangeBatch.Changes.length} member records`);

  // Update the records
  const changeRequest = await route53.changeResourceRecordSets(changeBatch).promise();

  console.log(`Changes "${changeRequest.ChangeInfo.Comment}" status = ${changeRequest.ChangeInfo.Status}`);

  return {
    message: `Success. ${changeBatch.ChangeBatch.Changes.length} records requested to be updated`,
    event
  };
};
