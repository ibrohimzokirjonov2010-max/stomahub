import { ArrowRight } from 'lucide-react'

export default function Section({ title, link = 'Barchasini ko‘rish', children, className = '' }) {
  return (
    <section className={className}>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-ink">{title}</h2>
        <a href="#" className="flex items-center gap-1.5 text-[11.5px] font-medium text-blue hover:underline">
          {link} <ArrowRight className="size-3.5" />
        </a>
      </div>
      {children}
    </section>
  )
}
