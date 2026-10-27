import { Route } from 'react-router-dom'
import AdminGate from './AdminGate'
import AdminLayout from './AdminLayout'
import Dashboard from './pages/Dashboard'
import Placeholder from './pages/Placeholder'
import Mahsulotlar from './pages/Mahsulotlar'

export const adminRoutes = (
  <Route path="/admin" element={<AdminGate><AdminLayout /></AdminGate>}>
    <Route index element={<Dashboard />} />
    <Route path="foydalanuvchilar" element={<Placeholder title="Foydalanuvchilar" />} />
    <Route path="sotuvchilar" element={<Placeholder title="Sotuvchilar" />} />
    <Route path="tashkilotchilar" element={<Placeholder title="Seminar tashkilotchilari" />} />
    <Route path="elonlar" element={<Placeholder title="E’lonlar" />} />
    <Route path="buyurtmalar" element={<Placeholder title="Buyurtmalar" />} />
    <Route path="escrow" element={<Placeholder title="Escrow va pul aylanmasi" />} />
    <Route path="tasdiqlashlar" element={<Placeholder title="Tasdiqlashlar" />} />
    <Route path="moliya" element={<Placeholder title="Moliya va komissiya" />} />
    <Route path="shikoyatlar" element={<Placeholder title="Shikoyatlar" />} />
    <Route path="hisobotlar" element={<Placeholder title="Hisobotlar" />} />
    <Route path="sozlamalar" element={<Placeholder title="Sozlamalar" />} />
    <Route path="mahsulotlar" element={<Mahsulotlar />} />
  </Route>
)
