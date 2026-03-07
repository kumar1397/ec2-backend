import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDB } from "./awsClients.js";
import { v4 as uuidv4 } from "uuid";

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

  const metadata = result.Items.find((item) => item.SK === "METADATA");
  if (!metadata) {
    throw new Error(`Project metadata not found: ${projectId}`);
  }

  if (!metadata.questions || metadata.questions.length === 0) {
    throw new Error(`No questions found for project: ${projectId}`);
  }

  return metadata.questions;
}

export async function saveInterview(projectId, personDetails, conversation) {
  const respondentId = uuidv4(); // ← matches your table's key
  const timestamp = new Date().toISOString();

  await dynamoDB.send(
    new PutCommand({
      TableName: "Interviews",
      Item: {
        respondentId,  // ← primary key your table expects
        projectId,
        personDetails,
        conversation,
        completedAt: timestamp,
      },
    })
  );

  return respondentId;
}