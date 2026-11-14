import ContactContent from "@/components/contact/ContactContent";

export const metadata = {
  title: "Contact Us | PretyPet Support & Inquiries",
  description:
    "Get in touch with PretyPet customer support. Contact us for order status, pet product advice, returns, or general inquiries.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
