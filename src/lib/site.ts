/** Typed access to src/content/site.yaml (edit the YAML, not this file). */
import { parse } from "yaml";
import raw from "../content/site.yaml?raw";

type Link = { label: string; href: string };
export type Site = {
  name: string;
  legalName: string;
  tagline: string;
  email: string;
  phone: string;
  address: { street: string; locality: string; region: string; postcode: string; country: string };
  areaServed: string[];
  nav: Link[];
  cta: Link;
  footerNote: string;
  analytics?: { gtm?: string };
};

export const site = parse(raw) as Site;
export const telHref = `tel:+44${site.phone.replace(/\s/g, "").replace(/^0/, "")}`;
