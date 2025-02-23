// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { convertDateStringToTimestamp } from '../utility/dates.mjs';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);


// Get the DynamoDB table name from environment variables
const tableName = process.env.UsageTableName;

/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */



function makeInputObject(userID, date, KW) {
        return {
            id: userID+date,
            userId: userID,
            timestamp: convertDateStringToTimestamp(date),
            usage: KW
        }
    }
    async function inputSingleEntry(input) {
         // Creates a new item, or replaces an old item with a new item
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
    var params = {
        TableName : tableName,
        Item: input
    };
    try {
        const data = await ddbDocClient.send(new PutCommand(params));
        console.log("Success - manual energy entry added or updated", data);
      } catch (err) {
        console.log("Error", err.stack);
        throw new Error("Error in adding entry: "+err);
      }
    }

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);
    console.info('adding to table '+tableName);

    // Get id and name from the body of the request
    const body = JSON.parse(event.body);
    const userId = body.userId;
    const date = body.date;
    const kw = body.kw;
    const input = makeInputObject(userId, date, kw);
    try{
    await inputSingleEntry(input);
    const response = {
        statusCode: 200,
        body: JSON.stringify({message: "usage added successfully"})
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
};
