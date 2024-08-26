# Create REST API 
resource "aws_api_gateway_rest_api" "api" {
  name        = "Authentication API"
  description = "REST API for Authentication Service"
  body        = templatefile("api-schema.json", { url = aws_lambda_function.auth_lambda.invoke_arn })
}

# Permissions for API Gateway to invoke Lambda
resource "aws_lambda_permission" "invoke" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  statement_id  = "${aws_api_gateway_rest_api.api.id}_LambdaPermission_APIGateway"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*/authenticate"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = "testing"

  depends_on = [aws_lambda_permission.invoke]
}
