import { Route } from 'react-router-dom'
import SellerGate from './SellerGate'
import SellerLayout from './SellerLayout'
import BoshSahifa from './pages/BoshSahifa'
import Mahsulotlar from './pages/Mahsulotlar'
import MahsulotDetail from './pages/MahsulotDetail'
import Buyurtmalar from './pages/Buyurtmalar'
import Mijozlar from './pages/Mijozlar'
import Sharhlar from './pages/Sharhlar'
import Chegirmalar from './pages/Chegirmalar'
import Reklama from './pages/Reklama'
import Analitika from './pages/Analitika'
import Hamyon from './pages/Hamyon'
import Sozlamalar from './pages/Sozlamalar'

// Usage inside <Routes>: {sellerRoutes}
export const sellerRoutes = (
  <Route path="/sotuvchi" element={<SellerGate><SellerLayout /></SellerGate>}>
    <Route index element={<BoshSahifa />} />
    <Route path="mahsulotlar" element={<Mahsulotlar />} />
    <Route path="mahsulotlar/:id" element={<MahsulotDetail />} />
    <Route path="buyurtmalar" element={<Buyurtmalar />} />
    <Route path="mijozlar" element={<Mijozlar />} />
    <Route path="sharhlar" element={<Sharhlar />} />
    <Route path="chegirmalar" element={<Chegirmalar />} />
    <Route path="reklama" element={<Reklama />} />
    <Route path="analitika" element={<Analitika />} />
    <Route path="hamyon" element={<Hamyon />} />
    <Route path="sozlamalar" element={<Sozlamalar />} />
  </Route>
)
