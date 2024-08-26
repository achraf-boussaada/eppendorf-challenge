# Common variable for lambda.tf and dynamodb.tf
variable "region" {
  description = "AWS region"
  default     = "eu-central-1"
}

# Used for dynamoDB policy attached to the lambda
variable "aws_account_id" {}

# Used to specifiy the lambda zip file
variable "source_code_path" {
  description = "Path to the source code zip file"
  default     = "../authentication-lambda/lambda.zip"
}
