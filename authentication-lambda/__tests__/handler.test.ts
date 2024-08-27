import type { APIGatewayProxyEvent } from 'aws-lambda'
import { checkCredentials, handler } from '../src/handler'
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb"
import bcryptjs from 'bcryptjs'
import LambdaTester from 'lambda-tester'
import fs from 'fs'
import path from 'path'

jest.mock('@aws-sdk/client-dynamodb')
jest.mock('bcryptjs')

const testAuthHeader = 'Basic YWRtaW46ZXBwZW5kb3Jm'
const testHashedPassword = '$2a$10$saltastringthatseemsrandom'


// Test suite to test the checkCredentials function
describe('checkCredentials', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    it("should return true if credentials are valid", async () => {
        (DynamoDBClient.prototype.send as jest.Mock).mockResolvedValueOnce({
            Count: 1,
            Items: [{
                password: {
                    S: testHashedPassword
                }
            }]
        });
        (bcryptjs.compare as jest.Mock).mockResolvedValueOnce(true)

        const result = await checkCredentials(testAuthHeader)
        expect(result).toBeTruthy()
        expect(DynamoDBClient.prototype.send).toHaveBeenCalledWith(expect.any(QueryCommand))
        expect(bcryptjs.compare).toHaveBeenCalledTimes(1)
    })

    it('should throw an error if not using Basic auth', async () => {
        const nonBasicAuthHeader = 'Bearer YWRtaW46ZXBwZW5kb3Jm'

        await expect(checkCredentials(nonBasicAuthHeader)).rejects.toThrow('Only Basic authentication is supported')
    })

    it('should throw an error if Authorization header is not in correct format', async () => {
        const invalidFormatAuthHeader = 'Basic YWRtaW4='

        await expect(checkCredentials(invalidFormatAuthHeader)).rejects.toThrow('Invalid Authorization header format')
    })

    it('should return false if no user found with given username', async () => {

        (DynamoDBClient.prototype.send as jest.Mock).mockResolvedValueOnce({
            Count: 0,
            Items: []
        })

        const result = await checkCredentials(testAuthHeader)
        expect(result).toBeFalsy()
    })

    it('should return false if passwords do not match', async () => {


        (DynamoDBClient.prototype.send as jest.Mock).mockResolvedValueOnce({
            Count: 1,
            Items: [{
                password: {
                    S: testHashedPassword
                }
            }]
        });
        (bcryptjs.compare as jest.Mock).mockResolvedValueOnce(false)

        const result = await checkCredentials(testAuthHeader)
        expect(result).toBeFalsy()
    })

    it('should throw an error if DynamoDB query command fails', async () => {

        (DynamoDBClient.prototype.send as jest.Mock).mockRejectedValueOnce(new Error('Query command failed'))

        await expect(checkCredentials(testAuthHeader)).rejects.toThrow('Query command failed')
    })


})

// Test suite for the Lambda Function
describe('Lambda Function', () => {
    let event: APIGatewayProxyEvent
    let context: AWSLambda.Context

    beforeEach(() => {
        const eventFilePath = path.join(__dirname, '../utils/event.json')
        const eventRawData = fs.readFileSync(eventFilePath, 'utf8')
        event = JSON.parse(eventRawData)
        context = {} as AWSLambda.Context
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('runs correctly with valid input', async () => {
        await LambdaTester(handler)
            .event(event)
            .context(context)
            .expectResult((result) => {
                expect(result).toBeDefined()
            })
    })

    it('returns 200 when credentials are valid', async () => {

        (DynamoDBClient.prototype.send as jest.Mock).mockResolvedValueOnce({
            Count: 1,
            Items: [{
                password: {
                    S: testHashedPassword
                }
            }]
        });

        (bcryptjs.compare as jest.Mock).mockResolvedValueOnce(true)

        await LambdaTester(handler)
            .event(event)
            .expectResult((result) => {
                expect(result.statusCode).toBe(200)
                expect(JSON.parse(result.body)).toEqual({ message: 'Authorized' })
            })
    })


    it('returns 401 with invalid input', async () => {
        const invalidEvent = { ...event, headers: { Authorization: '' } }

        await LambdaTester(handler)
            .event(invalidEvent)
            .context(context)
            .expectResult((result) => {
                expect(result.statusCode).toBe(401)
            })
    })


    it('returns error on handler failure', async () => {
        const failingHandler = () => Promise.reject(new Error("Failed"))

        await LambdaTester(failingHandler)
            .event(event)
            .context(context)
            .expectError((err: Error) => {
                expect(err).toBeDefined()
                expect(err.message).toBe("Failed")
            })
    })

    it('should return 500 if bcrypt compare fails', async () => {
        // Force bcrypt.compare to throw an error
        (bcryptjs.compare as jest.Mock).mockImplementationOnce(() => {
            throw new Error('Bcrypt comparison failed')
        })

        await LambdaTester(handler)
            .event(event)
            .expectResult((result) => {
                expect(result.statusCode).toBe(500)
                expect(JSON.parse(result.body)).toEqual({ message: 'Internal Server Error' })
            })
    })

})
