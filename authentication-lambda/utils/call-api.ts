import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"
import * as bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import axios, { AxiosResponse } from 'axios'


const id = uuidv4()
const validUser = { username: 'admin', password: 'eppendorf' }
const invalidUser = { username: 'admin', password: 'trustMeImAnAdmin' }

// Function to encode user credentials in base64 format
const getBase64Credentials = (username: string, password: string): string => {
    return Buffer.from(`${username}:${password}`).toString('base64')
}

// Use to add a new User
const addTestUser = async (): Promise<void> => {
    // Creating a new instance of DynamoDB client
    const dbClient = new DynamoDBClient({ region: 'eu-central-1' })

    // Generate a salt and hash the password
    const salt = bcryptjs.genSaltSync(10)
    const hashedPassword = bcryptjs.hashSync(validUser.password, salt)

    // Parameters setting for putting item into UserTable 
    const params = {
        TableName: 'UserTable',
        Item: {
            id: { 'S': id },
            username: { 'S': validUser.username },
            password: { 'S': hashedPassword }
        }
    }
    try {
        await dbClient.send(new PutItemCommand(params))
    } catch (error) {
        if (error instanceof Error) {
            // If the error originates from a native JS exception, preserve its original stack trace.
            throw new Error(`Error while creating a new test user: ${error.message}`)
        } else {
            // In case error is from the AWS SDK, it may not be an instance of Error.
            throw new Error(`Error while creating a new test user: ${String(error)}`)
        }
    }
}

const authenticateTestUser = async (): Promise<void> => {
    const apiGatewayUrl = process.env.API_GATEWAY_URL || ''
    try {
        // NOTE: executing this multiple times will create duplicate users. Uncomment only after changing the validUser username property
        // await addTestUser();

        // Making a POST request to the API Gateway URL
        const response: AxiosResponse = await axios.post(apiGatewayUrl, {}, {
            headers: {
                Authorization: `Basic ${getBase64Credentials(validUser.username, validUser.password)}` // will return 200 for validUser and 401 for invalidUser
            }
        })
        console.log(response.data)
    } catch (error) {
        console.log('Error while authenticating test user:', error)
    }
}

authenticateTestUser()
