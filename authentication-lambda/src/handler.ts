import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb"
import bcryptjs from 'bcryptjs'


const checkCredentials = async (authHeader: string): Promise<boolean> => {
    try {
        const [type, base64Credentials] = authHeader.split(' ')
        if (type !== "Basic") throw new Error("Only Basic authentication is supported")

        const dbClient = new DynamoDBClient({ region: 'eu-central-1' })

        // Decode base64 credentials and split them into username and password
        const credentials = Buffer.from(base64Credentials, 'base64').toString().split(':')
        if (credentials.length < 2) throw new Error('Invalid Authorization header format')

        const username = credentials[0]
        const password = credentials[1]

        // Setting up parameters for querying the UserTable in DynamoDB
        const params = {
            TableName: "UserTable",
            IndexName: "UsernameIndex",
            KeyConditionExpression: '#uname = :uname',
            ExpressionAttributeNames: {
                '#uname': 'username'
            },
            ExpressionAttributeValues: {
                ':uname': { S: username }
            }
        }


        const result = await dbClient.send(new QueryCommand(params))
        console.log('DynamoDb Query Result:', JSON.stringify(result))

        // We're assuming that our system doesn't allow multiple users with the same username
        if (result.Items && result.Count === 1 && result.Items[0].password.S) {
            const hashedPassword = result.Items[0].password.S
            return await bcryptjs.compare(password, hashedPassword)
        }
    } catch (err) {
        // Log the error detail and then rethrow it so that it can be dealt with in the main handler
        console.error('Error occurred while checking credentials:', err)
        throw err
    }
    return false
}

// Function to provide unauthorized response
const unauthorized = (message: string): APIGatewayProxyResult => {
    return {
        statusCode: 401,
        body: JSON.stringify({
            message: message
        })
    }
}

// Main Lambda handler function
exports.handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const authHeader = event.headers['Authorization']

    if (!authHeader) {
        return unauthorized('No Authorization header provided')
    }

    try {
        // Check if the provided credentials are valid
        if (!(await checkCredentials(authHeader))) {
            return unauthorized('Unauthorized')
        }
    } catch (err) {
        // In case of any unhandled errors, log the error and return 500 Internal Server Error
        console.error(err)
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal Server Error'
            })
        }
    }
    // When the provided credentials pass all checks, return 200 OK
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Authorized'
        })
    }
}