process.env.PORT = "3000";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/sistempayment_test";
process.env.PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL ?? "http://localhost:8000";
