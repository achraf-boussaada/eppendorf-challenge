# Authentication Service

This project deploys an AWS Lambda function written in TypeScript for user authentication. It utilizes an API Gateway and DynamoDB table, with all resources managed using Terraform.

## Why TypeScript, Node.js, bcryptjs and Jest?

- **TypeScript:** Selected for its strong typing, IntelliSense (code completions) and powerful tools for large scale applications. This superset of JavaScript brings the power of static type-checking along with modern ECMAScript features, enhancing developer productivity by catching mistakes early during development.
- **Node.js:** Chosen due to its non-blocking, event-driven architecture, making it suitable for back-end services like this one which needs to handle multiple simultaneous requests efficiently.
- **bcryptjs:** Used for its secure password hashing function. bcryptjs is widely-regarded as a secure choice for password hashing because it incorporates salting (adding random data to each user's password) and adaptive key stretching (increasing computational load over time).
- **Jest:** Jest for testing because it is one of the best JavaScript test runners available. It has a clear and feature-rich API, making writing tests easier and quicker. With features built-in coverage reporting, and a robust mocking library, Jest is a great choice for any scale of project.

## Project Structure

Here is an overview of the general structure of this project:

```plaintext
eppendorf-challenge/
├── authentication-lambda
│   ├── package-lock.json
│   ├── package.json
│   ├── src
│   │   └── lambda.ts
│   ├── tsconfig.json
│   ├── utils
│   │   ├── call-api.ts
│   │   └── event.json
│   └── __tests__
│       └── handler.test.ts
└── infrastructure
    ├── api-gateway.tf
    ├── api-schema.json
    ├── dynamodb.tf
    ├── lambda.tf
    ├── provider.tf
    ├── .terraform.lock.hcl
    └── variables.tf
```

## Setup & Installation

Follow these steps to set up and install the project:

1. Clone the repository to your local machine.
2. Navigate into the `authentication-lambda` directory.
3. Run `npm install` to install all the necessary dependencies listed in `package.json`.

The required modules are already listed in `package.json`, which include:

- Production Dependencies: `@aws-sdk/client-dynamodb`, `bcryptjs`
- Development Dependencies: TypeScript, ESLint, type definitions for AWS-Lambda, Node, bcryptjs, etc., AWS-Lambda-Local for local testing and others.

Please note that `/node_modules` and certain other paths are ignored as described in `.gitignore`.

## Deployment

Prepare the application for deployment by running `npm run zip-lambda`. This script compiles the TypeScript sources, prunes unnecessary packages for production, copies necessary node modules, and finally zips the compiled JS files along with the required node modules into `lambda.zip`.

Afterwards, you can use Terraform to set up the infrastructure. Navigate to the `infrastructure` directory and run `terraform init` to initialize your working directory containing Terraform configuration files. Then run:

```bash
AWS_PROFILE=<PROFILE_NAME> terraform apply -var="aws_account_id=<YOUR_AWS_ACCOUNT_ID>"
```

This command will create the necessary AWS resources.

## Execution

To execute the Lambda function locally, run:

```bash
npm run test:lambda-local
```

This command triggers the Lambda function with the event defined in `utils/event.json`.

To test the API endpoint:

```bash
npm run test:api
```

This command sends a request to the API Gateway which then triggers the Lambda. Please note that `addTestUser()` is commented out by default inside `authenticateTestUser()`. If you are doing a fresh deployment, uncomment `addTestUser()` for the first run of `npm run test:api`. Remember to comment it back out after this initial execution.

Ensure that AWS_PROFILE and API_GATEWAY_URL environment variables are configured correctly before running these commands.

For testing the deployed setup, use the following curl commands:

- Successful scenario:

```bash
curl -X POST https://xs2pqecd73.execute-api.eu-central-1.amazonaws.com/testing/authenticate -H 'Authorization: Basic YWRtaW46ZXBwZW5kb3Jm'
```

- Unsuccessful scenario:

```bash
curl -X POST https://xs2pqecd73.execute-api.eu-central-1.amazonaws.com/testing/authenticate -H 'Authorization: Basic YWRtaW46ZXBwZW5kb3Jy'
```

## QA & Testing

Run `npm run lint` to execute ESLint on all TypeScript and JSON files. This should be done manually if auto-linting isn't configured in your IDE.

The `call-api.ts` and `event.json` under the `utils` directory are purely for testing purposes; they aren't included during packaging and deployment. They're typically not present in this format for real-world projects.

This project contains also unit tests that can be found within `authentication-lambda/__tests__/handler.test.ts`. To run them, execute:

```bash
npm run test
```

This will run your tests located in the tests directory using Jest.
