export const CATEGORIES = ['Restavratsion materiallar', 'Implantlar', 'Yordamchi materiallar', 'Sarflanadigan materiallar', 'Endodontik asboblar', 'Instrumentlar', 'Uskunalar', 'Himoya vositalari', 'O‘lchov materiallari', 'Ortodontiya', 'Gigiena vositalari', 'Boshqa']
export const BRANDS = ['3M', 'Dentsply Sirona', 'Ivoclar', 'GC', 'Kerr', 'VOCO', 'Straumann', 'Osstem', 'Nobel Biocare', 'Megagen', 'Coltene', 'Septodont', 'Woodpecker', 'NSK', 'W&H', 'Mahalliy ishlab chiqaruvchi', 'Boshqa']
export const COUNTRIES = ['O‘zbekiston', 'Janubiy Koreya', 'Germaniya', 'AQSh', 'Shveytsariya', 'Yaponiya', 'Italiya', 'Xitoy', 'Turkiya', 'Rossiya', 'Isroil', 'Liechtenshteyn', 'Boshqa']
export const SHADES = ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'C1', 'C2', 'D2', 'Universal', '—']
export const variantLabel = (v) => [v.color, v.size].filter((x) => x && x !== '—').join(', ')
