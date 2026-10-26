// Joriy sana Asia/Tashkent bo‘yicha (YYYY-MM-DD)
export function tashkentToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

