import FlashToast from './components/FlashToast'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useCatalogVersion } from './recordSync'
import './catalogBindings'
import { CartProvider } from './cart'
import Home from './pages/Home'
import { Login, Register } from './pages/Auth'
import Marketplace from './pages/Marketplace'
import Product from './pages/Product'
import Surplus from './pages/Surplus'
import SurplusItem from './pages/SurplusItem'
import SeminarsPage from './pages/SeminarsPage'
import Seminar from './pages/Seminar'
import SeminarReg from './pages/SeminarReg'
import Shell from './organizer/Shell'
import OrganizerGate from './organizer/OrganizerGate'
import { sellerRoutes } from './seller/routes'
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
import EducationRoute from './pages/Education'
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
import AdminMahsulotlar from './pages/AdminMahsulotlar'
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
          <Route path="/marketplace" element={<Responsive mobile={<MobileMarketplace />}><ShopLayout active="all"><Marketplace /></ShopLayout></Responsive>} />
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
          <Route path="/ortiqcha" element={<Responsive mobile={<MobileSurplus />}><ShopLayout active="surplus" search="icon" placeholder="Ortiqcha materiallar ichidan qidiring..."><Surplus /></ShopLayout></Responsive>} />
          <Route path="/seminarlar" element={<Responsive mobile={<MobileSeminars />}><ShopLayout active="seminars" search="plain" placeholder="Stomatologga nima kerak?"><SeminarsPage /></ShopLayout></Responsive>} />
          {sellerRoutes}
          <Route path="/tashkilotchi" element={<OrganizerGate><Shell /></OrganizerGate>}>
            <Route index element={<Dashboard />} />
            <Route path="seminarlar" element={<Seminars />} />
            <Route path="seminarlar/yangi" element={<Wizard />} />
            <Route path="seminarlar/:id" element={<SeminarDetail />} />
            <Route path="seminarlar/:id/tasdiqlash" element={<ConfirmHeld />} />
            <Route path="ishtirokchilar" element={<Participants />} />
            <Route path="chiptalar" element={<Tickets />} />
            <Route path="qr" element={<QrCheckin />} />
            <Route path="tolovlar" element={<OrgPayments />} />
            <Route path="hamyon" element={<WalletPage />} />
            <Route path="sertifikatlar" element={<OrgCertificates />} />
            <Route path="promo" element={<Promos />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="maruzachilar" element={<Speakers />} />
            <Route path="hisobotlar" element={<Reports />} />
            <Route path="reyting" element={<Ratings />} />
            <Route path="sozlamalar" element={<SettingsPage />} />
            <Route path="yordam" element={<HelpPage />} />
          </Route>
          <Route path="/seminarlar/:id/royxat" element={<Responsive mobile={<MobileSeminarReg />}><ShopLayout active="seminars" search="plain" placeholder="Mahsulot, kurs, mutaxassis yoki maqola qidiring..."><SeminarReg /></ShopLayout></Responsive>} />
          <Route path="/seminarlar/:id" element={<Responsive mobile={<MobileSeminar />}><ShopLayout active="seminars" search="plain" placeholder="Stomatologga nima kerak?"><Seminar /></ShopLayout></Responsive>} />
          <Route path="/kanallar" element={<ChannelsRoute />} />
          <Route path="/talim" element={<EducationRoute />} />
          <Route path="/kitoblar" element={<Responsive mobile={<MobileBooks />}><BooksRoute /></Responsive>} />
          <Route path="/kitoblar/:id/oqish" element={<Responsive mobile={<MobileReader />}><Reader /></Responsive>} />
          <Route path="/kitoblar/:id" element={<Responsive mobile={<MobileBook />}><ShopLayout active="books" search="plain" placeholder="Mahsulot, kurs, kitob yoki maqola qidiring..."><Book /></ShopLayout></Responsive>} />
          <Route path="/forma" element={<Responsive mobile={<MobileForma />}><Forma /></Responsive>} />
          <Route path="/forma/:id" element={<Responsive mobile={<MobileFormaItem />}><ShopLayout active="forma" search="plain" placeholder="Mahsulot, brend yoki kategoriya qidiring..."><FormaItem /></ShopLayout></Responsive>} />
          <Route path="/jihozlar" element={<Responsive mobile={<MobileJihozlar />}><Jihozlar /></Responsive>} />
          <Route path="/jihozlar/:id" element={<Responsive mobile={<MobileJihozItem />}><ShopLayout active="jihozlar" search="plain" placeholder="Jihoz, material, brend yoki kategoriya qidiring..."><JihozItem /></ShopLayout></Responsive>} />
          <Route path="/ustalar" element={<Responsive mobile={<MobileUstalar />}><Ustalar /></Responsive>} />
          <Route path="/ustalar/:id" element={<Responsive mobile={<MobileUsta />}><ShopLayout active="ustalar" search="plain" placeholder="Usta, xizmat yoki brend bo‘yicha qidiring..."><Usta /></ShopLayout></Responsive>} />
          <Route path="/ishlar" element={<Responsive mobile={<MobileIshlar />}><Ishlar /></Responsive>} />
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
          <Route path="/ombor" element={<CrmGate><Responsive mobile={<MobileOmbor />}><Ombor /></Responsive></CrmGate>} />
          <Route path="/ombor/yangi" element={<CrmGate><Responsive mobile={<MobileOmborNew />}><Navigate to="/ombor" replace /></Responsive></CrmGate>} />
          <Route path="/buyurtma" element={<Responsive mobile={<MobileCart />}><Checkout /></Responsive>} />
          <Route path="/buyurtma/rasmiylashtirish" element={<Responsive mobile={<MobileCheckout />}><Navigate to="/buyurtma" replace /></Responsive>} />
          <Route path="/mutaxassislar" element={<Responsive mobile={<MobileMutaxassislar />}><Navigate to="/" replace /></Responsive>} />
          <Route path="/mutaxassislar/:id" element={<Responsive mobile={<MobileMutaxassis />}><Navigate to="/" replace /></Responsive>} />
          <Route path="/elonlar" element={<Responsive mobile={<MobileElonlar />}><Navigate to="/" replace /></Responsive>} />
          <Route path="/elonlar/:id" element={<Responsive mobile={<MobileElon />}><Navigate to="/" replace /></Responsive>} />
          <Route path="/community" element={<Responsive mobile={<MobileCommunity />}><Community /></Responsive>} />
          <Route path="/community/:id" element={<Responsive mobile={<MobilePost />}><Navigate to="/community" replace /></Responsive>} />
          <Route path="/sertifikatlar" element={<Responsive mobile={<MobileSertifikatlar />}><Sertifikatlar /></Responsive>} />
          <Route path="/klinika" element={<CrmGate><Klinika /></CrmGate>} />
          <Route path="/admin/mahsulotlar" element={<AdminMahsulotlar />} />
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
