import type { CartHistoryItem } from '../types/cart.types.js';

// ─── Brand constants ──────────────────────────────────────────────────────────
const BRAND = {
  black: '#0E0E0E',
  gold: '#C9A227',
  offWhite: '#F8F6F2',
  gray: '#EDEAE4',
  logoUrl: 'https://res.cloudinary.com/demo/image/upload/v_placeholder/sbs-logo.png',
  adminBaseUrl: 'https://sb-admin.com',
} as const;

function formatPrice(kobo: number): string {
  return `₦${kobo.toLocaleString('en-NG')}`;
}

function val(v: string | number | null | undefined, fallback = '—'): string {
  if (v === null || v === undefined || v === '') return fallback;
  return String(v);
}

function itemRow(item: CartHistoryItem): string {
  const name = val(item.productNameSnapshot, 'Custom Item');
  const image = item.imageUrlSnapshot
    ? `<img src="${item.imageUrlSnapshot}" alt="${name}" width="72" height="72"
            style="width:72px;height:72px;object-fit:cover;border-radius:4px;display:block;border:1px solid ${BRAND.gray};" />`
    : `<div style="width:72px;height:72px;background:${BRAND.gray};border-radius:4px;display:flex;align-items:center;justify-content:center;">
         <span style="color:#999;font-size:10px;">No image</span>
       </div>`;

  const itemTotal = formatPrice(item.unitPriceSnapshot * item.quantity);
  const productLink = item.productId
    ? `${BRAND.adminBaseUrl}/product/${item.productId}`
    : null;

  return `
  <!--[if mso]><table width="100%"><tr><td><![endif]-->
  <div style="display:table;width:100%;border-collapse:collapse;">
    <div style="
      display:table-row;
      background:${BRAND.offWhite};
      border-radius:6px;
      margin-bottom:12px;
    ">
      <!-- Mobile-first card wrapper -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="border-collapse:collapse;margin-bottom:12px;background:${BRAND.offWhite};border-radius:6px;border:1px solid ${BRAND.gray};">
        <tr>
          <!-- Image cell -->
          <td width="88" valign="top"
              style="padding:16px 0 16px 16px;vertical-align:top;">
            ${image}
          </td>
          <!-- Details cell -->
          <td valign="top" style="padding:16px;vertical-align:top;">
            <p style="margin:0 0 6px 0;font-size:15px;font-weight:600;color:${BRAND.black};font-family:Georgia,serif;">
              ${productLink
                ? `<a href="${productLink}" style="color:${BRAND.black};text-decoration:none;">${name}</a>`
                : name}
            </p>
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              ${item.quantity > 0 ? metaRow('Quantity', String(item.quantity)) : ''}
              ${item.selectedSize != null ? metaRow('Size', String(item.selectedSize)) : ''}
              ${item.selectedColor ? metaRow('Color', item.selectedColor) : ''}
              ${item.selectedMaterial ? metaRow('Material', item.selectedMaterial) : ''}
              ${metaRow('Unit Price', formatPrice(item.unitPriceSnapshot))}
              ${metaRow('Item Total', itemTotal, true)}
            </table>
          </td>
        </tr>
      </table>
    </div>
  </div>
  <!--[if mso]></td></tr></table><![endif]-->`;
}

function metaRow(label: string, value: string, highlight = false): string {
  return `
  <tr>
    <td style="padding:2px 10px 2px 0;font-size:12px;color:#888;font-family:Arial,sans-serif;white-space:nowrap;vertical-align:top;">
      ${label}:
    </td>
    <td style="padding:2px 0;font-size:12px;color:${highlight ? BRAND.gold : BRAND.black};font-weight:${highlight ? '600' : '400'};font-family:Arial,sans-serif;vertical-align:top;">
      ${value}
    </td>
  </tr>`;
}

export interface CartSubmissionEmailData {
  customerName: string;
  customerEmail: string;
  contactMethod: 'email' | 'whatsapp';
  phoneNumber: string | null;
  items: CartHistoryItem[];
  totalSnapshot: number;
  submittedCartId: string;
}

