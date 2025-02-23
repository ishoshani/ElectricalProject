
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import {SNSClient, PublishCommand, CreateTopicCommand} from '@aws-sdk/client-sns';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const snsClient = new SNSClient({});
const topicName = process.env.AlertTopicName;
let topicArn;
const tableName = process.env.AlertTableName;

export const createTopicAndGetArn = async (topicName) => {
    const command = new CreateTopicCommand({
        Name: topicName
    });

    try {
        const data = await snsClient.send(command);
        return data.TopicArn;
    } catch (error) {
        console.log(error);
        throw new Error("Could not create topic");
    }
}

//for a userId, get the alert threshold
export const getAlertThreshold = async (userId) => {
    const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        },
    });

    try {
        const data = await ddbDocClient.send(command);
        return data.Items[0].threshold;
    } catch (error) {
        console.log(error);
        throw new Error("Could not retrieve alert threshold");
    }
}

//add an message about the theshold being exceeded to the sns topic
export const addAlert = async (userId, usage, threshold) => {
    
    const command = new PublishCommand({
        topicName: topicArn,
        Message: JSON.stringify({userId: userId, Message: `usage exceeded threshold: ${usage} > ${threshold}`})
    });

    try {
        const data = await snsClient.send(command);
        console.log("Success - alert sent", data);
    } catch (error) {
        console.log(error);
        throw new Error("Could not send alert");
    }
}

//hadler triggers on DynamoDB record event. It will add an event to the sns topic when threshold exceeded
export const AlertTriggerHandler = async (event) => {
    console.info('received:', event);
    const records = event.Records;
    if (!topicArn){
        topicArn = await createTopicAndGetArn(topicName);
    }
    for (const record of records){
        const userId = record.dynamodb.NewImage.userId.S;
        const usage = record.dynamodb.NewImage.usage.N;
        const threshold = await getAlertThreshold(userId);
        if (usage > threshold){
            //send alert
            addAlert(userId, usage, threshold);
        }
    }
    return records;
}
