import Breadcrumbs from "@/components/dashboard/Breadcrumbs";
import ScrapedProducts from "@/components/dashboard/scraped-products/ScrapedProducts";

export const metadata = {
  title: "Scraped Products | Prety Pet",
};

const page = () => {
  return (
    <div className="space-y-6">
      <Breadcrumbs title="Scraped Products" />

      <section>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-base-content">
            Scraped Products
          </h1>
          <span className="badge badge-primary badge-soft text-xs font-semibold">
            Product Research
          </span>
        </div>
        <p className="text-xs text-base-content/60 mt-1 max-w-2xl">
          The server scans CJ Dropshipping&apos;s pet categories automatically
          and scores each product for the US market. Review the candidates
          here, shortlist the promising ones and dismiss the rest.
        </p>
      </section>

      <ScrapedProducts />
    </div>
  );
};

export default page;
