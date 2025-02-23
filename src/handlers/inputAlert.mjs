
// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { convertDateStringToTimestamp } from '../utility/dates.mjs';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);


// Get the DynamoDB table name from environment variables
const tableName = process.env.AlertTableName;

const inputAlert = (userId, kw) => {
    return {
        userId: userId,
        threshold: kw
    }
}

const AddInputAlert = async (input) => {
    var params = {
        TableName: tableName,
        Item: input
    };
    try {
        const data = await ddbDocClient.send(new PutCommand(params));
        console.log("Success - manual Alert entry added or updated", data);
    } catch (err) {
        console.log("Error", err.stack);
        throw new Error("Error in adding alert: "+err);
    }
}

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get id and name from the body of the request
    const body = JSON.parse(event.body);
    const userId = body.userId;
    const kw = body.threshold;
    try{
    const input = inputAlert(userId, kw);
    AddInputAlert(input);
    const response = {
        statusCode: 200,
        body: JSON.stringify(body)
    };
    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
    } catch (e){
        const response = {
            statuscode: 500,
            errorText: "something went wrong: "+e
        }
        console.info("failure: "+e);
        return response;
    }
}