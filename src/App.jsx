import FlashToast from './components/FlashToast'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useCatalogVersion } from './recordSync'
import './catalogBindings'
import { CartProvider } from './cart'
import Home from './pages/Home'
import { Login, Register } from './pages/Auth'
import { Privacy, Terms } from './pages/Legal'
import Marketplace from './pages/Marketplace'
import Product from './pages/Product'
import Savatcha from './pages/Savatcha'
import Surplus from './pages/Surplus'
import SurplusItem from './pages/SurplusItem'
import SeminarsPage from './pages/SeminarsPage'
import Seminar from './pages/Seminar'
import SeminarReg from './pages/SeminarReg'
import Shell from './organizer/Shell'
import OrganizerGate from './organizer/OrganizerGate'
import OrgVerifyGate, { OrgVerifyPage } from './organizer/OrgVerifyGate'
import OrganizerRegister from './apply/OrganizerRegister'
import { sellerRoutes } from './seller/routes'
import SellerRegister from './apply/SellerRegister'
import Dashboard from './organizer/pages/Dashboard'
import Seminars from './organizer/pages/Seminars'
import Participants from './organizer/pages/Participants'
import Tickets from './organizer/pages/Tickets'
import QrCheckin from './organizer/pages/Qr'
import OrgPayments from './organizer/pages/Payments'
import OrgCertificates from './organizer/pages/Certificates'
import Promos from './organizer/pages/Promos'
import Wizard from './organizer/pages/Wizard'
import WalletPage from './organizer/pages/Wallet'
import ConfirmHeld from './organizer/pages/Confirm'
import SeminarDetail from './organizer/pages/Detail'
import { Marketing, Speakers, Reports, Ratings, SettingsPage, HelpPage } from './organizer/pages/Extra'
import ChannelsRoute from './pages/Channels'
import { FormaCatalog, MarketCatalog, SeminarsCatalog, BooksCatalog, EducationCatalog, UstalarCatalog, JihozCatalog, IshlarCatalog, SurplusCatalog, DoctorsCatalog, ElonlarCatalog } from './pages/CatalogRoutes'
import BooksRoute from './pages/Books'
import Book from './pages/Book'
import Reader from './pages/Reader'
import Forma from './pages/Forma'
import FormaItem from './pages/FormaItem'
import Jihozlar from './pages/Jihozlar'
import JihozItem from './pages/JihozItem'
import Ustalar from './pages/Ustalar'
import Usta from './pages/Usta'
import Ishlar from './pages/Ishlar'
import IshItem from './pages/IshItem'
import Yangiliklar from './pages/Yangiliklar'
import Yangilik from './pages/Yangilik'
import Kategoriyalar from './pages/Kategoriyalar'
import Brendlar from './pages/Brendlar'
import Aksiyalar from './pages/Aksiyalar'
import Aksiya from './pages/Aksiya'
import Bemorlar from './pages/Bemorlar'
import Bemor from './pages/Bemor'
import Uchrashuvlar from './pages/Uchrashuvlar'
import Hisobotlar from './pages/Hisobotlar'
import Tolovlar from './pages/Tolovlar'
import Ombor from './pages/Ombor'
import Checkout from './pages/Checkout'
import Community from './pages/Community'
import Sertifikatlar from './pages/Sertifikatlar'
import Klinika from './pages/Klinika'
import Xizmatlar from './pages/Xizmatlar'
import Rejalar from './pages/Rejalar'
import Reja from './pages/Reja'
import IntakeDialog from './components/market/IntakeDialog'
import ShopLayout from './components/market/ShopLayout'
import Responsive from './components/mobile/Responsive'
import CrmGate from './components/CrmGate'
import MobileChrome from './components/mobile/MobileChrome'
import MobileMarketplace from './components/mobile/MobileMarketplace'
import MobileProduct from './components/mobile/MobileProduct'
import MobileSurplus from './components/mobile/MobileSurplus'
import MobileSeminars from './components/mobile/MobileSeminars'
import MobileForma from './components/mobile/MobileForma'
import MobileFormaItem from './components/mobile/MobileFormaItem'
import MobileJihozlar from './components/mobile/MobileJihozlar'
import MobileJihozItem from './components/mobile/MobileJihozItem'
import MobileKategoriyalar from './components/mobile/MobileKategoriyalar'
import MobileBrendlar from './components/mobile/MobileBrendlar'
import MobileBooks from './components/mobile/MobileBooks'
import MobileBook from './components/mobile/MobileBook'
import MobileReader from './components/mobile/MobileReader'
import MobileSertifikatlar from './components/mobile/MobileSertifikatlar'
import MobileCommunity from './components/mobile/MobileCommunity'
import MobilePost from './components/mobile/MobilePost'
import MobileMutaxassislar from './components/mobile/MobileMutaxassislar'
import MobileMutaxassis from './components/mobile/MobileMutaxassis'
import MobileIshlar from './components/mobile/MobileIshlar'
import MobileIsh from './components/mobile/MobileIsh'
import MobileUstalar from './components/mobile/MobileUstalar'
import MobileUsta from './components/mobile/MobileUsta'
import MobileElonlar from './components/mobile/MobileElonlar'
import MobileElon from './components/mobile/MobileElon'
import MobileBemorlar from './components/mobile/MobileBemorlar'
import MobileBemorNew from './components/mobile/MobileBemorNew'
import MobileBemor from './components/mobile/MobileBemor'
import MobileUchrashuvlar from './components/mobile/MobileUchrashuvlar'
import MobileUchrashuvNew from './components/mobile/MobileUchrashuvNew'
import MobileTolovlar from './components/mobile/MobileTolovlar'
import MobileTolovNew from './components/mobile/MobileTolovNew'
import MobileOmbor from './components/mobile/MobileOmbor'
import MobileOmborNew from './components/mobile/MobileOmborNew'
import MobileSeminar from './components/mobile/MobileSeminar'
import MobileSeminarReg from './components/mobile/MobileSeminarReg'
import MobileCart from './components/mobile/MobileCart'
import MobileCheckout from './components/mobile/MobileCheckout'
import { adminRoutes } from './admin/routes'
import MobileSurplusItem from './components/mobile/MobileSurplusItem'
import MobileProfil from './components/mobile/MobileProfil'
import Profil from './pages/Profil'
import MobileManzillar from './components/mobile/MobileManzillar'
import MobileTolovUsullari from './components/mobile/MobileTolovUsullari'
import MobileSevimlilar from './components/mobile/MobileSevimlilar'
import MobileBuyurtmalar from './components/mobile/MobileBuyurtmalar'
import MobileKuzatish from './components/mobile/MobileKuzatish'
import MobileSeminarlarim from './components/mobile/MobileSeminarlarim'
import MobileKurslarim from './components/mobile/MobileKurslarim'

