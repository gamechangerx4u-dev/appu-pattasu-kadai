export const SITE = {
  name: 'Appu Crackers',
  title: 'Appu Crackers — Premium Sivakasi Crackers Online',
  description: 'Shop premium Sivakasi crackers online at Appu Crackers. Wide range of fireworks for Diwali and celebrations with delivery across Tamil Nadu.',
  url: 'https://appucrackers.in',
  locale: 'en_IN',
  email: 'appucrackers@gmail.com',
  twitterCard: 'summary_large_image',
};

export const getSiteImage = () => `${SITE.url}/logo.jpg`;

export const buildPageTitle = (pageTitle) => (
  pageTitle ? `${pageTitle} | ${SITE.name}` : SITE.title
);
