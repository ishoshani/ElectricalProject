// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { convertDateStringToTimestamp } from '../utility/dates.mjs';


const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);


// Get the DynamoDB table name from environment variables
const tableName = process.env.UsageTableName;

/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */


// fetch the raw csv data from the url
export async function getCSVfromUrl(url){
    // fetch the data from the url
    const response = await fetch(url);
    const data = await response.text();
    return data;
}

// parse the csv data into an array of objects

export function parseCSV(userID, data){
    const rows = data.split('\n');
    const entries = [];
    //skip i = 0 because it is the header
    for (let i = 1; i < rows.length; i++){
        const row = rows[i].split(',');
        const date = row[0];
        const usage = row[1];
        const entry = {
            id: userID+row[0],
            userId: userID,
            timestamp: convertDateStringToTimestamp(date),
            usage: parseFloat(usage)
        }
        entries.push(entry);
    }
    return entries;
}

// add the entries to the database
export async function addEntries(entries){
    const command = new BatchWriteCommand({
        RequestItems: {
            [tableName]: entries.map((entry) => {
                return {
                    PutRequest: {
                        Item: entry
                    }
                }
            })
}})
    try {
        const data = await ddbDocClient.send(command);
        console.log("Success - entries added", data);
        return entries.length;
      } catch (err) {
        console.log("Error", err.stack);
        throw new Error("Error in adding entries: "+err);
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
    const url = body.url;



    
    try{
    const data = await getCSVfromUrl(url);
    const entries = parseCSV(userId, data);
    const added = await addEntries(entries);
    
    const response = {
        statusCode: 201,
        body: JSON.stringify({"message": `${added} entries added`})
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
