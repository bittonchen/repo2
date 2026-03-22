# =============================================================================
# VetFlow — Terraform Outputs
# =============================================================================

output "api_url" {
  description = "URL for the API service (via ALB)"
  value       = "http://${aws_lb.main.dns_name}/api"
}

output "web_url" {
  description = "URL for the Web application (via ALB)"
  value       = "http://${aws_lb.main.dns_name}"
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain for file uploads"
  value       = aws_cloudfront_distribution.uploads.domain_name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint (host:port)"
  value       = aws_db_instance.postgres.endpoint
}

output "s3_bucket" {
  description = "S3 bucket name for file uploads"
  value       = aws_s3_bucket.uploads.id
}

output "ecr_api_url" {
  description = "ECR repository URL for the API image"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_web_url" {
  description = "ECR repository URL for the Web image"
  value       = aws_ecr_repository.web.repository_url
}
