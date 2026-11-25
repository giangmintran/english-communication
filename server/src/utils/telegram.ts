/**
 * Telegram Bot Notification Utility
 * Gửi thông báo đến Telegram Bot khi có feedback/liên hệ mới từ người dùng.
 *
 * Cấu hình:
 *   TELEGRAM_BOT_TOKEN  – Token của bot (lấy từ @BotFather)
 *   TELEGRAM_CHAT_ID    – Chat ID nơi nhận thông báo (nhóm hoặc cá nhân)
 */

const TELEGRAM_API = 'https://api.telegram.org';

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  return { token, chatId };
}

/**
 * Gửi tin nhắn văn bản đến Telegram Bot (HTML parse mode).
 * Nếu chưa cấu hình token/chatId → bỏ qua im lặng (không throw).
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  const { token, chatId } = getConfig();

  if (!token || !chatId) {
    console.warn('[Telegram] Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID → bỏ qua thông báo.');
    return false;
  }

  try {
    const url = `${TELEGRAM_API}/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Telegram] Gửi thất bại:', res.status, err);
      return false;
    }

    console.log('[Telegram] ✅ Đã gửi thông báo feedback mới.');
    return true;
  } catch (err) {
    console.error('[Telegram] Lỗi kết nối:', err);
    return false;
  }
}

/** Escape các ký tự đặc biệt cho HTML parse mode */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Tạo nội dung thông báo Telegram từ dữ liệu feedback */
export function formatFeedbackTelegram(feedback: {
  category: string;
  title?: string | null;
  content: string;
  user_name?: string | null;
  user_email?: string | null;
  page_url?: string | null;
}): string {
  const categoryEmoji: Record<string, string> = {
    bug: '🐛 Báo lỗi',
    feature: '💡 Đề xuất / Hợp tác',
    content: '📝 Nội dung',
    general: '💬 Chung',
  };

  const catLabel = categoryEmoji[feedback.category] || `📩 ${feedback.category}`;
  const name = feedback.user_name ? escapeHtml(feedback.user_name.slice(0, 60)) : '<i>Ẩn danh</i>';
  const email = feedback.user_email ? escapeHtml(feedback.user_email.slice(0, 100)) : '<i>Không có</i>';

  let msg = `🔔 <b>Tin nhắn mới từ SpeakUp</b>\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n`;
  msg += `📂 <b>Chủ đề:</b> ${catLabel}\n`;
  msg += `👤 <b>Người gửi:</b> ${name}\n`;
  msg += `📧 <b>Email:</b> ${email}\n`;

  if (feedback.title) {
    msg += `📌 <b>Tiêu đề:</b> ${escapeHtml(feedback.title.slice(0, 150))}\n`;
  }

  // Cắt gọn content an toàn nếu quá dài để tổng dung lượng message luôn dưới ngưỡng 4096 ký tự của Telegram
  let displayContent = feedback.content.trim();
  if (displayContent.length > 2500) {
    displayContent = displayContent.slice(0, 2500) + '\n... <i>(nội dung đã được rút gọn do vượt giới hạn)</i>';
  }

  msg += `\n💬 <b>Nội dung:</b>\n${escapeHtml(displayContent)}\n`;

  if (feedback.page_url) {
    msg += `\n🔗 <b>Trang:</b> ${escapeHtml(feedback.page_url.slice(0, 150))}`;
  }

  msg += `\n━━━━━━━━━━━━━━━━━━`;
  msg += `\n🕐 ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`;

  // Đảm bảo an toàn tuyệt đối: Không bao giờ vượt quá 4000 ký tự (ngưỡng tối đa Telegram là 4096)
  if (msg.length > 4000) {
    msg = msg.slice(0, 3950) + '\n... <i>(nội dung đã được cắt bớt)</i>';
  }

  return msg;
}
