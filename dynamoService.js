import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDB } from "./awsClients.js";
import { v4 as uuidv4 } from "uuid";

// Fetch interview questions using PK/SK schema
export async function getProjectQuestions(projectId) {
  const result = await dynamoDB.send(
    new QueryCommand({
      TableName: "ResearchData",
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": `PROJECT#${projectId}`,
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    throw new Error(`Project not found: ${projectId}`);
  }

  // Find the METADATA item which has project details
  const metadata = result.Items.find((item) => item.SK === "METADATA");
  if (!metadata) {
    throw new Error(`Project metadata not found: ${projectId}`);
  }

  // Return questions array
  if (!metadata.questions || metadata.questions.length === 0) {
    throw new Error(`No questions found for project: ${projectId}`);
  }

  return metadata.questions;
}

// Save completed interview
export async function saveInterview(projectId, personDetails, conversation) {
  const interviewId = uuidv4();
  const timestamp = new Date().toISOString();

  await dynamoDB.send(
    new PutCommand({
      TableName: "Interviews",
      Item: {
        interviewId,
        projectId,
        personDetails,
        conversation,
        completedAt: timestamp,
      },
    })
  );

  return interviewId;
}