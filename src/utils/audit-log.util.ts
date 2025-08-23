import logger from "@config/winston";
import { IAuditLog } from "@modules/audit-log/audit-log.interface";
import { AuditLogModel } from "@modules/audit-log/audit-log.model";

/**
 * Utility class for logging audit trails.
 */
export class AuditLogUtil {
  /**
   * Logs an audit event to the database.
   * @param entityType The type of entity being audited (e.g., 'User', 'Post').
   * @param entityId The ID of the entity.
   * @param action The action performed (e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN').
   * @param oldValue The state of the entity before the change (optional).
   * @param newValue The state of the entity after the change (optional).
   * @param changedBy The ID of the user who performed the action (optional).
   * @param ipAddress The IP address from which the action originated (optional).
   * @param userAgent The user agent string of the client (optional).
   */
  async logAudit(
    entityType: string,
    entityId: string,
    action: string,
    oldValue: any = null,
    newValue: any = null,
    changedBy: string | null = null,
    ipAddress: string | null = null,
    userAgent: string | null = null,
  ): Promise<IAuditLog | null> {
    try {
      const auditLog = await AuditLogModel.create({
        entityType,
        entityId,
        action,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        changedBy,
        ipAddress,
        userAgent,
        userId: entityType === "user" ? entityId : changedBy || undefined,
        fileId: entityType === "file" ? entityId : undefined,
      });
      logger.debug(`Audit Logged: ${action} on ${String(entityType)} (ID: ${entityId}) by ${changedBy || "System"}`);
      return auditLog;
    } catch (error) {
      logger.error(`Failed to log audit for ${String(entityType)} (ID: ${entityId}, Action: ${action}):`, error);
      return null;
    }
  }
}
