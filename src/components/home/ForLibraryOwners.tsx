import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Building2, 
  TrendingUp, 
  Calendar, 
  CreditCard,
  Users,
  BarChart3,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  "Reach thousands of students in your city",
  "Manage bookings with our intuitive dashboard",
  "Accept payments directly via UPI",
  "Get detailed analytics and reports",
  "24/7 support from our team",
  "Increase your library's visibility",
];

const membershipPlans = [
  {
    name: "Basic",
    price: "₹999",
    period: "/month",
    features: ["Up to 50 seats", "Basic analytics", "Email support"],
    popular: false,
  },
  {
    name: "Pro",
    price: "₹2,499",
    period: "/month",
    features: ["Up to 150 seats", "Advanced analytics", "Priority support", "Featured listing"],
    popular: true,
  },
  {
    name: "Premium",
    price: "₹4,999",
    period: "/month",
    features: ["Unlimited seats", "Full analytics suite", "Dedicated support", "Top featured listing", "Custom branding"],
    popular: false,
  },
];

const ForLibraryOwners = () => {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Background Decoration */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-secondary/30 rounded-full blur-3xl"
      />

      <div className="relative section-container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4"
          >
            <Building2 className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">For Property Owners</span>
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-heading text-3xl md:text-4xl font-bold mb-4"
          >
            Grow Your Property Business
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            List your library, PG, hostel, or hotel and reach thousands of students
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-heading text-2xl font-bold mb-6">
              Why Partner With Us?
            </h3>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <Link to="/register-library" className="inline-block mt-8">
              <Button className="btn-secondary gap-2">
                Register Your Library
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Illustration/Stats Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-card rounded-3xl p-8 shadow-premium border border-border">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center p-4 rounded-2xl bg-primary/5">
                  <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="font-heading text-2xl font-bold">40%</div>
                  <div className="text-sm text-muted-foreground">Avg. Revenue Increase</div>
                </div>
                <div className="text-center p-4 rounded-2xl bg-secondary/5">
                  <Users className="w-8 h-8 text-secondary mx-auto mb-2" />
                  <div className="font-heading text-2xl font-bold">3x</div>
                  <div className="text-sm text-muted-foreground">More Visibility</div>
                </div>
                <div className="text-center p-4 rounded-2xl bg-success/5">
                  <Calendar className="w-8 h-8 text-success mx-auto mb-2" />
                  <div className="font-heading text-2xl font-bold">90%</div>
                  <div className="text-sm text-muted-foreground">Seat Occupancy</div>
                </div>
                <div className="text-center p-4 rounded-2xl bg-info/5">
                  <BarChart3 className="w-8 h-8 text-info mx-auto mb-2" />
                  <div className="font-heading text-2xl font-bold">Real-time</div>
                  <div className="text-sm text-muted-foreground">Analytics</div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Join <span className="text-foreground font-semibold">500+ libraries</span> already on our platform
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Membership Plans */}
        <div className="mt-20">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-2xl md:text-3xl font-bold text-center mb-10"
          >
            Membership Plans
          </motion.h3>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {membershipPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className={`relative rounded-2xl p-6 ${
                  plan.popular
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-card border border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h4 className="font-heading text-xl font-semibold mb-2">{plan.name}</h4>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-heading text-3xl font-bold">{plan.price}</span>
                    <span className={plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 ${plan.popular ? "text-secondary" : "text-success"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "secondary" : "outline"}
                  className="w-full"
                >
                  Get Started
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForLibraryOwners;
