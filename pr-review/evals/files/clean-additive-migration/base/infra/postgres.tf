resource "aws_db_instance" "orders" {
  identifier     = "orders-prod"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.xlarge"
}
