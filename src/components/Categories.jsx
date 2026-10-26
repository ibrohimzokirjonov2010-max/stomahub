import Section from './Section'
import { categories } from '../data'

export default function Categories() {
  return (
    <Section title="Kategoriyalar">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-9">
        {categories.map((c) => (
          <a key={c.name} href="#" className="group flex flex-col items-center rounded-lg bg-white px-1 pb-2 pt-1 text-center shadow-card transition hover:shadow-md">
            <div className="h-[56px] w-full overflow-hidden">
              <img src={c.image} alt="" className="mx-auto h-full object-contain transition group-hover:scale-105" />
            </div>
            <p className="mt-1.5 flex min-h-[22px] items-center text-[9.5px] font-medium leading-[1.15] text-ink">{c.name}</p>
          </a>
        ))}
        <a href="#" className="flex flex-col items-center rounded-lg bg-white px-1 pb-2 pt-1 text-center shadow-card transition hover:shadow-md">
          <div className="mt-0.5 flex h-[54px] w-[90%] items-center justify-center gap-1.5 rounded-md bg-[#eef2f7]">
            <span className="size-1 rounded-full bg-ink-2" /><span className="size-1 rounded-full bg-ink-2" /><span className="size-1 rounded-full bg-ink-2" />
          </div>
          <p className="mt-1.5 flex min-h-[22px] items-center text-[9.5px] font-medium text-ink">Boshqa</p>
        </a>
      </div>
    </Section>
  )
}
