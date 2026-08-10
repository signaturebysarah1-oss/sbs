import { getSettingsMap } from '../repositories/settings.repository.js';
import { env } from '../config/env.js';

// Returns true if the setting is enabled (value is 'true' or not set — default on)
function isEnabled(value: string | null | undefined): boolean {
  return value !== 'false';
}

export async function getNotificationSettings(): Promise<{
  notifyCustomerOnQuote: boolean;
  notifyAdminOnQuote: boolean;
  notifyCustomerOnCart: boolean;
  notifyAdminOnCart: boolean;
  notifyCustomerOnContact: boolean;
  notifyAdminOnContact: boolean;
  notifyCustomerOnAcademy: boolean;
  notifyAdminOnAcademy: boolean;
  notifyCustomerOnOrderStatus: boolean;
  notificationEmail: string;
}> {
  const map = await getSettingsMap([
    'notify_customer_on_quote',
    'notify_admin_on_quote',
    'notify_customer_on_cart',
    'notify_admin_on_cart',
    'notify_customer_on_contact',
    'notify_admin_on_contact',
    'notify_customer_on_academy',
    'notify_admin_on_academy',
    'notify_customer_on_order_status',
    'notification_email',
  ]);

  return {
    notifyCustomerOnQuote: isEnabled(map['notify_customer_on_quote']),
    notifyAdminOnQuote: isEnabled(map['notify_admin_on_quote']),
    notifyCustomerOnCart: isEnabled(map['notify_customer_on_cart']),
    notifyAdminOnCart: isEnabled(map['notify_admin_on_cart']),
    notifyCustomerOnContact: isEnabled(map['notify_customer_on_contact']),
    notifyAdminOnContact: isEnabled(map['notify_admin_on_contact']),
    notifyCustomerOnAcademy: isEnabled(map['notify_customer_on_academy']),
    notifyAdminOnAcademy: isEnabled(map['notify_admin_on_academy']),
    notifyCustomerOnOrderStatus: isEnabled(map['notify_customer_on_order_status']),
    notificationEmail: map['notification_email'] ?? env.notificationEmail,
  };
}
