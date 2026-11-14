import Categories from "@/components/home/Categories";
import Hero from "@/components/home/Hero";
import NewArrival from "@/components/home/NewArrival";

export const metadata = {
  title: "PretyPet | Best Pet Shop Online - Food, Toys & Care Accessories",
  description:
    "Welcome to PretyPet. Find premium pet food, grooming essentials, safe toys, and stylish pet accessories for cats and dogs. Fast delivery and reliable customer care.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PretyPet | Best Pet Shop Online - Food, Toys & Care Accessories",
    description:
      "Welcome to PretyPet. Find premium pet food, grooming essentials, safe toys, and stylish pet accessories for cats and dogs.",
    url: "/",
  },
};

const page = () => {
  return (
    <>
      <Hero />
      <Categories />
      <NewArrival />
    </>
  );
};

export default page;
