import { motion } from "framer-motion";
import { 
  Shield, 
  Clock, 
  ThumbsUp, 
  Headphones,
  Zap,
  Users,
  MapPin,
  BadgeCheck
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Verified Libraries",
    description: "All libraries are verified by our team to ensure quality and safety standards.",
  },
  {
    icon: Clock,
    title: "Flexible Timings",
    description: "Choose from multiple shifts - morning, afternoon, evening, or night. Study when it suits you.",
  },
  {
    icon: ThumbsUp,
    title: "Genuine Reviews",
    description: "Real reviews from real students help you make informed decisions.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our support team is always ready to help you with any queries or issues.",
  },
  {
    icon: Zap,
    title: "Instant Booking",
    description: "Book your seat in seconds. No waiting, no hassle, just study.",
  },
  {
    icon: MapPin,
    title: "Pan India Coverage",
    description: "Libraries across 100+ cities. Find one near your home or college.",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-20 md:py-28 bg-foreground text-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative section-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6"
            >
              <BadgeCheck className="w-4 h-4 text-primary-light" />
              <span className="text-sm font-medium text-primary-light">Trusted Platform</span>
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
            >
              Why Students
              <br />
              <span className="text-primary-light">Love Us</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-background/70 text-lg mb-8"
            >
              We're committed to providing the best study experience for students. 
              From verified libraries to instant bookings, we've got everything covered.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-3 gap-6"
            >
              <div>
                <div className="font-heading text-3xl md:text-4xl font-bold text-primary-light">50K+</div>
                <div className="text-background/60 text-sm">Happy Students</div>
              </div>
              <div>
                <div className="font-heading text-3xl md:text-4xl font-bold text-primary-light">500+</div>
                <div className="text-background/60 text-sm">Libraries</div>
              </div>
              <div>
                <div className="font-heading text-3xl md:text-4xl font-bold text-primary-light">100+</div>
                <div className="text-background/60 text-sm">Cities</div>
              </div>
            </motion.div>
          </div>

          {/* Right - Features Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-6 rounded-2xl bg-background/5 border border-background/10 backdrop-blur-sm hover:bg-background/10 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-light" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-background/60 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
