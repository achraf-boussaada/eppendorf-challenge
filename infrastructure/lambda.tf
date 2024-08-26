# Create an IAM role which Lambda function will assume
resource "aws_iam_role" "iam_for_lambda" {
  name = "iam_for_lambda"

  # Define IAM policy that allows lambda to be assumed by other services
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole", # Allows lambda to assume this role
        Principal = {
          Service = "lambda.amazonaws.com"
        },
        Effect = "Allow",
        Sid    = ""
      },
    ]
  })
}

# Attach the Basic Execution Role policy to our created IAM role.
resource "aws_iam_role_policy_attachment" "iam_for_lambda_attach" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Create an IAM policy for DynamoDB access
resource "aws_iam_policy" "dynamodb_access_policy" {
  name        = "DynamoDBAccessPolicy"
  description = "IAM policy for DynamoDB access for Lambda"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "dynamodb:Query"
        ],
        Resource = "arn:aws:dynamodb:eu-central-1:${var.aws_account_id}:table/UserTable/index/UsernameIndex",
        Effect   = "Allow"
      }
    ]
  })
}

# Attach the created policy to the IAM role
resource "aws_iam_role_policy_attachment" "attach_dynamodb_access_policy" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = aws_iam_policy.dynamodb_access_policy.arn
}


# Create an IAM policy for KMS Decrypt access
resource "aws_iam_policy" "kms_decrypt_policy" {
  name        = "KMSDecryptPolicy"
  description = "IAM policy for KMS key decryption for Lambda"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "kms:Decrypt"
        ],
        Resource = aws_kms_key.dynamo.arn
        Effect   = "Allow"
      }
    ]
  })
}

# Attach the created policy to the IAM role
resource "aws_iam_role_policy_attachment" "attach_kms_decrypt_policy" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = aws_iam_policy.kms_decrypt_policy.arn
}


# Create a new AWS Lambda function named AuthenticationLambda
resource "aws_lambda_function" "auth_lambda" {
  function_name = "AuthenticationLambda"

  # The path to the source code/lambda function code
  filename         = var.source_code_path
  source_code_hash = filebase64sha256(var.source_code_path)

  # The function within your code that Lambda calls to begin execution. 
  handler = "handler.handler"

  # Specify the IAM role that Lambda assumes when it executes your function to access any other AWS resources. 
  role = aws_iam_role.iam_for_lambda.arn

  # The runtime version for the function.
  runtime = "nodejs20.x"

  # Environment variables for the Lambda function
  environment {
    variables = {
      USER_TABLE = aws_dynamodb_table.UserTable.name # Dynamodb table name accessed from environment variable
    }
  }
}
