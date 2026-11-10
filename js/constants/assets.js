// Paths are relative to the HTML page so the site works from any sub-folder (GitHub Pages, Live Server).
const base = './';
const brandAsset = (fileName) => `${base}images/brand/${fileName}`;
const serviceAsset = (fileName) => `${base}images/services/${fileName}`;
export const ASSETS = {
    bgGeneral: brandAsset('pattern-background.png'),
    bgLanding: brandAsset('landing-background.png'),
    bgAuth: brandAsset('auth-background.png'),
    bgBanner: brandAsset('mascot-banner.png'),
    petPointBalance: brandAsset('pet-point-balance.png'),
    stickerKit: brandAsset('sticker-sheet.png'),
    mascotSheet: brandAsset('mascot-sheet.png'),
    heroMascots: brandAsset('hero-mascots.png'),
    loginMascots: brandAsset('login-mascots.png'),
    authMascots: brandAsset('login-mascots.png'),
    siteBackground: brandAsset('site-background.png'),
    footerBackground: brandAsset('footer-background.png'),
    heroPair: brandAsset('hero-mascot-pair.png'),
    chatbotIcon: brandAsset('chatbot-icon.png'),
    chatbotDog: brandAsset('chatbot-dog.webp'),
    meoAssistant: brandAsset('meo-phet-assistant.svg'),
    brandLogo: brandAsset('petphet-logo.webp'),
    statusSuccess: brandAsset('status-success.png'),
    statusError: brandAsset('status-error.png'),
    services: {
        grooming: serviceAsset('grooming.png'),
        vetConsult: serviceAsset('vet-consult.jpg'),
        vaccination: serviceAsset('vaccination.jpg'),
        dentalCare: serviceAsset('dental-care.jpg'),
        earExam: serviceAsset('ear-exam.jpg'),
        ultrasound: serviceAsset('ultrasound.jpg'),
        nailTrim: serviceAsset('nail-trim.jpg')
    }
};
export const BRAND_COLORS = {
    cream: '#E8CCAD',
    orange: '#EC802B',
    yellow: '#EDC55B',
    teal: '#66BCB4',
    brown: '#81451F'
};
