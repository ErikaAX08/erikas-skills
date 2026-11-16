terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.40" }
  }
}

resource "aws_db_instance" "orders" {
  identifier          = "orders-prod"
  engine              = "postgres"
  engine_version      = "15.5"
  instance_class      = "db.m6g.large"
  allocated_storage   = 200
  username            = "orders"
  manage_master_user_password = true
  skip_final_snapshot = true
  storage_encrypted   = true
}
