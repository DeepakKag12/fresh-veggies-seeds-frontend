import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { buttonVariants } from "./Button";
import { ShoppingCart, Star, Heart } from "lucide-react";
import { cn } from "../../lib/utils";

export function ProductRevealCard({
  name = "Premium Vegetable Seeds Collection",
  price = "₹199",
  originalPrice = "₹299",
  image = "https://images.unsplash.com/photo-1592417817098-8f3d6eb22639?w=800&auto=format&fit=crop&q=80",
  description = "Experience studio-quality sound with advanced noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.",
  rating = 4.8,
  reviewCount = 124,
  onAdd,
  onFavorite,
  onViewDetails,
  enableAnimations = true,
  className,
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  const handleFavorite = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setIsFavorite(!isFavorite);
    if (onFavorite) onFavorite();
  };

  const containerVariants = {
    rest: { 
      scale: 1,
      y: 0,
      filter: "blur(0px)",
    },
    hover: shouldAnimate ? { 
      scale: 1.03, 
      y: -8,
      filter: "blur(0px)",
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        mass: 0.8,
      }
    } : {},
  };

  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.1 },
  };

  const overlayVariants = {
    rest: { 
      y: "100%", 
      opacity: 0,
      filter: "blur(4px)",
    },
    hover: { 
      y: "0%", 
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 28,
        mass: 0.6,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const contentVariants = {
    rest: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
    },
    hover: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.5,
      },
    },
  };

  const buttonVariants_motion = {
    rest: { scale: 1, y: 0 },
    hover: shouldAnimate ? { 
      scale: 1.05, 
      y: -2,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 25 
      }
    } : {},
    tap: shouldAnimate ? { scale: 0.95 } : {},
  };

  const favoriteVariants = {
    rest: { scale: 1, rotate: 0 },
    favorite: { 
      scale: [1, 1.3, 1], 
      rotate: [0, 10, -10, 0],
      transition: { 
        duration: 0.5,
        ease: "easeInOut"
      }
    },
  };

  // Safe discount percentage calculation
  const numericPrice = parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;
  const numericOrigPrice = parseFloat(String(originalPrice).replace(/[^0-9.]/g, '')) || 0;
  const discountPercent = numericOrigPrice > numericPrice
    ? Math.round(((numericOrigPrice - numericPrice) / numericOrigPrice) * 100)
    : null;

  return (
    <motion.div
      data-slot="product-reveal-card"
      initial="rest"
      whileHover="hover"
      variants={containerVariants}
      className={cn(
        "relative w-80 rounded-2xl border border-fv-border bg-white dark:bg-gray-800 text-fv-heading overflow-hidden",
        "shadow-lg shadow-black/5 cursor-pointer group",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <motion.img
          src={image}
          alt={name}
          className="h-56 w-full object-cover"
          variants={imageVariants}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        
        {/* Favorite Button */}
        <motion.button
          onClick={handleFavorite}
          variants={favoriteVariants}
          animate={isFavorite ? "favorite" : "rest"}
          className={cn(
            "absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-sm border border-white/20 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors",
            isFavorite 
              ? "bg-red-500 text-white" 
              : "bg-white/20 text-white hover:bg-white/30"
          )}
          aria-label="Add to favorites"
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </motion.button>

        {/* Discount Badge */}
        {discountPercent !== null && discountPercent > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold"
          >
            {discountPercent}% OFF
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-3">
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-4 h-4",
                  i < Math.floor(rating) 
                    ? "text-yellow-400 fill-current" 
                    : "text-fv-muted"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-fv-muted">
            {rating} ({reviewCount} reviews)
          </span>
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          <motion.h3 
            className="text-xl font-bold leading-tight tracking-tight text-fv-heading"
            initial={{ opacity: 0.9 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {name}
          </motion.h3>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-fv-primary">{price}</span>
            {originalPrice && (
              <span className="text-lg text-fv-muted line-through">
                {originalPrice}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reveal Overlay */}
      <motion.div
        variants={overlayVariants}
        className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl flex flex-col justify-end"
      >
        <div className="p-6 space-y-4">
          {/* Product Description */}
          <motion.div variants={contentVariants}>
            <h4 className="font-semibold mb-2 text-fv-heading">Product Details</h4>
            <p className="text-sm text-fv-muted leading-relaxed line-clamp-3">
              {description}
            </p>
          </motion.div>

          {/* Features */}
          <motion.div variants={contentVariants}>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-fv-surface/70 rounded-lg p-2 text-center border border-fv-border/50">
                <div className="font-semibold text-fv-heading">100% Organic</div>
                <div className="text-fv-muted">Certified Non-GMO</div>
              </div>
              <div className="bg-fv-surface/70 rounded-lg p-2 text-center border border-fv-border/50">
                <div className="font-semibold text-fv-heading">High Germination</div>
                <div className="text-fv-muted">90%+ Rate</div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={contentVariants} className="space-y-3">
            <motion.button
              onClick={(e) => {
                if (e && e.stopPropagation) e.stopPropagation();
                if (onAdd) onAdd();
              }}
              variants={buttonVariants_motion}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className={cn(
                buttonVariants({ variant: "default" }), 
                "w-full h-12 font-semibold min-h-[44px]",
                "bg-gradient-to-r from-fv-primary to-fv-primary-dark text-white",
                "hover:from-fv-primary-dark hover:to-fv-primary",
                "shadow-lg shadow-fv-primary/25 rounded-xl cursor-pointer"
              )}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </motion.button>
            
            <motion.button
              onClick={(e) => {
                if (e && e.stopPropagation) e.stopPropagation();
                if (onViewDetails) onViewDetails();
              }}
              variants={buttonVariants_motion}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className={cn(
                buttonVariants({ variant: "outline" }), 
                "w-full h-10 font-semibold min-h-[44px] rounded-xl cursor-pointer border-fv-border text-fv-heading hover:bg-fv-surface"
              )}
            >
              View Details
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ProductRevealCard;
