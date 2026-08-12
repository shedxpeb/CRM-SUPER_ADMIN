-- AlterEnum
BEGIN;
CREATE TYPE "TenantStatus_new" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
ALTER TABLE "public"."tenants" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tenants" ALTER COLUMN "status" TYPE "TenantStatus_new" USING ("status"::text::"TenantStatus_new");
ALTER TYPE "TenantStatus" RENAME TO "TenantStatus_old";
ALTER TYPE "TenantStatus_new" RENAME TO "TenantStatus";
DROP TYPE "public"."TenantStatus_old";
ALTER TABLE "tenants" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_userId_fkey";

-- DropForeignKey
ALTER TABLE "backup_artifacts" DROP CONSTRAINT "backup_artifacts_backupJobId_fkey";

-- DropForeignKey
ALTER TABLE "billing_events" DROP CONSTRAINT "billing_events_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "billing_events" DROP CONSTRAINT "billing_events_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "invoice_line_items" DROP CONSTRAINT "invoice_line_items_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "plan_features" DROP CONSTRAINT "plan_features_planId_fkey";

-- DropForeignKey
ALTER TABLE "plan_limits" DROP CONSTRAINT "plan_limits_planId_fkey";

-- DropForeignKey
ALTER TABLE "platform_notifications" DROP CONSTRAINT "platform_notifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_planId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_createdById_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "tenant_feature_overrides" DROP CONSTRAINT "tenant_feature_overrides_featureFlagKey_fkey";

-- DropForeignKey
ALTER TABLE "tenant_feature_overrides" DROP CONSTRAINT "tenant_feature_overrides_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "tenant_module_overrides" DROP CONSTRAINT "tenant_module_overrides_moduleKey_fkey";

-- DropForeignKey
ALTER TABLE "tenant_settings" DROP CONSTRAINT "tenant_settings_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "tenant_usages" DROP CONSTRAINT "tenant_usages_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_planId_fkey";

-- DropForeignKey
ALTER TABLE "ticket_messages" DROP CONSTRAINT "ticket_messages_ticketId_fkey";

-- DropIndex
DROP INDEX "tenants_planId_idx";

-- DropIndex
DROP INDEX "tenants_status_planId_idx";

-- DropIndex
DROP INDEX "tenants_subscriptionId_key";

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "allowCustomBranding",
DROP COLUMN "featureOverrides",
DROP COLUMN "planId",
DROP COLUMN "subscriptionId",
DROP COLUMN "trialEndsAt",
ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
ALTER COLUMN "maxUsers" SET DEFAULT 25,
ALTER COLUMN "maxStorageGB" SET DEFAULT 10;

-- DropTable
DROP TABLE "announcements";

-- DropTable
DROP TABLE "api_consumers";

-- DropTable
DROP TABLE "api_keys";

-- DropTable
DROP TABLE "backup_artifacts";

-- DropTable
DROP TABLE "backup_jobs";

-- DropTable
DROP TABLE "billing_events";

-- DropTable
DROP TABLE "broadcasts";

-- DropTable
DROP TABLE "coupons";

-- DropTable
DROP TABLE "dead_letter_events";

-- DropTable
DROP TABLE "distributed_locks";

-- DropTable
DROP TABLE "encryption_keys";

-- DropTable
DROP TABLE "feature_flags";

-- DropTable
DROP TABLE "idempotency_keys";

-- DropTable
DROP TABLE "invoice_line_items";

-- DropTable
DROP TABLE "invoices";

-- DropTable
DROP TABLE "jobs";

-- DropTable
DROP TABLE "maintenance_windows";

-- DropTable
DROP TABLE "notification_deliveries";

-- DropTable
DROP TABLE "outbox_events";

-- DropTable
DROP TABLE "payments";

-- DropTable
DROP TABLE "plan_features";

-- DropTable
DROP TABLE "plan_limits";

-- DropTable
DROP TABLE "platform_files";

-- DropTable
DROP TABLE "platform_modules";

-- DropTable
DROP TABLE "platform_notifications";

-- DropTable
DROP TABLE "provisioning_jobs";

-- DropTable
DROP TABLE "rate_limit_policies";

-- DropTable
DROP TABLE "secret_history";

-- DropTable
DROP TABLE "sequence_counters";

-- DropTable
DROP TABLE "subscription_plans";

-- DropTable
DROP TABLE "subscriptions";

-- DropTable
DROP TABLE "support_tickets";

-- DropTable
DROP TABLE "tenant_feature_overrides";

-- DropTable
DROP TABLE "tenant_settings";

-- DropTable
DROP TABLE "tenant_usage_current";

-- DropTable
DROP TABLE "tenant_usages";

-- DropTable
DROP TABLE "ticket_messages";

-- DropTable
DROP TABLE "webhook_deliveries";

-- DropTable
DROP TABLE "webhook_keys";

-- DropEnum
DROP TYPE "AnnouncementStatus";

-- DropEnum
DROP TYPE "BackupArtifactStatus";

-- DropEnum
DROP TYPE "BackupStatus";

-- DropEnum
DROP TYPE "BackupType";

-- DropEnum
DROP TYPE "BillingCycle";

-- DropEnum
DROP TYPE "BillingEventType";

-- DropEnum
DROP TYPE "CouponType";

-- DropEnum
DROP TYPE "EncryptionKeyStatus";

-- DropEnum
DROP TYPE "IdempotencyKeyStatus";

-- DropEnum
DROP TYPE "InvoiceStatus";

-- DropEnum
DROP TYPE "JobStatus";

-- DropEnum
DROP TYPE "MaintenanceStatus";

-- DropEnum
DROP TYPE "NotificationDeliveryStatus";

-- DropEnum
DROP TYPE "NotificationDeliveryType";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "OutboxEventStatus";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "ProvisioningJobStatus";

-- DropEnum
DROP TYPE "ProvisioningJobStep";

-- DropEnum
DROP TYPE "SubscriptionStatus";

-- DropEnum
DROP TYPE "TicketMessageType";

-- DropEnum
DROP TYPE "TicketPriority";

-- DropEnum
DROP TYPE "TicketSource";

-- DropEnum
DROP TYPE "TicketStatus";

-- DropEnum
DROP TYPE "VerificationStatus";

-- DropEnum
DROP TYPE "VirusStatus";

-- DropEnum
DROP TYPE "WebhookDeliveryStatus";

-- CreateIndex
CREATE INDEX "tenants_crmOrganizationId_idx" ON "tenants"("crmOrganizationId");