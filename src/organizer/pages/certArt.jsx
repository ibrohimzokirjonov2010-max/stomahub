import { useId } from 'react'
import { ToothIcon } from '../../components/icons'
import { QrMark } from '../ui'

const PAPER_W = 260
const PAPER_H = 348

export function CertFrame({ width = PAPER_W, className = '', ...props }) {
  const scale = width / PAPER_W
  return (
    <div className={className} style={{ width, height: PAPER_H * scale }}>
      <div style={{ width: PAPER_W, height: PAPER_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <CertArt {...props} />
      </div>
    </div>
  )
}

export function MiniCert({ issued = true }) {
  return (
    <svg viewBox="0 0 46 34" className="h-[28px] w-[38px] shrink-0" aria-hidden>
      <rect x="0.5" y="0.5" width="45" height="33" rx="2" fill="#fffef9" stroke="#e4cb86" />
      <path d="M1 1h16C13 7 8 12 1 17V1Z" fill="#12867c" />
      <path d="M14 2c6 4 10 6 16 5" fill="none" stroke="#f0d48a" strokeWidth="0.6" />
      <path d="M38 3c4 3 3 7 6 9" fill="none" stroke="#e4c36a" strokeWidth="0.5" />
      <text x="26" y="13" textAnchor="middle" fontSize="3.1" fill="#0e6e72" fontFamily="Georgia, serif" letterSpacing="0.4">SERTIFIKAT</text>
      {issued ? (
        <>
          <text x="26" y="18.5" textAnchor="middle" fontSize="4.2" fill="#1c2c38" fontFamily="Georgia, cursive">Aliyeva</text>
          <rect x="5" y="21" width="8" height="8" fill="#fff" stroke="#143044" strokeWidth="0.4" />
          <path d="M6 22h2v2H6zm4 0h2v2h-2zM6 26h2v2H6zm3 1h1v1H9z" fill="#143044" />
        </>
      ) : null}
    </svg>
  )
}

function CertArt({ name, course, date, qr = false }) {
  const uid = useId().replace(/:/g, '')
  const teal = `${uid}-teal`
  const gold = `${uid}-gold`
  const seal = `${uid}-seal`
  return (
    <div className="relative h-[348px] w-[260px] overflow-hidden bg-[#fffef9] shadow-[0_8px_22px_rgb(16_70_68/0.12)]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 260 348" aria-hidden>
        <defs>
          <linearGradient id={teal} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0c6e76" />
            <stop offset="48%" stopColor="#128f86" />
            <stop offset="100%" stopColor="#1aaf9c" />
          </linearGradient>
          <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f8e7b0" />
            <stop offset="50%" stopColor="#e0b44e" />
            <stop offset="100%" stopColor="#a67c28" />
          </linearGradient>
          <radialGradient id={seal} cx="42%" cy="38%" r="68%">
            <stop offset="0%" stopColor="#fff1c4" />
            <stop offset="42%" stopColor="#f0cb6a" />
            <stop offset="78%" stopColor="#d4a23c" />
            <stop offset="100%" stopColor="#9a7024" />
          </radialGradient>
        </defs>
        <rect width="260" height="348" fill="#fffdf8" />
        <path d="M0 0h132c-28 34-62 74-112 132C8 62 0 28 0 0Z" fill={`url(#${teal})`} />
        <path d="M118 0c-24 30-52 62-100 118" fill="none" stroke={`url(#${gold})`} strokeWidth="2.1" />
        <path d="M140 7c-30 28-64 58-112 112" fill="none" stroke="#f3dd9a" strokeWidth="1" opacity="0.95" />
        <path d="M96 0c-16 16-34 28-58 42" fill="none" stroke="#fff4cf" strokeWidth="0.9" opacity="0.8" />
        <path d="M156 12c28 8 48 4 86 12" fill="none" stroke="#e6c56a" strokeWidth="1.05" />
        <path d="M172 4c30 12 52 2 86 14" fill="none" stroke="#d4ae52" strokeWidth="0.85" />
        <path d="M258 30c-22 18-16 46 2 68" fill="none" stroke="#e4c36a" strokeWidth="1.15" />
        <path d="M260 50c-28 22-20 54 0 78" fill="none" stroke="#d7b25a" strokeWidth="0.85" />
        <path d="M8 304c22-14 40 2 64-8" fill="none" stroke="#e6c56a" strokeWidth="1" />
        <path d="M0 326c24-12 34 10 60-2" fill="none" stroke="#d4ae52" strokeWidth="0.75" />
        <path d="M188 334c24-14 40 2 70-12" fill="none" stroke="#e6c56a" strokeWidth="1" />
        <rect x="10" y="10" width="240" height="328" fill="none" stroke="#e4cb86" strokeWidth="1.15" />
        <rect x="14" y="14" width="232" height="320" fill="none" stroke="#14786f" strokeWidth="0.55" opacity="0.7" />
        <path d="M10 30V10h20M230 10h20v20M10 318v20h20M230 338h20v-20" fill="none" stroke="#c9a24b" strokeWidth="1.35" />
      </svg>

      <div className="relative flex h-full flex-col items-center px-7 pb-3 pt-[58px] text-center">
        <div className="flex items-center gap-1 text-[12.5px] font-bold tracking-tight text-[#0e756f]">
          <ToothIcon className="size-[15px]" strokeWidth={1.7} />
          StomaHub
        </div>
        <p className="mt-2.5 font-['Playfair_Display',Georgia,serif] text-[20px] font-semibold tracking-[0.22em] text-[#0e6e72]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          SERTIFIKAT
        </p>
        <p className="mt-2 text-[8px] leading-none text-[#7b9094]">Ushbu sertifikat bilan tasdiqlanadiki,</p>
        <p className="mt-1.5 text-[32px] leading-none text-[#1b2d38]" style={{ fontFamily: '"Great Vibes", cursive' }}>{name}</p>
        <p className="mt-2 px-1 text-[9.5px] italic leading-snug text-[#0e6e72]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          “{course}”
        </p>
        <p className="mt-1 text-[8px] leading-[1.35] text-[#3e5960]">
          mavzusidagi ilmiy-amaliy seminarda
          <br />
          faol ishtirok etgan.
        </p>

        <div className="mt-auto grid w-full grid-cols-3 items-end pb-1">
          <div className="text-left">
            <div className="text-[7.5px] font-medium text-[#1c3a44]">{date}</div>
            <div className="mt-1 w-[58px] border-t border-[#c9b48a] pt-0.5 text-[7px] tracking-wide text-[#8d7344]">Sana</div>
          </div>
          <div className="flex justify-center">
            <Seal gid={seal} />
          </div>
          <div className="text-right">
            <svg viewBox="0 0 74 26" className="ml-auto h-[22px] w-[68px]" aria-hidden>
              <path d="M2 18c6-12 10 8 16-6 4-8 2 8 10 2 8-6 6-12 16 0 6 6 8-6 18-2 4 2 6-2 10 0" fill="none" stroke="#243848" strokeWidth="1.15" strokeLinecap="round" />
              <path d="M16 16c6-2 8 4 14 0" fill="none" stroke="#243848" strokeWidth="0.7" strokeLinecap="round" />
            </svg>
            <div className="ml-auto mt-0.5 w-[62px] border-t border-[#c9b48a] pt-0.5 text-right text-[7px] tracking-wide text-[#8d7344]">Ma’ruzachi</div>
          </div>
        </div>
        {qr && (
          <div className="absolute bottom-[46px] left-[22px] rounded-[2px] bg-white p-[2px] shadow-sm">
            <QrMark size={34} seed={7} />
          </div>
        )}
      </div>
    </div>
  )
}

function Seal({ gid }) {
  return (
    <svg width="54" height="54" viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="30" fill={`url(#${gid})`} />
      <circle cx="32" cy="32" r="26.5" fill="none" stroke="#fff6d6" strokeWidth="1.15" />
      <circle cx="32" cy="32" r="24.2" fill="none" stroke="#8d6420" strokeWidth="0.45" opacity="0.7" />
      {Array.from({ length: 28 }).map((_, i) => {
        const a = (i / 28) * Math.PI * 2 - Math.PI / 2
        return <circle key={i} cx={32 + Math.cos(a) * 28} cy={32 + Math.sin(a) * 28} r="0.65" fill="#fff8e4" />
      })}
      <g transform="translate(23.2 18.2) scale(0.78)" fill="#fffaf0" stroke="#8a6420" strokeWidth="0.45">
        <path d="M7.5 1.5C5 1.5 3.5 3.5 3.5 6c0 2 .9 3.2 1.6 4.5.7 1.3.9 2.8 1.2 4.4.3 1.7.9 3 2 3 1.3 0 1.6-1.4 1.9-2.9.3-1.4.6-2.6 1.8-2.6s1.5 1.2 1.8 2.6c.3 1.5.6 2.9 1.9 2.9 1.1 0 1.7-1.3 2-3 .3-1.6.5-3.1 1.2-4.4.7-1.3 1.6-2.5 1.6-4.5 0-2.5-1.5-4.5-4-4.5-1.9 0-2.9 1-4.5 1S9.4 1.5 7.5 1.5Z" />
      </g>
    </svg>
  )
}
