import { Route } from 'react-router-dom'
import SellerGate from './SellerGate'
import SellerLayout from './SellerLayout'
import VerifyGate, { VerifyPanel } from './VerifyGate'
import BoshSahifa from './pages/BoshSahifa'
import Mahsulotlar from './pages/Mahsulotlar'
import MahsulotDetail from './pages/MahsulotDetail'
import Buyurtmalar from './pages/Buyurtmalar'
import BuyurtmaDetail from './pages/BuyurtmaDetail'
import Mijozlar from './pages/Mijozlar'
import MijozDetail from './pages/MijozDetail'
import ChegirmaDetail from './pages/ChegirmaDetail'
import Sharhlar from './pages/Sharhlar'
import Chegirmalar from './pages/Chegirmalar'
import Reklama from './pages/Reklama'
import ReklamaDetail from './pages/ReklamaDetail'
import Analitika from './pages/Analitika'
import AnalitikaMahsulot from './pages/AnalitikaMahsulot'
import AnalitikaHisobot from './pages/AnalitikaHisobot'
import Hamyon from './pages/Hamyon'
import Sozlamalar from './pages/Sozlamalar'

// Usage inside <Routes>: {sellerRoutes}
// Unverified (registered) sellers: only Sozlamalar renders; every other section shows VerifyGate.
export const sellerRoutes = (
  <Route path="/sotuvchi" element={<SellerGate><SellerLayout /></SellerGate>}>
    <Route index element={<VerifyGate section="Bosh sahifa"><BoshSahifa /></VerifyGate>} />
    <Route path="mahsulotlar" element={<VerifyGate section="Mahsulotlar"><Mahsulotlar /></VerifyGate>} />
    <Route path="buyurtmalar/:id" element={<VerifyGate section="Buyurtmalar"><BuyurtmaDetail /></VerifyGate>} />
    <Route path="mahsulotlar/:id" element={<VerifyGate section="Mahsulot qo‘shish"><MahsulotDetail /></VerifyGate>} />
    <Route path="buyurtmalar" element={<VerifyGate section="Buyurtmalar"><Buyurtmalar /></VerifyGate>} />
    <Route path="buyurtmalar/:id" element={<VerifyGate section="Buyurtmalar"><BuyurtmaDetail /></VerifyGate>} />
    <Route path="mijozlar" element={<VerifyGate section="Mijozlar"><Mijozlar /></VerifyGate>} />
    <Route path="mijozlar/:id" element={<VerifyGate section="Mijozlar"><MijozDetail /></VerifyGate>} />
    <Route path="chegirmalar/:id" element={<VerifyGate section="Chegirmalar"><ChegirmaDetail /></VerifyGate>} />
    <Route path="sharhlar" element={<VerifyGate section="Sharhlar"><Sharhlar /></VerifyGate>} />
    <Route path="chegirmalar" element={<VerifyGate section="Chegirmalar"><Chegirmalar /></VerifyGate>} />
    <Route path="reklama" element={<VerifyGate section="Reklama"><Reklama /></VerifyGate>} />
    <Route path="reklama/:id" element={<VerifyGate section="Reklama"><ReklamaDetail /></VerifyGate>} />
    <Route path="analitika" element={<VerifyGate section="Analitika"><Analitika /></VerifyGate>} />
    <Route path="analitika/mahsulot/:id" element={<VerifyGate section="Analitika"><AnalitikaMahsulot /></VerifyGate>} />
    <Route path="analitika/hisobot" element={<VerifyGate section="Analitika"><AnalitikaHisobot /></VerifyGate>} />
    <Route path="hamyon" element={<VerifyGate section="Hamyon va to‘lovlar"><Hamyon /></VerifyGate>} />
    <Route path="sozlamalar" element={<Sozlamalar />} />
    <Route path="tasdiqlash" element={<VerifyPanel />} />
  </Route>
)
