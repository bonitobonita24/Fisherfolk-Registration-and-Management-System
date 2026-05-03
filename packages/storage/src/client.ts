import { S3Client } from "@aws-sdk/client-s3";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

let client: S3Client | undefined;

export function getStorageClient(): S3Client {
  if (client === undefined) {
    client = new S3Client({
      endpoint: getRequiredEnv("STORAGE_ENDPOINT"),
      region: process.env["STORAGE_REGION"] ?? "us-east-1",
      credentials: {
        accessKeyId: getRequiredEnv("STORAGE_ACCESS_KEY"),
        secretAccessKey: getRequiredEnv("STORAGE_SECRET_KEY"),
      },
      forcePathStyle: true,
    });
  }
  return client;
}

export function getBucket(): string {
  return getRequiredEnv("STORAGE_BUCKET");
}
