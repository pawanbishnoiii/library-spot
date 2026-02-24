import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

const cities = [
  { name: "Delhi", image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80", count: "2400+" },
  { name: "Mumbai", image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80", count: "1800+" },
  { name: "Bangalore", image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&q=80", count: "2100+" },
  { name: "Jaipur", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&q=80", count: "900+" },
  { name: "Pune", image: "https://images.unsplash.com/photo-1572782252655-9c8771392601?w=400&q=80", count: "1200+" },
  { name: "Hyderabad", image: "https://images.unsplash.com/photo-1572427366913-a12fc3812bf2?w=400&q=80", count: "1500+" },
];

const PopularCities = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="section-container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="font-heading text-2xl md:text-3xl font-bold">
              Popular Cities
            </motion.h2>
            <p className="text-muted-foreground mt-1">Find properties in top student cities</p>
          </div>
          <Link to="/search" className="text-sm font-medium text-primary hover:underline">See all</Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cities.map((city, i) => (
            <motion.div key={city.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Link to={`/search?city=${city.name}`} className="group block">
                <div className="relative rounded-2xl overflow-hidden aspect-[3/4]">
                  <img src={city.image} alt={city.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-white font-bold text-lg">{city.name}</h3>
                    <p className="text-white/80 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{city.count} properties</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularCities;
