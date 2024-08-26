# Create AWS KMS key to be used for DynamoDB encryption
resource "aws_kms_key" "dynamo" {
  description             = "KMS key for DynamoDB"
  deletion_window_in_days = 7 # Key can be recovered for 7 days after deletion
}

# Create a DynamoDB table named "UserTable"
resource "aws_dynamodb_table" "UserTable" {
  name     = "UserTable"
  hash_key = "id" # Primary key attribute for the table

  # Definition of primary key attribute "id"
  attribute {
    name = "id"
    type = "S" # S stands for String data type
  }

  # Definition of secondary index based on "username"
  attribute {
    name = "username"
    type = "S"
  }

  # Global Secondary Index configuration
  global_secondary_index {
    name            = "UsernameIndex"
    hash_key        = "username"
    projection_type = "ALL" # All attributes are accessible from the index
  }

  # Table will have On-demand capacity mode
  billing_mode = "PAY_PER_REQUEST"

  # Server-side encryption using a KMS key
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamo.arn
  }

  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }
}
