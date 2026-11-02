// ─── Shared formatting utilities ─────────────────────────────────────────────
// Tập trung tất cả helper format để tránh duplicate ở từng page.

const VI = 'vi-VN'

/**
 * Format ISO date string → "dd/mm/yyyy"
 * @param {string|null} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(VI)
}

/**
 * Format ISO datetime string → "dd/mm/yyyy, HH:MM"
 * @param {string|null} value
 * @returns {string}
 */
export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(VI)
}

/**
 * Format start/end ISO strings → "HH:MM–HH:MM (dd/mm/yyyy)"
 * @param {string|null} start
 * @param {string|null} end
 * @returns {string}
 */
export function formatTimeRange(start, end) {
  if (!start || !end) return '—'
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '—'

  const timeOpts = { hour: '2-digit', minute: '2-digit' }
  return (
    `${s.toLocaleTimeString(VI, timeOpts)}–` +
    `${e.toLocaleTimeString(VI, timeOpts)} ` +
    `(${s.toLocaleDateString(VI)})`
  )
}

/**
 * Tạo hàm tra tên hall từ map { id → hall } (O(1)).
 * Dùng hallById từ DataContext thay vì halls.find() O(n).
 *
 * @param {Object} hallById  - map từ DataContext
 * @param {number|string|null} hallId
 * @param {string} fallback
 * @returns {string}
 */
export function getHallName(hallById, hallId, fallback = `Hall #${hallId}`) {
  if (!hallId) return fallback
  return hallById[Number(hallId)]?.name ?? fallback
}

/**
 * Tạo unique ID an toàn (không dùng Date.now() + 1 dễ trùng).
 * @returns {string}
 */
export function uid() {
  return (
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
}

/**
 * Debounce một hàm.
 * @param {Function} fn
 * @param {number} delay  - ms
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
