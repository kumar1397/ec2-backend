import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { PollyClient } from "@aws-sdk/client-polly";
import { TranscribeStreamingClient } from "@aws-sdk/client-transcribe-streaming";
import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const awsConfig = {
  region: process.env.AWS_REGION,
};

const dynamoDBClient = new DynamoDBClient(awsConfig);
export const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);
export const polly = new PollyClient(awsConfig);
export const transcribeClient = new TranscribeStreamingClient(awsConfig);

// S3 uses different region
export const s3 = new S3Client({
  region: process.env.S3_REGION || "ap-southeast-1",
});