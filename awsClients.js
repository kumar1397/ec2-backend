import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { PollyClient } from "@aws-sdk/client-polly";
import { TranscribeStreamingClient } from "@aws-sdk/client-transcribe-streaming";
import dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";


dotenv.config();

const awsConfig = {
  region: process.env.AWS_REGION,
};

const dynamoDBClient = new DynamoDBClient(awsConfig);
export const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);
export const polly = new PollyClient(awsConfig);
export const transcribeClient = new TranscribeStreamingClient(awsConfig);
export const s3 = new S3Client({ region: process.env.AWS_REGION });