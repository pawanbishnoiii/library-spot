import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import HeroSection from "@/components/home/HeroSection";
import PopularCities from "@/components/home/PopularCities";
import FeaturedLibraries from "@/components/home/FeaturedLibraries";
import HowItWorks from "@/components/home/HowItWorks";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import ForLibraryOwners from "@/components/home/ForLibraryOwners";
import Testimonials from "@/components/home/Testimonials";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      <main>
        <HeroSection />
        <PopularCities />
        <FeaturedLibraries />
        <HowItWorks />
        <WhyChooseUs />
        <ForLibraryOwners />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
