import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  CardMedia,
  Chip,
} from '@mui/material';
import {
  LocalShipping,
  Nature,
  VerifiedUser,
  LocalOffer,
  Spa,
  LocalFlorist,
  ShoppingBag,
  Grass,
  Build,
  ArrowForward,
} from '@mui/icons-material';
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
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)',
          py: { xs: 6, md: 10 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 3, md: 6 }} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ animation: 'fadeInLeft 0.8s ease-out' }}>
                <Typography 
                  variant="h1" 
                  gutterBottom 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 800,
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                    lineHeight: 1.2,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  Fresh Veggies
                </Typography>
                <Typography 
                  variant="h4" 
                  gutterBottom 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 500,
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    mb: 2,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                  }}
                >
                  Treat Yourself Organic 🌱
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ 
                    color: 'rgba(255,255,255,0.95)', 
                    mb: 4,
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    lineHeight: 1.7,
                    maxWidth: 520
                  }}
                >
                  Premium quality organic seeds, fertilizers, and gardening supplies for your home garden. Start your organic journey today with expert guidance!
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Button
                    variant="contained"
                    size="large"
                    component={Link}
                    to="/shop"
                    endIcon={<ArrowForward />}
                    sx={{ 
                      bgcolor: 'white', 
                      color: '#43a047', 
                      px: 4,
                      py: 1.5,
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                      '&:hover': { 
                        bgcolor: '#f5f5f5',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Shop Now
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    component={Link}
                    to="/combos"
                    endIcon={<LocalOffer />}
                    sx={{ 
                      borderColor: 'white',
                      borderWidth: 2,
                      color: 'white', 
                      px: 4,
                      py: 1.5,
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      '&:hover': { 
                        borderColor: 'white',
                        borderWidth: 2,
                        bgcolor: 'rgba(255,255,255,0.15)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    View Offers
                  </Button>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600"
                alt="Organic Gardening"
                sx={{ 
                  width: '100%',
                  maxWidth: 500,
                  borderRadius: 4,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  transform: 'perspective(1000px) rotateY(-5deg)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'perspective(1000px) rotateY(0deg) scale(1.02)'
                  }
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Categories Section */}
      <Container maxWidth="lg" sx={{ my: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              color: '#2e7d32',
              mb: 2
            }}
          >
            Shop by Category
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontSize: '1.125rem' }}>
            Everything you need for a thriving organic garden
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {[
            { 
              icon: <Spa sx={{ fontSize: 48 }} />, 
              title: 'Vegetable Seeds', 
              desc: 'Organic vegetable seeds for healthy harvest',
              color: '#66bb6a',
              bgColor: '#e8f5e9',
              link: '/shop?category=vegetable'
            },
            { 
              icon: <LocalFlorist sx={{ fontSize: 48 }} />, 
              title: 'Flower Seeds', 
              desc: 'Beautiful blooms for your garden',
              color: '#ec407a',
              bgColor: '#fce4ec',
              link: '/shop?category=flower'
            },
            { 
              icon: <ShoppingBag sx={{ fontSize: 48 }} />, 
              title: 'Grow Bags', 
              desc: 'Durable bags for container gardening',
              color: '#8d6e63',
              bgColor: '#efebe9',
              link: '/shop?category=growbags'
            },
            { 
              icon: <Grass sx={{ fontSize: 48 }} />, 
              title: 'Soil & Fertilizer', 
              desc: 'Nutrient-rich soil and organic fertilizers',
              color: '#795548',
              bgColor: '#d7ccc8',
              link: '/shop?category=fertilizer'
            },
            { 
              icon: <Build sx={{ fontSize: 48 }} />, 
              title: 'Gardening Tools', 
              desc: 'Essential tools for easy gardening',
              color: '#607d8b',
              bgColor: '#cfd8dc',
              link: '/shop?category=tools'
            },
            { 
              icon: <LocalOffer sx={{ fontSize: 48 }} />, 
              title: 'Combo Packs', 
              desc: 'Special bundles at great prices',
              color: '#ff9800',
              bgColor: '#fff3e0',
              link: '/combos'
            },
          ].map((category, index) => (
            <Grid item xs={6} sm={4} md={2} key={index}>
              <Paper
                component={Link}
                to={category.link}
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  textDecoration: 'none',
                  bgcolor: category.bgColor,
                  borderRadius: 3,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    bgcolor: category.color,
                    '& .category-icon': {
                      color: 'white',
                      transform: 'scale(1.1)'
                    },
                    '& .category-title': {
                      color: 'white'
                    },
                    '& .category-desc': {
                      color: 'rgba(255,255,255,0.9)'
                    }
                  }
                }}
              >
                <Box 
                  className="category-icon"
                  sx={{ 
                    color: category.color,
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {category.icon}
                </Box>
                <Typography 
                  className="category-title"
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontSize: { xs: '0.875rem', md: '1rem' },
                    fontWeight: 700,
                    color: category.color,
                    mb: 1,
                    transition: 'color 0.3s ease'
                  }}
                >
                  {category.title}
                </Typography>
                <Typography 
                  className="category-desc"
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    fontSize: { xs: '0.75rem', md: '0.813rem' },
                    lineHeight: 1.4,
                    transition: 'color 0.3s ease'
                  }}
                >
                  {category.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: '#f5f5f5', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
            <Typography 
              variant="h3" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                color: '#2e7d32'
              }}
            >
              Why Choose Us?
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {[
              { 
                icon: <Nature sx={{ fontSize: 56 }} />, 
                title: '100% Organic', 
                desc: 'Certified organic seeds with no chemicals or pesticides',
                color: '#66bb6a'
              },
              { 
                icon: <VerifiedUser sx={{ fontSize: 56 }} />, 
                title: 'Quality Guaranteed', 
                desc: 'High germination rate with quality assurance',
                color: '#42a5f5'
              },
              { 
                icon: <LocalShipping sx={{ fontSize: 56 }} />, 
                title: 'Fast Delivery', 
                desc: 'Quick and safe delivery across India',
                color: '#ff7043'
              },
              { 
                icon: <LocalOffer sx={{ fontSize: 56 }} />, 
                title: 'Best Prices', 
                desc: 'Competitive prices with amazing combo offers',
                color: '#ffa726'
              },
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    height: '100%',
                    bgcolor: 'white',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent',
                    '&:hover': {
                      borderColor: feature.color,
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  <Box sx={{ 
                    color: feature.color,
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      mb: 1,
                      color: '#333'
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      fontSize: '0.938rem',
                      lineHeight: 1.6
                    }}
                  >
                    {feature.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
                >
                  {feature.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  {feature.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Featured Products */}
      <Container maxWidth="lg" sx={{ my: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              color: '#2e7d32',
              mb: 2
            }}
          >
            🌿 Featured Products
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontSize: '1.125rem' }}>
            Handpicked organic seeds and supplies for your garden
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {featuredProducts.map((product) => (
            <Grid item xs={6} sm={4} md={3} key={product._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid #e0e0e0',
                  '&:hover': {
                    transform: 'translateY(-12px)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
                    borderColor: '#66bb6a'
                  }
                }}
              >
                <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.image || product.images?.[0] || 'https://via.placeholder.com/200'}
                    alt={product.name}
                    sx={{ 
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                  />
                  {product.featured && (
                    <Chip
                      label="Featured"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        bgcolor: '#66bb6a',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  )}
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Typography 
                    gutterBottom 
                    variant="h6" 
                    component="div"
                    sx={{ 
                      fontSize: '1rem',
                      fontWeight: 600,
                      minHeight: 48,
                      mb: 1.5,
                      color: '#333',
                      lineHeight: 1.4
                    }}
                  >
                    {product.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700,
                        color: '#2e7d32',
                        fontSize: '1.5rem'
                      }}
                    >
                      ₹{product.price}
                    </Typography>
                    <Chip
                      label="In Stock"
                      size="small"
                      sx={{
                        bgcolor: '#e8f5e9',
                        color: '#2e7d32',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    component={Link}
                    to={`/product/${product._id}`}
                    sx={{
                      bgcolor: '#66bb6a',
                      color: 'white',
                      py: 1,
                      fontSize: '0.938rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': { 
                        bgcolor: '#43a047',
                        boxShadow: '0 4px 12px rgba(102,187,106,0.4)'
                      }
                    }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ textAlign: 'center', mt: { xs: 4, md: 6 } }}>
          <Button 
            variant="contained" 
            size="large" 
            component={Link} 
            to="/shop"
            endIcon={<ArrowForward />}
            sx={{ 
              minWidth: 240,
              py: 1.5,
              px: 4,
              fontSize: '1.063rem',
              fontWeight: 600,
              borderRadius: 2,
              bgcolor: '#66bb6a',
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(102,187,106,0.4)',
              '&:hover': { 
                bgcolor: '#43a047',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(102,187,106,0.5)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            View All Products
          </Button>
        </Box>
      </Container>

      {/* Combo Packs */}
      {combos.length > 0 && (
        <Box sx={{ bgcolor: 'linear-gradient(135deg, #f5f5f5 0%, #e8f5e9 100%)', py: { xs: 6, md: 10 } }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
              <Typography 
                variant="h3" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                  color: '#2e7d32',
                  mb: 2
                }}
              >
                🌱 Special Combo Offers
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontSize: '1.125rem' }}>
                Save more with our specially curated combo packages
              </Typography>
            </Box>
            <Grid container spacing={4}>
              {combos.map((combo) => (
                <Grid item xs={12} sm={6} md={4} key={combo._id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '2px solid #e0e0e0',
                      '&:hover': {
                        transform: 'translateY(-12px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                        borderColor: '#ff9800'
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                      <CardMedia
                        component="img"
                        height="240"
                        image={combo.images?.[0] || 'https://via.placeholder.com/400x200?text=Combo+Pack'}
                        alt={combo.name}
                        sx={{
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.1)'
                          }
                        }}
                      />
                      <Chip
                        label="COMBO OFFER"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          bgcolor: '#ff5722',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          px: 1,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                      />
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Typography 
                        variant="h5" 
                        gutterBottom 
                        sx={{ 
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          mb: 1.5,
                          color: '#333',
                          lineHeight: 1.3
                        }}
                      >
                        {combo.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        paragraph 
                        sx={{ 
                          fontSize: '0.938rem',
                          minHeight: 44,
                          mb: 2,
                          lineHeight: 1.6
                        }}
                      >
                        {combo.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontSize: '2rem',
                            fontWeight: 800,
                            color: '#2e7d32'
                          }}
                        >
                          ₹{combo.price}
                        </Typography>
                        {combo.originalPrice && (
                          <Box>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                textDecoration: 'line-through',
                                color: 'text.secondary',
                                fontSize: '1.125rem'
                              }}
                            >
                              ₹{combo.originalPrice}
                            </Typography>
                            <Chip
                              label={`${Math.round(((combo.originalPrice - combo.price) / combo.originalPrice) * 100)}% OFF`}
                              size="small"
                              sx={{
                                bgcolor: '#ff5722',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.688rem'
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        component={Link}
                        to="/combos"
                        sx={{
                          bgcolor: '#ff9800',
                          color: 'white',
                          py: 1.25,
                          fontSize: '1rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          textTransform: 'none',
                          boxShadow: '0 4px 14px rgba(255,152,0,0.4)',
                          '&:hover': { 
                            bgcolor: '#f57c00',
                            boxShadow: '0 6px 20px rgba(255,152,0,0.5)'
                          }
                        }}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ textAlign: 'center', mt: { xs: 4, md: 6 } }}>
              <Button 
                variant="contained" 
                size="large" 
                component={Link} 
                to="/combos"
                endIcon={<ArrowForward />}
                sx={{ 
                  minWidth: 240,
                  py: 1.5,
                  px: 4,
                  fontSize: '1.063rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  bgcolor: '#ff9800',
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(255,152,0,0.4)',
                  '&:hover': { 
                    bgcolor: '#f57c00',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(255,152,0,0.5)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                View All Combos
              </Button>
            </Box>
          </Container>
        </Box>
      )}
    </>
  );
};

export default Home;
