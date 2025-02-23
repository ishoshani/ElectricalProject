import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { convertDateStringToTimestamp, convertTimestampToDateString } from '../utility/dates.mjs';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.UsageTableName;

//takes the table response and turns it into  {date, usage} objects
export const buildResponseBody = (data) => {
    return data.Items.map((item) => {
        return {date:convertTimestampToDateString(item.timestamp), usage: item.usage};
    });
}

export const handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`getMethod only accept GET method, you tried: ${event.httpMethod}`);
      }
      // All log statements are written to CloudWatch
      console.info('received:', event);
    const userId = event['queryStringParameters']['id'];
    let startDate = 0;
    let endDate = new Date().getTime();;
    // set max start and and end dates when not provided
    if (event['queryStringParameters']['startDate']) {
        startDate = convertDateStringToTimestamp(event['queryStringParameters']['startDate']);
    }
    if (event['queryStringParameters']['endDate']) {
        endDate = convertDateStringToTimestamp(event['queryStringParameters']['endDate']);
    }

    const command = new QueryCommand({
        TableName: tableName,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId AND #timestamp BETWEEN :startDate AND :endDate',
        ExpressionAttributeNames: {
            '#timestamp': 'timestamp'
        },
        ExpressionAttributeValues: {
            ':userId': userId,
            ':startDate': startDate,
            ':endDate': endDate
        },
    });

    try {
        const data = await ddbDocClient.send(command);
        return {
            statusCode: 200,
            body: JSON.stringify(buildResponseBody(data))
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not retrieve entries' })
        };
    }
};