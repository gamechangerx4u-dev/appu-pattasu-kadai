import { Helmet } from 'react-helmet-async';
import { SITE, getSiteImage, buildPageTitle } from '../lib/seo';

const Seo = ({
  title,
  description = SITE.description,
  path = '/',
  image = getSiteImage(),
  noIndex = false,
}) => {
  const pageTitle = buildPageTitle(title);
  const canonical = `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={SITE.locale} />

      <meta name="twitter:card" content={SITE.twitterCard} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {noIndex && <meta name="robots" content="noindex,nofollow" />}
    </Helmet>
  );
};

export default Seo;
