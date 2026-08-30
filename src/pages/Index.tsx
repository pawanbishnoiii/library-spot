import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Store, ShieldCheck, Star, MapPin } from "lucide-react";
import DiscoverHeader from "@/components/app/DiscoverHeader";
import CategoryGrid from "@/components/home/CategoryGrid";
import NearYouRail, { useDiscoverItems } from "@/components/home/NearYouRail";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import HowItWorks from "@/components/home/HowItWorks";
import ForLibraryOwners from "@/components/home/ForLibraryOwners";
import { useUserLocation } from "@/contexts/LocationContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { items, isLoading } = useDiscoverItems();
  const { distanceFrom, location } = useUserLocation();

  const nearYou = useMemo(() => {
    const withDist = items.map((i) => ({ item: i, d: distanceFrom(i.lat, i.lng) }));
    return withDist
      .sort((a, b) => (a.d ?? 9999) - (b.d ?? 9999))
      .map((x) => x.item)
      .slice(0, 12);
  }, [items, distanceFrom]);

  const topRated = useMemo(
    () => [...items].sort((a, b) => b.rating - a.rating).slice(0, 12),
    [items]
  );
  const services = useMemo(() => items.filter((i) => i.kind === "service").slice(0, 12), [items]);
  const properties = useMemo(() => items.filter((i) => i.kind !== "service").slice(0, 12), [items]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DiscoverHeader />

      <main>
        {/* Search */}
        <section className="section-container pt-3">
          <Link
            to="/search"
            className="flex h-12 items-center gap-3 rounded-2xl border border-border bg-card px-4 text-sm text-muted-foreground shadow-sm"
          >
            <Search className="h-4 w-4" />
            Search libraries, gyms, PGs, hostels, services…
          </Link>
        </section>

        <CategoryGrid />

        {/* Hero / trust */}
        <section className="section-container">
          <div className="overflow-hidden rounded-3xl bg-gradient-primary p-5 text-primary-foreground sm:p-8">
            <h1 className="max-w-lg text-2xl font-extrabold leading-tight sm:text-4xl">
              Find the best places &amp; services around you
            </h1>
            <p className="mt-2 max-w-md text-sm text-primary-foreground/85">
              Verified libraries, gyms, PGs, hostels, rooms and local services
              {location.city ? ` in ${location.city}` : " near your location"}.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="secondary" className="h-11 gap-2 rounded-2xl">
                <Link to="/search">
                  Explore nearby <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 gap-2 rounded-2xl border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/auth/signup?type=owner">
                  <Store className="h-4 w-4" /> List your property / service
                </Link>
              </Button>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
              {[
                { icon: ShieldCheck, label: "Verified listings" },
                { icon: Star, label: "Real reviews" },
                { icon: MapPin, label: "Local discovery" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 rounded-xl bg-primary-foreground/10 p-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <NearYouRail
          title="Near you"
          subtitle={location.city ? `Around ${location.city}` : "Set your location for accurate distance"}
          items={nearYou}
          isLoading={isLoading}
        />
        <NearYouRail title="Top rated" subtitle="Highest rated by real people" items={topRated} isLoading={isLoading} />
        <NearYouRail
          title="Properties near you"
          subtitle="Libraries, gyms, PGs, hostels & rooms"
          items={properties}
          isLoading={isLoading}
        />
        <NearYouRail
          title="Services near you"
          subtitle="Tiffin, laundry, electrician & cleaning"
          items={services}
          isLoading={isLoading}
        />

        <HowItWorks />
        <ForLibraryOwners />
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