export function buildCartSubmissionEmail(data: CartSubmissionEmailData): string {
  const contactMethodLabel = data.contactMethod === 'whatsapp' ? 'WhatsApp' : 'Email';
  const itemsHtml = data.items.map(itemRow).join('\n');
  const totalFormatted = formatPrice(data.totalSnapshot);
  const itemCount = data.items.reduce((s, i) => s + i.quantity, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>New Cart Submission — Signature By Sarah</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px !important; }
      .email-card   { padding: 24px 16px !important; }
      .header-title { font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.gray};font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:${BRAND.gray};border-collapse:collapse;">
    <tr>
      <td align="center" class="email-wrapper" style="padding:40px 16px;">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:620px;border-collapse:collapse;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- ── Header ── -->
          <tr>
            <td align="center" class="email-card"
                style="background-color:${BRAND.black};padding:36px 40px 28px;">
              <!-- Logo -->
              <img src="${BRAND.logoUrl}"
                   alt="Signature By Sarah"
                   width="130"
                   style="width:130px;max-width:130px;height:auto;display:block;margin:0 auto 20px;" />
              <!-- Brand name -->
              <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${BRAND.gold};font-family:Arial,sans-serif;">
                Signature By Sarah
              </p>
              <h1 class="header-title"
                  style="margin:0;font-size:26px;font-weight:400;color:#ffffff;font-family:Georgia,'Times New Roman',serif;letter-spacing:0.5px;">
                New Cart Submission
              </h1>
              <!-- Gold rule -->
              <div style="width:48px;height:2px;background:${BRAND.gold};margin:18px auto 0;"></div>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td class="email-card" style="padding:36px 40px;">

              <!-- Order type badge -->
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:28px;">
                <tr>
                  <td style="background:${BRAND.offWhite};border-left:3px solid ${BRAND.gold};padding:10px 16px;border-radius:0 4px 4px 0;">
                    <span style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.gold};font-family:Arial,sans-serif;font-weight:600;">
                      Customer Cart Order
                    </span>
                  </td>
                </tr>
              </table>

              <!-- ── Customer details ── -->
              <h2 style="margin:0 0 14px 0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#888;font-family:Arial,sans-serif;font-weight:400;">
                Customer Details
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="border-collapse:collapse;background:${BRAND.offWhite};border-radius:6px;margin-bottom:32px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;">
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#888;font-family:Arial,sans-serif;width:140px;vertical-align:top;">Name</td>
                        <td style="padding:5px 0;font-size:13px;color:${BRAND.black};font-family:Arial,sans-serif;font-weight:600;vertical-align:top;">${val(data.customerName)}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#888;font-family:Arial,sans-serif;vertical-align:top;">Email</td>
                        <td style="padding:5px 0;font-size:13px;color:${BRAND.black};font-family:Arial,sans-serif;vertical-align:top;">
                          <a href="mailto:${data.customerEmail}" style="color:${BRAND.black};text-decoration:none;">${data.customerEmail}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#888;font-family:Arial,sans-serif;vertical-align:top;">Preferred Contact</td>
                        <td style="padding:5px 0;font-size:13px;color:${BRAND.black};font-family:Arial,sans-serif;vertical-align:top;">${contactMethodLabel}</td>
                      </tr>
                      ${data.phoneNumber
                        ? `<tr>
                             <td style="padding:5px 0;font-size:13px;color:#888;font-family:Arial,sans-serif;vertical-align:top;">Phone / WhatsApp</td>
                             <td style="padding:5px 0;font-size:13px;color:${BRAND.black};font-family:Arial,sans-serif;vertical-align:top;">${data.phoneNumber}</td>
                           </tr>`
                        : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ── Items ── -->
              <h2 style="margin:0 0 14px 0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#888;font-family:Arial,sans-serif;font-weight:400;">
                Order Items (${itemCount} ${itemCount === 1 ? 'item' : 'items'})
              </h2>
              ${itemsHtml}

              <!-- ── Total ── -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="border-collapse:collapse;margin-top:8px;margin-bottom:32px;">
                <tr>
                  <td style="padding:18px 24px;background:${BRAND.black};border-radius:6px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                      <tr>
                        <td style="font-size:13px;letter-spacing:1px;text-transform:uppercase;color:${BRAND.gold};font-family:Arial,sans-serif;">
                          Order Total
                        </td>
                        <td align="right" style="font-size:22px;font-weight:700;color:#ffffff;font-family:Georgia,serif;">
                          ${totalFormatted}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ── CTA ── -->
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
                <tr>
                  <td align="center" style="border-radius:4px;background:${BRAND.gold};">
                    <a href="${BRAND.adminBaseUrl}/orders"
                       style="display:inline-block;padding:14px 36px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.black};font-family:Arial,sans-serif;font-weight:700;text-decoration:none;">
                      View Order
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td align="center"
                style="padding:24px 40px;background:${BRAND.offWhite};border-top:1px solid ${BRAND.gray};">
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.gold};font-family:Arial,sans-serif;">
                Signature By Sarah
              </p>
              <p style="margin:0;font-size:11px;color:#aaa;font-family:Arial,sans-serif;">
                This is an internal notification. Do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}
