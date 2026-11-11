/** JSON-LD structured data for Google. Facts come from src/content/site.yaml. */
import { site, telHref } from "./site";

const base = "https://www.conservationbuilder.com";
export const orgId = `${base}/#business`;

export const business = () => ({
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "@id": orgId,
  name: site.name,
  description: site.tagline,
  url: base,
  logo: `${base}/assets/logo.png`,
  email: site.email,
  telephone: telHref.replace("tel:", ""),
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.locality,
    addressRegion: site.address.region,
    postalCode: site.address.postcode,
    addressCountry: site.address.country,
  },
  areaServed: site.areaServed.map((name) => ({ "@type": "Place", name })),
});

export const breadcrumbs = (items: [string, string][]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [["Home", "/"], ...items].map(([name, path], i) => ({
    "@type": "ListItem", position: i + 1, name, item: new URL(path, base).href,
  })),
});
