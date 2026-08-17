import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'am';

export const translations = {
  en: {
    shopNow: 'Shop Now',
    whyChooseUs: 'Why Choose Us',
    bestSeller: 'Best Seller',
    traditionalClub: 'Traditional Club',
    aboutBazaar: 'About Our Bazaar',
    searchPlaceholder: 'Search authentic items...',
    browseByCategory: 'Browse by Category',
    shopByCategory: 'Shop by Category',
    viewAll: 'View all',
    featuredCollection: 'Featured Collection',
    handpickedForYou: 'Handpicked for You',
    authenticArtisans: 'Authentic cultural items crafted by local artisans',
    addToCart: 'Add to Cart',
    freeDelivery: 'Free Delivery',
    freeDeliveryDesc: 'On orders over ETB 5,000',
    returnGuarantee: 'Return Guarantee',
    returnGuaranteeDesc: '30-day hassle-free returns',
    support247: '24/7 Support',
    supportDesc: 'Round the clock assistance',
    worldwideDelivery: 'Worldwide Delivery',
    worldwideDesc: 'Ship anywhere globally',
    happyCustomers: 'Happy Customers',
    handmadeItems: 'Handmade Items',
    localArtisans: 'Local Artisans',
    averageRating: 'Average Rating',
    whatCustomersSay: 'What Our Customers Say',
    acceptedPayments: 'Accepted Payment Methods',
    madeInEthiopia: 'Made in Ethiopia',
    createAccount: 'Create Free Account',
    browse: 'Browse',
    culturalCloth: 'Cultural Cloth',
    culturalClothDesc: 'Habesha kemis & netela',
    handmade: 'Handmade',
    handmadeDesc: 'Pottery, baskets & crafts',
    jewelry: 'Jewelry',
    jewelryDesc: 'Leather & accessories',
    artDecor: 'Art & Decor',
    artDecorDesc: 'Paintings & wall art',
    coffeeFood: 'Coffee & Food',
    coffeeFoodDesc: 'Ceremony sets & spices',
    digital: 'Digital',
    digitalDesc: 'Courses & downloads',
    seeAllProducts: 'See All Products',
  },
  am: {
    shopNow: 'ይሸምቱ',
    whyChooseUs: 'ለምን እኛን ይመርጣሉ',
    bestSeller: 'ተወዳጅ ዕቃዎች',
    traditionalClub: 'ባህላዊ ክለብ',
    aboutBazaar: 'ስለ ባዛራችን',
    searchPlaceholder: 'ዕቃዎችን ይፈልጉ...',
    browseByCategory: 'በምድብ ይመልከቱ',
    shopByCategory: 'በምድብ ይሸምቱ',
    viewAll: 'ሁሉንም ይመልከቱ',
    featuredCollection: 'ልዩ ምርጫዎች',
    handpickedForYou: 'ለእርስዎ የተመረጡ',
    authenticArtisans: 'በባህላዊ ባለሙያዎች በእጅ የተሰሩ ትክክለኛ የኢትዮጵያ ምርቶች',
    addToCart: 'ወደ ቅርጫት ጨምር',
    freeDelivery: 'ነፃ ማድረሻ',
    freeDeliveryDesc: 'ከ 5,000 ብር በላይ ለሆኑ ትዕዛዞች',
    returnGuarantee: 'የመመለስ ዋስትና',
    returnGuaranteeDesc: 'የ 30 ቀናት አስተማማኝ የመመለሻ ዋስትና',
    support247: '24/7 ድጋፍ',
    supportDesc: 'ሁልጊዜ ዝግጁ የሆነ የደንበኞች አገልግሎት',
    worldwideDelivery: 'ዓለም አቀፍ ማድረሻ',
    worldwideDesc: 'ወደ ማንኛውም የዓለም ክፍል እናደርሳለን',
    happyCustomers: 'ደስተኛ ደንበኞች',
    handmadeItems: 'በእጅ የተሰሩ ዕቃዎች',
    localArtisans: 'የሀገር ውስጥ ባለሙያዎች',
    averageRating: 'አማካይ ደረጃ',
    whatCustomersSay: 'ደንበኞቻችን ምን ይላሉ?',
    acceptedPayments: 'ተቀባይነት ያላቸው የክፍያ መንገዶች',
    madeInEthiopia: 'በኢትዮጵያ የተመረተ',
    createAccount: 'ነፃ አካውንት ይክፈቱ',
    browse: 'ምርቶችን ያስሱ',
    culturalCloth: 'የባህል አልባሳት',
    culturalClothDesc: 'የሀበሻ ቀሚስ እና ነጠላ',
    handmade: 'የእጅ ጥበብ',
    handmadeDesc: 'የሸክላ ዕቃዎች፣ ቅርጫቶች እና እደ-ጥበብ',
    jewelry: 'ጌጣጌጥና ቆዳ',
    jewelryDesc: 'የቆዳ ውጤቶችና ጌጣጌጦች',
    artDecor: 'ስነ-ጥበብና ጌጥ',
    artDecorDesc: 'ስዕሎችና የቤት ውስጥ ጌጦች',
    coffeeFood: 'የቡና ቁሳቁስና ቅመማቅመም',
    coffeeFoodDesc: 'የቡና ማፍያ ስብስቦችና ቅመሞች',
    digital: 'ዲጂታል',
    digitalDesc: 'ኮርሶችና መጽሐፍት',
    seeAllProducts: 'ሁሉንም ምርቶች ይመልከቱ',
  }
} as const;

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
      toggleLanguage: () =>
        set((state) => ({ language: state.language === 'en' ? 'am' : 'en' })),
    }),
    {
      name: 'eth-language-preference',
    }
  )
);
