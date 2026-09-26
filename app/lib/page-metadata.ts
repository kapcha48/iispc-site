import type { Metadata } from "next";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
};

export function pageMetadata({ title, description, path, image = "/og.png", imageAlt = title }: PageMetadataOptions): Metadata {
  const images = image ? [{ url: image, alt: imageAlt }] : [];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      siteName: "IISPC",
      title,
      description,
      url: path,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export function missingPageMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: false },
    openGraph: { images: [] },
    twitter: { images: [] },
  };
}
