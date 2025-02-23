# ElectricalWriteAWS

## Summary

This project demonstrates how you could use AWS resources to set up a simple electrical usage record. It includes the ability to make and login to a cognito user pool, input usage data both manually and via an S3 presigned url csv, view history for a given date period, and set up an alert that causes an SNS to send an email to a given user.

## To build and deploy

1. After cloning the repository, make sure to run npm install
2. install both the AWS CLI and the SAM cli.
3. From you amazon portal, get a user access key with the needed permissions to make all the required resources. You can do this with the root access, but it is not recommended.
4. run aws configure to set up your account. You'll need your access key, secret, and region.
5. run sam build
6. run sam deploy, you'll get a test api-gateway to start testing from!

## Assumptions:
1. Each user has exactly one property they are tracking. 
2. A user can only have one alert threshold. Any more and it could get annoying for them.
3. Another resource will set up UI so that user will not need to set up the JWT token in api calls in actual app.
4. Another resource will handle uploading the CSV to a presigned url.

## Key points
1. Wow, userpools are convenient. 
2. Previously, I would have tried to set up a single handler that branches out for each path. However, by making multiple lambdas that have a single handler, we can scale just the resources we need as we need them.
3. the DynamoDB usage tables are set up with a principle key using a combo of the userID and date and a secondary key for just the userID. This is because I want the inserts from the same user on the same date to replace the old data, since each date can only have one usage stat per user. However, in order to be able to quickly search up all the usages of a user, userId is set up as a secondary index. An alternative would of been to just set up a user table with a nested alerts and usage model, however I chose this as I think taking advantage of the secondary index for setting up queries is faster. I'm more experienced in SQL though, so its possible that there is a query setup where the user model can be queried to return just the usage entries in the requested dates.
4. for similar reasons, the alerts table is set up with UserId as the principle key. This restricts a user to a single alert or no alert, however I decided that is desirable, as it avoid sending complications around a usage stat passing multiple alert thresholds and adding multiple pushes to the topic.

## Key Places for Improvement:
1. With more time, I would of liked to actually connect the cognito user pool and the rest of the functions. I couldn't get the JWT token to pass correctly in my testing, and I decided to leave it to focus on getting the rest of design to work.
2. Likewise, with a full cognito user integration, you could set up SNS Topics and subscribers based on the user pool. One way to do this might be a lambda set up as a hook after sign-up which sets up the topic and queue. I worry this would become a resource bloat though. Another thing to do might be to set up a lambda to read and send from the SNS queue, however that seems redundant with the lambda that puts things in the queue?
3. Did not have time for UI intergation for summary and other features. 
4. Not included in this design are ALB or route 53 domain setups. These would be used to actually set up the endpoints and correctly point to them. 