import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const client = new SSMClient();

export const getSecret = async (name: string) => {
  const input = {
    Name: name,
    WithDecryption: true,
  };
  const command = new GetParameterCommand(input);
  const response = await client.send(command);
  return response.Parameter?.Value;
};