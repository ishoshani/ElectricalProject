
// this will include 2 handlers: one for the login and one for the signup
// the signup handler will create a new user in the cognito user pool
// the login handler will authenticate the user and return a JWT token

import { CognitoIdentityProviderClient, SignUpCommand, InitiateAuthCommand, ConfirmSignUpCommand, AuthFlowType } from  "@aws-sdk/client-cognito-identity-provider";
import { v4 as uuidv4 } from 'uuid';


const cognito = new CognitoIdentityProviderClient({});
cognito.endpoint = "https://cognito-idp.us-east-1.amazonaws.com";
const userPoolId = process.env.UserPool;
const clientId = "2mdo60ksb6s6gpen9khme8i7n6";

export const signUpHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get id and name from the body of the request
    const body = JSON.parse(event.body);
    const email = body.email;
    const password = body.password;
    const name = body.name;

    const signUpCommand = new SignUpCommand({
        ClientId: clientId,
        Username: email,
        Password: password,
        UserAttributes: [
            {
                Name: 'email',
                Value: email
            },
            {
                Name: 'name',
                Value: name
            }
        ]
    });

    try {
        await cognito.send(signUpCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User created' })
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not create user' })
        };
    }
};

export const verifyHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);
    const body = JSON.parse(event.body);
    const email = body.email;
    const code = body.code;
    const command = new ConfirmSignUpCommand({
        ClientId: clientId,
        Username: email,
        ConfirmationCode: code
    });
    try{
        await cognito.send(command);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User verified' })
        };
    }

    catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not verify user' })
        };
    }
}

export const loginHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get id and name from the body of the request
    const body = JSON.parse(event.body);
    const email = body.email;
    const password = body.password;

    const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
        ClientId: clientId,
      });

    try {
        const data = await cognito.send(command);
        return {
            statusCode: 200,
            body: JSON.stringify({ token: data.AuthenticationResult.AccessToken })
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not authenticate user' })
        };
    }
}