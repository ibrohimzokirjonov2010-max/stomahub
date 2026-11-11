import { CatalogPage } from '../components/catalog/CatalogLayout'
import SeminarsBrowse from '../components/seminars/SeminarsBrowse'
import {
  useFormaSection, useMarketSection, useBooksSection, useEducationSection, useUstalarSection,
  useJihozSection, useIshlarSection, useSurplusSection, useDoctorsSection, useElonlarSection,
} from '../components/catalog/sections'

export const FormaCatalog = () => <CatalogPage section={useFormaSection()} />
export const MarketCatalog = () => <CatalogPage section={useMarketSection()} />
export const SeminarsCatalog = () => <SeminarsBrowse />
export const BooksCatalog = () => <CatalogPage section={useBooksSection()} />
export const EducationCatalog = () => <CatalogPage section={useEducationSection()} />
export const UstalarCatalog = () => <CatalogPage section={useUstalarSection()} />
export const JihozCatalog = () => <CatalogPage section={useJihozSection()} />
export const IshlarCatalog = () => <CatalogPage section={useIshlarSection()} />
export const SurplusCatalog = () => <CatalogPage section={useSurplusSection()} />
export const DoctorsCatalog = () => <CatalogPage section={useDoctorsSection()} />
export const ElonlarCatalog = () => <CatalogPage section={useElonlarSection()} />
