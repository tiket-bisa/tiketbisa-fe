export interface SeoMetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const DEFAULT_TITLE = "Tiketbisa";
const DEFAULT_DESCRIPTION = "Platform ticketing dan event management terbaik.";
const DEFAULT_IMAGE = "https://tiketbisa.com/favicon.png";

/**
 * Generates an array of meta objects for React Router v7 `meta` function.
 * It includes standard meta tags and Open Graph / Twitter Card tags for rich link previews.
 */
export function generateSeoMeta({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
}: SeoMetaProps = {}) {
  const meta = [
    { title: title !== DEFAULT_TITLE ? `${title} | ${DEFAULT_TITLE}` : title },
    { name: "description", content: description },
    
    // Open Graph
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:type", content: type },
    { property: "og:site_name", content: DEFAULT_TITLE },
    
    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];

  if (url) {
    meta.push({ property: "og:url", content: url });
  }

  return meta;
}
