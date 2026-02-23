import { motion } from "framer-motion";
import { Search, Calendar, CreditCard, BookOpen, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search Properties",
    description: "Find libraries, PG, hostels, and rooms near you. Filter by city, facilities, price, and type.",
    color: "primary",
  },
  {
    icon: Calendar,
    title: "Choose Your Plan",
    description: "Select seats, rooms, or beds. Pick daily, monthly, or custom booking plans.",
    color: "secondary",
  },
  {
    icon: CreditCard,
    title: "Easy Payment",
    description: "Pay securely via UPI. Transparent pricing with no hidden charges.",
    color: "success",
  },
  {
    icon: BookOpen,
    title: "Move In & Study",
    description: "Get instant confirmation. Start studying or move into your accommodation.",
    color: "info",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
      
      <div className="relative section-container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="badge-secondary mb-4 inline-block"
          >
            Simple Process
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-heading text-3xl md:text-4xl font-bold mb-4"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Book your perfect study seat in just 4 simple steps
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-20 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary via-secondary to-success" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              <div className="text-center">
                {/* Step Number & Icon */}
                <div className="relative inline-block mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-20 h-20 rounded-2xl bg-${step.color}/10 flex items-center justify-center relative z-10`}
                  >
                    <step.icon className={`w-9 h-9 text-${step.color}`} />
                  </motion.div>
                  
                  {/* Step Number Badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-foreground text-background font-bold flex items-center justify-center text-sm z-20">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-heading text-xl font-semibold mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow (between steps on mobile) */}
              {index < steps.length - 1 && (
                <div className="lg:hidden flex justify-center my-6">
                  <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
