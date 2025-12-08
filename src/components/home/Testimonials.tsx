import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Anjali Verma",
    role: "UPSC Aspirant",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    rating: 5,
    text: "LibraryBook has been a game-changer for my UPSC preparation. I can find libraries with all the facilities I need - AC, WiFi, and quiet zones. The booking process is so smooth!",
    location: "Delhi",
  },
  {
    id: 2,
    name: "Rahul Kumar",
    role: "Medical Student",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    rating: 5,
    text: "As a medical student, I need long study hours. LibraryBook helps me find libraries with flexible timings and comfortable seating. Highly recommended!",
    location: "Mumbai",
  },
  {
    id: 3,
    name: "Priya Sharma",
    role: "CA Final Student",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    rating: 5,
    text: "The best platform for finding study spaces. I love how I can see the seat layout before booking. It saves so much time and hassle!",
    location: "Pune",
  },
  {
    id: 4,
    name: "Vikram Singh",
    role: "Library Owner",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    rating: 5,
    text: "Since joining LibraryBook, my library's occupancy has increased by 60%. The dashboard is easy to use and payments are always on time.",
    location: "Bangalore",
  },
];

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <div className="relative section-container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="badge-primary mb-4 inline-block"
          >
            Testimonials
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-heading text-3xl md:text-4xl font-bold mb-4"
          >
            What Our Users Say
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Join thousands of satisfied students and library owners
          </motion.p>
        </div>

        {/* Testimonial Slider */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Main Testimonial */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card rounded-3xl p-8 md:p-12 shadow-premium border border-border relative"
              >
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 md:top-8 md:right-8">
                  <Quote className="w-12 h-12 text-primary/10" />
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                  {/* Avatar */}
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0"
                  >
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-primary/20 shadow-lg">
                      <img
                        src={testimonials[activeIndex].image}
                        alt={testimonials[activeIndex].name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 text-center md:text-left">
                    {/* Rating */}
                    <div className="flex items-center justify-center md:justify-start gap-1 mb-4">
                      {Array.from({ length: testimonials[activeIndex].rating }).map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-warning fill-warning" />
                      ))}
                    </div>

                    {/* Text */}
                    <p className="text-lg md:text-xl text-foreground leading-relaxed mb-6">
                      "{testimonials[activeIndex].text}"
                    </p>

                    {/* Author */}
                    <div>
                      <h4 className="font-heading font-semibold text-lg">
                        {testimonials[activeIndex].name}
                      </h4>
                      <p className="text-muted-foreground">
                        {testimonials[activeIndex].role} • {testimonials[activeIndex].location}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevTestimonial}
                className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              {/* Dots */}
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === activeIndex
                        ? "bg-primary w-8"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextTestimonial}
                className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* All Testimonials Grid (Smaller) */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.button
              key={testimonial.id}
              onClick={() => setActiveIndex(index)}
              whileHover={{ scale: 1.05 }}
              className={`p-4 rounded-xl border transition-all ${
                index === activeIndex
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <img
                src={testimonial.image}
                alt={testimonial.name}
                className="w-12 h-12 rounded-full mx-auto mb-2 object-cover"
              />
              <p className="font-medium text-sm truncate">{testimonial.name}</p>
              <p className="text-xs text-muted-foreground truncate">{testimonial.role}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
