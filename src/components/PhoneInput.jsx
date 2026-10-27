import { useLayoutEffect, useRef } from 'react'
import { Phone } from 'lucide-react'
import {
  caretAfterNationalDigits,
  digitsBeforeCaret,
  extractUzLocalDigits,
  formatUzPhoneDisplay,
  PHONE_INCOMPLETE_MSG,
  PHONE_PREFIX,
  toE164,
} from '../lib/phoneUz'

export {
  extractUzLocalDigits,
  formatUzPhoneDisplay,
  isCompleteUzPhone,
  PHONE_INCOMPLETE_MSG,
  toE164,
} from '../lib/phoneUz'

/**
 * Reusable Uzbek phone input.
 * - Fixed "+998 " prefix in the value
 * - National part formatted XX XXX XX XX
 * - Digits only, max 9 after 998
 * - Paste strips +998 / 998 / spaces
 * - Caret-friendly backspace (won't eat the prefix)
 *
 * value: any phone-ish string (E.164, display, or local digits)
 * onChange(next): next is either E.164 when complete, or the display string / local digits
 *   Controlled via `valueMode`: 'e164' | 'local' | 'display' (default 'e164' when complete else display for incomplete)
 * Prefer: onChange receives the value matching `valueMode`.
 */
export default function PhoneInput({
  value = '',
  onChange,
  valueMode = 'e164',
  className = '',
  inputClassName = '',
  showIcon = false,
  invalid = false,
  disabled = false,
  placeholder = `${PHONE_PREFIX} 90 123 45 67`,
  id,
  name,
  autoComplete = 'tel',
  'aria-label': ariaLabel = 'Telefon raqam',
}) {
  const inputRef = useRef(null)
  const caretRef = useRef(null)
  const display = formatUzPhoneDisplay(value)

  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el || caretRef.current == null) return
    const pos = caretRef.current
    caretRef.current = null
    try {
      el.setSelectionRange(pos, pos)
    } catch {
      /* ignore */
    }
  }, [display])

  const emit = (localDigits) => {
    if (!onChange) return
    if (valueMode === 'local') onChange(localDigits)
    else if (valueMode === 'display') onChange(formatUzPhoneDisplay(localDigits))
    else onChange(localDigits.length === 9 ? toE164(localDigits) : formatUzPhoneDisplay(localDigits))
  }

  const onInput = (e) => {
    const el = e.target
    const raw = el.value
    const caret = el.selectionStart ?? raw.length
    const nationalBefore = digitsBeforeCaret(raw, caret)
    const local = extractUzLocalDigits(raw)
    const next = formatUzPhoneDisplay(local)
    caretRef.current = caretAfterNationalDigits(next, Math.min(nationalBefore, local.length))
    emit(local)
  }

  const onKeyDown = (e) => {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return
    const el = e.currentTarget
    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? 0
    if (start !== end) return // let default selection delete run via onInput

    const local = extractUzLocalDigits(display)
    // Prefix is "+998 " (6 chars). Block deleting into it.
    const prefixLen = `${PHONE_PREFIX} `.length
    if (e.key === 'Backspace' && start <= prefixLen) {
      e.preventDefault()
      if (local.length === 0) return
      // Delete last national digit when caret is at/inside prefix edge
      if (start <= prefixLen && local.length) {
        const nextLocal = local.slice(0, -1)
        const next = formatUzPhoneDisplay(nextLocal)
        caretRef.current = caretAfterNationalDigits(next, nextLocal.length)
        emit(nextLocal)
      }
      return
    }
    if (e.key === 'Delete' && start < prefixLen) {
      e.preventDefault()
    }
  }

  const onPaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData?.getData('text') || ''
    const local = extractUzLocalDigits(text)
    const next = formatUzPhoneDisplay(local)
    caretRef.current = caretAfterNationalDigits(next, local.length)
    emit(local)
  }

  return (
    <span
      className={`flex items-center gap-2 rounded-xl border bg-[#f7f9fa] px-3.5 focus-within:border-[#0F766E] ${
        invalid ? 'border-[#d14343]' : 'border-[#e3eaee]'
      } ${disabled ? 'opacity-60' : ''} ${className}`}
    >
      {showIcon && <Phone className="size-[18px] shrink-0 text-[#7d8f99]" />}
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        value={display}
        placeholder={placeholder}
        onChange={onInput}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        className={`min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#9aa9b1] ${inputClassName}`}
      />
    </span>
  )
}

export { PHONE_INCOMPLETE_MSG as phoneIncompleteMsg }
