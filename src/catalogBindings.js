import { registerCatalog } from './recordSync'
import { marketProducts } from './marketData'
import { books } from './booksData'
import { courses } from './educationData'
import { articles } from './yangiliklarData'
import { channels } from './channelsData'
import { masters } from './ustalarData'
import { ADS } from './elonlarData'
import { deals } from './aksiyaData'
import { surplusItems } from './surplusData'
import { products as uniforms } from './formaData'
import { products as devices } from './jihozData'
import { DOCTORS } from './mutaxassislarData'
import { jobs } from './ishlarData'
import { certs } from './sertifikatData'
import { seedPosts } from './communityData'

registerCatalog('product', marketProducts)
registerCatalog('book', books)
registerCatalog('course', courses)
registerCatalog('article', articles)
registerCatalog('channel', channels)
registerCatalog('master', masters)
registerCatalog('ad', ADS)
registerCatalog('deal', deals)
registerCatalog('surplus', surplusItems)
registerCatalog('uniform', uniforms)
registerCatalog('device', devices)
registerCatalog('doctor', DOCTORS)
registerCatalog('job', jobs)
registerCatalog('certificate', certs)
registerCatalog('post', seedPosts)
