import { Suspense } from "react";
import ProductsCatalog from "@/components/product/ProductsCatalog";

export const metadata = {
  title: "All Pet Supplies & Products | PretyPet",
  description:
    "Explore our complete catalog of high-quality pet supplies. Find nutritious pet food, durable toys, comfortable beds, and grooming essentials for cats and dogs.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "All Pet Supplies & Products | PretyPet",
    description:
      "Explore our complete catalog of high-quality pet supplies. Nutritious food, durable toys, and care essentials for cats and dogs.",
    url: "/products",
  },
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-360 mx-auto px-4 py-16 text-center">
          <span className="loading loading-spinner loading-lg text-main"></span>
        </div>
      }
    >
      <ProductsCatalog />
    </Suspense>
  );
}
