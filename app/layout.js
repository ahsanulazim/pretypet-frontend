import { DM_Sans } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/query/QueryProvider";
import MyProvider from "@/context/MyProvider";
import { ToastContainer } from "react-toastify";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { SocketProvider } from "@/context/SocketContext";
import MetaPixel from "@/components/analytics/MetaPixel";

const dm_sans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pretypet.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PretyPet | Pet Accessories, Premium Food & Gadgets",
    template: "%s | PretyPet",
  },
  description:
    "Explore top-quality pet accessories, nutritious food, durable toys, and comfy beds for dogs and cats at PretyPet. Fast shipping, secure checkout, and best prices.",
  keywords: [
    "pet accessories",
    "dog food",
    "cat toys",
    "pet grooming supplies",
    "pet shop online",
    "PretyPet",
    "buy pet products",
  ],
  authors: [{ name: "PretyPet" }],
  creator: "PretyPet",
  publisher: "PretyPet",
  icons: {
    icon: "/assets/pretypet-logo-short.svg",
    apple: "/assets/pretypet-logo-short.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "PretyPet",
    title: "PretyPet | Pet Accessories, Premium Food & Gadgets",
    description:
      "Explore top-quality pet accessories, nutritious food, durable toys, and comfy beds for dogs and cats at PretyPet.",
    images: [
      {
        url: "/assets/pretypet-logo-short.svg",
        width: 800,
        height: 600,
        alt: "PretyPet Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PretyPet | Pet Accessories, Premium Food & Gadgets",
    description:
      "Explore top-quality pet accessories, nutritious food, durable toys, and comfy beds for dogs and cats at PretyPet.",
    images: ["/assets/pretypet-logo-short.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "PretyPet",
      url: siteUrl,
      logo: `${siteUrl}/assets/pretypet-logo-short.svg`,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: ["English", "Bengali"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "PretyPet",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dm_sans.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-full font-dm-sans">
        <MetaPixel />
        <QueryProvider>
          <MyProvider>
            <SocketProvider>
              <CartProvider>
                <WishlistProvider>
                  <ToastContainer />
                  {children}
                </WishlistProvider>
              </CartProvider>
            </SocketProvider>
          </MyProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
