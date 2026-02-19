import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Truck, Leaf, ShieldCheck, Tag, Sprout, Flower2, ShoppingBag, Wrench, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Redirect admin to dashboard
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Dummy products data with the provided images
  const dummyProducts = [
    {
      _id: '1',
      name: 'Organic Tomato Seeds',
      price: 49,
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
      category: 'Seeds',
      description: 'Premium quality organic tomato seeds',
      stock: 100,
      featured: true
    },
    {
      _id: '2',
      name: 'Red Chilli Flakes',
      price: 89,
      image: 'https://images.unsplash.com/photo-1583706132607-7d2f8e0c3c3d?w=400',
      category: 'Spices',
      description: 'Organic dried red chilli flakes',
      stock: 50,
      featured: true
    },
    {
      _id: '3',
      name: 'Coriander Seeds',
      price: 39,
      image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400',
      category: 'Seeds',
      description: 'Fresh organic coriander seeds',
      stock: 80,
      featured: true
    },
    {
      _id: '4',
      name: 'Fresh Spinach Seeds',
      price: 59,
      image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
      category: 'Seeds',
      description: 'High yield organic spinach seeds',
      stock: 75,
      featured: true
    },
    {
      _id: '5',
      name: 'Black Pepper Seeds',
      price: 99,
      image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400',
      category: 'Seeds',
      description: 'Organic black pepper seeds',
      stock: 60,
      featured: true
    },
    {
      _id: '6',
      name: 'Mixed Salad Seeds',
      price: 79,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
      category: 'Seeds',
      description: 'Variety pack of organic salad seeds',
      stock: 90,
      featured: true
    },
    {
      _id: '7',
      name: 'Bell Pepper Seeds',
      price: 69,
      image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400',
      category: 'Seeds',
      description: 'Colorful bell pepper seeds',
      stock: 70,
      featured: true
    },
    {
      _id: '8',
      name: 'Herb Garden Kit',
      price: 149,
      image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400',
      category: 'Kits',
      description: 'Complete herb gardening kit',
      stock: 40,
      featured: true
    }
  ];

  useEffect(() => {
    fetchFeaturedProducts();
    fetchCombos();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await api.get('/products/featured');
      if (response.data.data && response.data.data.length > 0) {
        setFeaturedProducts(response.data.data);
      } else {
        // Use dummy products if API returns empty or fails
        setFeaturedProducts(dummyProducts);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
      // Use dummy products on error
      setFeaturedProducts(dummyProducts);
    }
  };

  const fetchCombos = async () => {
    try {
      const response = await api.get('/combos');
      setCombos(response.data.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching combos:', error);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };


  return (
    <>
      {/* ── Hero Section ────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-green-500 to-green-700 py-16 md:py-24 overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-10 left-10 w-48 h-48 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* Text + CTAs */}
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-md mb-4">
                Fresh Veggies
              </h1>
              <h2 className="text-2xl md:text-3xl font-medium text-white mb-4 drop-shadow-sm">
                Treat Yourself Organic 🌱
              </h2>
              <p className="text-white/90 text-base md:text-lg leading-relaxed max-w-xl mb-8">
                Premium quality organic seeds, fertilizers, and gardening supplies for your home garden.
                Start your organic journey today with expert guidance!
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-green-700 font-semibold text-lg rounded-xl shadow-lg hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300"
                >
                  Shop Now <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/combos"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-white text-white font-semibold text-lg rounded-xl hover:bg-white/15 hover:-translate-y-0.5 transition-all duration-300"
                >
                  View Offers <Tag className="w-5 h-5" />
                </Link>
              </div>
            </div>
            {/* Hero image – desktop only */}
            <div className="hidden md:flex flex-1 justify-center">
              <img
                src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600"
                alt="Organic Gardening"
                className="w-full max-w-md rounded-3xl shadow-2xl hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories Section ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-14 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-3">Shop by Category</h2>
          <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto">
            Everything you need for a thriving organic garden
          </p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {[
            { icon: Sprout,   title: 'Vegetable Seeds', desc: 'Organic seeds for healthy harvest',  bg: 'bg-green-50',   icon_color: 'text-green-600',   link: '/shop?category=vegetable' },
            { icon: Flower2,  title: 'Flower Seeds',    desc: 'Beautiful blooms for your garden',   bg: 'bg-pink-50',    icon_color: 'text-pink-500',    link: '/shop?category=flower' },
            { icon: ShoppingBag, title: 'Grow Bags',   desc: 'Durable container gardening bags',   bg: 'bg-amber-50',   icon_color: 'text-amber-700',   link: '/shop?category=growbags' },
            { icon: Leaf,     title: 'Soil & Fertilizer', desc: 'Nutrient-rich organic fertilizers', bg: 'bg-lime-50', icon_color: 'text-lime-700',    link: '/shop?category=fertilizer' },
            { icon: Wrench,   title: 'Gardening Tools', desc: 'Essential tools for easy gardening', bg: 'bg-slate-50',   icon_color: 'text-slate-600',   link: '/shop?category=tools' },
            { icon: Tag,      title: 'Combo Packs',     desc: 'Special bundles at great prices',    bg: 'bg-emerald-50', icon_color: 'text-emerald-600', link: '/combos' },
          ].map(({ icon: Icon, title, desc, bg, icon_color, link }) => (
            <Link
              key={title}
              to={link}
              className={`group flex flex-col items-center text-center p-4 rounded-2xl ${bg} hover:bg-green-600 hover:shadow-xl hover:-translate-y-2 transition-all duration-300`}
            >
              <Icon className={`w-10 h-10 mb-3 ${icon_color} group-hover:text-white transition-colors`} />
              <p className={`text-xs md:text-sm font-bold mb-1 ${icon_color} group-hover:text-white transition-colors`}>{title}</p>
              <p className="text-xs text-gray-500 group-hover:text-white/80 transition-colors hidden sm:block leading-tight">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Why Choose Us ────────────────────────────────── */}
      <section className="bg-gray-50 py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-green-800">Why Choose Us?</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Leaf,        title: '100% Organic',       desc: 'Certified organic seeds with no chemicals or pesticides',  color: 'text-green-500',  border: 'hover:border-green-500' },
              { icon: ShieldCheck, title: 'Quality Guaranteed', desc: 'High germination rate with quality assurance',              color: 'text-blue-400',   border: 'hover:border-blue-400' },
              { icon: Truck,       title: 'Fast Delivery',      desc: 'Quick and safe delivery across India',                     color: 'text-orange-400', border: 'hover:border-orange-400' },
              { icon: Tag,         title: 'Best Prices',        desc: 'Competitive prices with amazing combo offers',             color: 'text-amber-500', border: 'hover:border-amber-500' },
            ].map(({ icon: Icon, title, desc, color, border }) => (
              <div
                key={title}
                className={`bg-white rounded-2xl p-6 text-center border-2 border-transparent ${border} hover:-translate-y-2 hover:shadow-xl transition-all duration-300`}
              >
                <Icon className={`w-12 h-12 mx-auto mb-4 ${color}`} />
                <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-14 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-3">🌿 Featured Products</h2>
          <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto">
            Handpicked organic seeds and supplies for your garden
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:-translate-y-3 hover:shadow-2xl hover:border-green-400 transition-all duration-300 flex flex-col"
            >
              <div className="relative overflow-hidden">
                <img
                  src={product.image || product.images?.[0] || 'https://via.placeholder.com/200'}
                  alt={product.name}
                  className="w-full h-44 object-cover hover:scale-110 transition-transform duration-300"
                />
                {product.featured && (
                  <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    Featured
                  </span>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-2 min-h-[2.5rem] leading-tight">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl font-bold text-green-700">₹{product.price}</span>
                  <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">In Stock</span>
                </div>
                <Link
                  to={`/product/${product._id}`}
                  className="mt-auto block text-center py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-10 py-3 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300"
          >
            View All Products <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Combo Packs (conditional) ─────────────────────── */}
      {combos.length > 0 && (
        <section className="bg-gradient-to-br from-gray-50 to-green-50 py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-3">🌱 Special Combo Offers</h2>
              <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto">
                Save more with our specially curated combo packages
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {combos.map((combo) => (
                <div
                  key={combo._id}
                  className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:-translate-y-3 hover:scale-[1.02] hover:shadow-2xl hover:border-orange-400 transition-all duration-300 flex flex-col"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={combo.images?.[0] || 'https://via.placeholder.com/400x200?text=Combo+Pack'}
                      alt={combo.name}
                      className="w-full h-52 object-cover hover:scale-110 transition-transform duration-300"
                    />
                    <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                      COMBO OFFER
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{combo.name}</h3>
                    <p className="text-gray-500 text-sm mb-4 min-h-[2.75rem] leading-relaxed">{combo.description}</p>
                    <div className="flex items-end gap-3 mb-5">
                      <span className="text-3xl font-extrabold text-green-700">₹{combo.price}</span>
                      {combo.originalPrice && (
                        <div>
                          <span className="line-through text-gray-400 text-base">₹{combo.originalPrice}</span>
                          <span className="ml-2 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                            {Math.round(((combo.originalPrice - combo.price) / combo.originalPrice) * 100)}% OFF
                          </span>
                        </div>
                      )}
                    </div>
                    <Link
                      to="/combos"
                      className="mt-auto block text-center py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl shadow hover:shadow-md transition-all"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                to="/combos"
                className="inline-flex items-center gap-2 px-10 py-3 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all"
              >
                View All Combos <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default Home;