export default function App() {
  useCatalogVersion()
  return (
    <CartProvider>
      <BrowserRouter>
        <MobileChrome />
        <IntakeDialog />
        <FlashToast />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/kirish" element={<Login />} />
          <Route path="/royxat" element={<Register />} />
          <Route path="/maxfiylik" element={<Privacy />} />
          <Route path="/foydalanish-shartlari" element={<Terms />} />
          <Route path="/marketplace" element={<MarketCatalog />} />
          <Route
            path="/product/:id"
            element={
              <Responsive mobile={<MobileProduct />}>
                <ShopLayout active="market" placeholder="Material, brend yoki kategoriya bo‘yicha qidiring...">
                  <Product />
                </ShopLayout>
              </Responsive>
            }
          />
          <Route path="/ortiqcha" element={<SurplusCatalog />} />
          <Route path="/seminarlar" element={<SeminarsCatalog />} />
          <Route path="/sotuvchi-bolish" element={<SellerRegister />} />
          <Route path="/tashkilotchi-bolish" element={<OrganizerRegister />} />
          {sellerRoutes}
          {adminRoutes}
          <Route path="/tashkilotchi" element={<OrganizerGate><Shell /></OrganizerGate>}>
            <Route index element={<OrgVerifyGate section="Boshqaruv paneli"><Dashboard /></OrgVerifyGate>} />
            <Route path="seminarlar" element={<OrgVerifyGate section="Mening seminarlarim"><Seminars /></OrgVerifyGate>} />
            <Route path="seminarlar/yangi" element={<OrgVerifyGate section="Seminar qo‘shish"><Wizard /></OrgVerifyGate>} />
            <Route path="seminarlar/:id" element={<OrgVerifyGate section="Seminar"><SeminarDetail /></OrgVerifyGate>} />
            <Route path="seminarlar/:id/tasdiqlash" element={<OrgVerifyGate section="Seminar"><ConfirmHeld /></OrgVerifyGate>} />
            <Route path="ishtirokchilar" element={<OrgVerifyGate section="Ishtirokchilar"><Participants /></OrgVerifyGate>} />
            <Route path="chiptalar" element={<OrgVerifyGate section="Chiptalar"><Tickets /></OrgVerifyGate>} />
            <Route path="qr" element={<OrgVerifyGate section="QR Check-in"><QrCheckin /></OrgVerifyGate>} />
            <Route path="tolovlar" element={<OrgVerifyGate section="To‘lovlar"><OrgPayments /></OrgVerifyGate>} />
            <Route path="hamyon" element={<OrgVerifyGate section="Hamyon"><WalletPage /></OrgVerifyGate>} />
            <Route path="sertifikatlar" element={<OrgVerifyGate section="Sertifikatlar"><OrgCertificates /></OrgVerifyGate>} />
            <Route path="promo" element={<OrgVerifyGate section="Promo-kodlar"><Promos /></OrgVerifyGate>} />
            <Route path="marketing" element={<OrgVerifyGate section="Marketing"><Marketing /></OrgVerifyGate>} />
            <Route path="maruzachilar" element={<OrgVerifyGate section="Ma’ruzachilar"><Speakers /></OrgVerifyGate>} />
            <Route path="hisobotlar" element={<OrgVerifyGate section="Hisobotlar"><Reports /></OrgVerifyGate>} />
            <Route path="reyting" element={<OrgVerifyGate section="Reyting va sharhlar"><Ratings /></OrgVerifyGate>} />
            <Route path="sozlamalar" element={<SettingsPage />} />
            <Route path="tasdiqlash" element={<OrgVerifyPage />} />
            <Route path="yordam" element={<HelpPage />} />
          </Route>
          <Route path="/seminarlar/:id/royxat" element={<Responsive mobile={<MobileSeminarReg />}><ShopLayout active="seminars" search="plain" placeholder="Mahsulot, kurs, mutaxassis yoki maqola qidiring..."><SeminarReg /></ShopLayout></Responsive>} />
          <Route path="/seminarlar/:id" element={<Responsive mobile={<MobileSeminar />}><ShopLayout active="seminars" search="plain" placeholder="Stomatologga nima kerak?"><Seminar /></ShopLayout></Responsive>} />
          <Route path="/kanallar" element={<ChannelsRoute />} />
          <Route path="/talim" element={<EducationCatalog />} />
          <Route path="/kitoblar" element={<BooksCatalog />} />
          <Route path="/kitoblar/:id/oqish" element={<Responsive mobile={<MobileReader />}><Reader /></Responsive>} />
          <Route path="/kitoblar/:id" element={<Responsive mobile={<MobileBook />}><ShopLayout active="books" search="plain" placeholder="Mahsulot, kurs, kitob yoki maqola qidiring..."><Book /></ShopLayout></Responsive>} />
          <Route path="/forma" element={<FormaCatalog />} />
          <Route path="/forma/:id" element={<Responsive mobile={<MobileFormaItem />}><ShopLayout active="forma" search="plain" placeholder="Mahsulot, brend yoki kategoriya qidiring..."><FormaItem /></ShopLayout></Responsive>} />
          <Route path="/jihozlar" element={<JihozCatalog />} />
          <Route path="/jihozlar/:id" element={<Responsive mobile={<MobileJihozItem />}><ShopLayout active="jihozlar" search="plain" placeholder="Jihoz, material, brend yoki kategoriya qidiring..."><JihozItem /></ShopLayout></Responsive>} />
          <Route path="/ustalar" element={<UstalarCatalog />} />
          <Route path="/ustalar/:id" element={<Responsive mobile={<MobileUsta />}><ShopLayout active="ustalar" search="plain" placeholder="Usta, xizmat yoki brend bo‘yicha qidiring..."><Usta /></ShopLayout></Responsive>} />
          <Route path="/ishlar" element={<IshlarCatalog />} />
          <Route path="/ishlar/:id" element={<Responsive mobile={<MobileIsh />}><ShopLayout active="ishlar" search="plain" placeholder="Lavozim, klinika yoki shahar bo‘yicha qidiring..."><IshItem /></ShopLayout></Responsive>} />
          <Route path="/yangiliklar" element={<Yangiliklar />} />
          <Route path="/yangiliklar/:id" element={<ShopLayout active="yangiliklar" search="plain" placeholder="Stomatologiya sohasidagi yangiliklarni qidiring..."><Yangilik /></ShopLayout>} />
          <Route path="/kategoriyalar" element={<Responsive mobile={<MobileKategoriyalar />}><Kategoriyalar /></Responsive>} />
          <Route path="/brendlar" element={<Responsive mobile={<MobileBrendlar />}><Brendlar /></Responsive>} />
          <Route path="/aksiyalar" element={<Aksiyalar />} />
          <Route path="/aksiyalar/:id" element={<ShopLayout active="aksiya" placeholder="Mahsulot, brend yoki kategoriya qidiring..."><Aksiya /></ShopLayout>} />
          <Route path="/bemorlar" element={<CrmGate><Responsive mobile={<MobileBemorlar />}><Bemorlar /></Responsive></CrmGate>} />
          <Route path="/bemorlar/yangi" element={<CrmGate><Responsive mobile={<MobileBemorNew />}><Navigate to="/bemorlar" replace /></Responsive></CrmGate>} />
          <Route path="/bemorlar/:id" element={<CrmGate><Responsive mobile={<MobileBemor />}><ShopLayout active="bemorlar" placeholder="Bemor qidiring (ism, telefon, ID)..."><Bemor /></ShopLayout></Responsive></CrmGate>} />
          <Route path="/uchrashuvlar" element={<CrmGate><Responsive mobile={<MobileUchrashuvlar />}><Uchrashuvlar /></Responsive></CrmGate>} />
          <Route path="/uchrashuvlar/yangi" element={<CrmGate><Responsive mobile={<MobileUchrashuvNew />}><Navigate to="/uchrashuvlar" replace /></Responsive></CrmGate>} />
          <Route path="/tolovlar" element={<CrmGate><Responsive mobile={<MobileTolovlar />}><Tolovlar /></Responsive></CrmGate>} />
          <Route path="/tolovlar/yangi" element={<CrmGate><Responsive mobile={<MobileTolovNew />}><Navigate to="/tolovlar" replace /></Responsive></CrmGate>} />
          <Route path="/hisobotlar" element={<CrmGate><Hisobotlar /></CrmGate>} />
          <Route path="/ombor" element={<CrmGate><Responsive mobile={<MobileOmbor />}><Ombor /></Responsive></CrmGate>} />
          <Route path="/ombor/yangi" element={<CrmGate><Responsive mobile={<MobileOmborNew />}><Navigate to="/ombor" replace /></Responsive></CrmGate>} />
          <Route path="/savatcha" element={<Responsive mobile={<MobileCart />}><Savatcha /></Responsive>} />
          <Route path="/buyurtma" element={<Responsive mobile={<MobileCart />}><Checkout /></Responsive>} />
          <Route path="/buyurtma/rasmiylashtirish" element={<Responsive mobile={<MobileCheckout />}><Navigate to="/buyurtma" replace /></Responsive>} />
          <Route path="/mutaxassislar" element={<DoctorsCatalog />} />
          <Route path="/mutaxassislar/:id" element={<Responsive mobile={<MobileMutaxassis />}><ShopLayout active="mutaxassislar" search="plain"><div className="mx-auto max-w-[560px] py-4 [transform:translateZ(0)]"><MobileMutaxassis /></div></ShopLayout></Responsive>} />
          <Route path="/elonlar" element={<ElonlarCatalog />} />
          <Route path="/elonlar/:id" element={<Responsive mobile={<MobileElon />}><ShopLayout active="elonlar" search="plain"><div className="mx-auto max-w-[560px] py-4 [transform:translateZ(0)]"><MobileElon /></div></ShopLayout></Responsive>} />
          <Route path="/community" element={<Responsive mobile={<MobileCommunity />}><Community /></Responsive>} />
          <Route path="/community/:id" element={<Responsive mobile={<MobilePost />}><Navigate to="/community" replace /></Responsive>} />
          <Route path="/sertifikatlar" element={<Responsive mobile={<MobileSertifikatlar />}><Sertifikatlar /></Responsive>} />
          <Route path="/klinika" element={<CrmGate><Klinika /></CrmGate>} />
          <Route path="/profil" element={<Responsive mobile={<MobileProfil />}><Profil /></Responsive>} />
          <Route path="/sozlamalar" element={<Responsive mobile={<MobileProfil />}><Profil /></Responsive>} />
          <Route path="/profil/manzillar" element={<Responsive mobile={<MobileManzillar />}><Profil section="addresses" /></Responsive>} />
          <Route path="/profil/tolov-usullari" element={<Responsive mobile={<MobileTolovUsullari />}><Profil section="payments" /></Responsive>} />
          <Route path="/profil/sevimlilar" element={<Responsive mobile={<MobileSevimlilar />}><Profil section="saved" /></Responsive>} />
          <Route path="/profil/buyurtmalar" element={<Responsive mobile={<MobileBuyurtmalar />}><Profil section="orders" /></Responsive>} />
          <Route path="/profil/kurslar" element={<Responsive mobile={<MobileKurslarim />}><Profil section="courses" /></Responsive>} />
          <Route path="/profil/seminarlar" element={<Responsive mobile={<MobileSeminarlarim />}><Profil section="tickets" /></Responsive>} />
          <Route path="/buyurtma/kuzatish/:id" element={<Responsive mobile={<MobileKuzatish />}><Navigate to="/klinika" replace /></Responsive>} />
          <Route path="/xizmatlar" element={<CrmGate><Xizmatlar /></CrmGate>} />
          <Route path="/davolash-rejalari" element={<CrmGate><Rejalar /></CrmGate>} />
          <Route path="/davolash-rejalari/:id" element={<CrmGate><Reja /></CrmGate>} />
          <Route
            path="/ortiqcha/:id"
            element={
              <Responsive mobile={<MobileSurplusItem />}>
                <ShopLayout active="surplus" search="plain" placeholder="Material, brend yoki kategoriya bo‘yicha qidiring...">
                  <SurplusItem />
                </ShopLayout>
              </Responsive>
            }
          />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}
