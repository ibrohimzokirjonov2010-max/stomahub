import { Route } from 'react-router-dom'
import AdminGate from './AdminGate'
import AdminLayout from './AdminLayout'
import Dashboard from './pages/Dashboard'
import Foydalanuvchilar from './pages/Foydalanuvchilar'
import Sotuvchilar from './pages/Sotuvchilar'
import Tashkilotchilar from './pages/Tashkilotchilar'
import Elonlar from './pages/Elonlar'
import Buyurtmalar from './pages/Buyurtmalar'
import Escrow from './pages/Escrow'
import Tasdiqlashlar from './pages/Tasdiqlashlar'
import Moliya from './pages/Moliya'
import Shikoyatlar from './pages/Shikoyatlar'
import Hisobotlar from './pages/Hisobotlar'
import Sozlamalar from './pages/Sozlamalar'
import Mahsulotlar from './pages/Mahsulotlar'

export const adminRoutes = (
  <Route path="/admin" element={<AdminGate><AdminLayout /></AdminGate>}>
    <Route index element={<Dashboard />} />
    <Route path="foydalanuvchilar" element={<Foydalanuvchilar />} />
    <Route path="sotuvchilar" element={<Sotuvchilar />} />
    <Route path="tashkilotchilar" element={<Tashkilotchilar />} />
    <Route path="elonlar" element={<Elonlar />} />
    <Route path="buyurtmalar" element={<Buyurtmalar />} />
    <Route path="escrow" element={<Escrow />} />
    <Route path="tasdiqlashlar" element={<Tasdiqlashlar />} />
    <Route path="moliya" element={<Moliya />} />
    <Route path="shikoyatlar" element={<Shikoyatlar />} />
    <Route path="hisobotlar" element={<Hisobotlar />} />
    <Route path="sozlamalar" element={<Sozlamalar />} />
    <Route path="mahsulotlar" element={<Mahsulotlar />} />
  </Route>
)
