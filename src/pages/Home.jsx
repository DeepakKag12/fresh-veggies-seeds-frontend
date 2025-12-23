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
          bgcolor: 'primary.light',
          py: { xs: 4, md: 8 },
          background: 'linear-gradient(135deg, #80e27e 0%, #4caf50 100%)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 2, md: 4 }} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h2" 
                gutterBottom 
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3.75rem' }
                }}
              >
                Fresh Veggies
              </Typography>
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  color: 'white', 
                  opacity: 0.9,
                  fontSize: { xs: '1.25rem', md: '1.5rem' }
                }}
              >
                Treat Your Self Organic 🌱
              </Typography>
              <Typography 
                variant="body1" 
                paragraph 
                sx={{ 
                  color: 'white', 
                  opacity: 0.9, 
                  mb: 3,
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
              >
                Premium quality organic seeds, combo packs, and gardening supplies for your home
                garden. Start your organic journey today!
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  variant="contained"
                  size="large"
                  component={Link}
                  to="/shop"
                  fullWidth={true}
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main', 
                    '&:hover': { bgcolor: 'grey.100' },
                    maxWidth: { sm: 200 }
                  }}
                >
                  Shop Now
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  component={Link}
                  to="/combos"
                  fullWidth={true}
                  sx={{ 
                    borderColor: 'white', 
                    color: 'white', 
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                    maxWidth: { sm: 200 }
                  }}
                >
                  View Combos
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600"
                alt="Gardening"
                sx={{ width: '100%', borderRadius: 2, boxShadow: 3 }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ my: { xs: 4, md: 8 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '1.5rem', md: '2.125rem' }
            }}
          >
            Why Choose Fresh Veggies?
          </Typography>
        </Box>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {[
            { icon: <Nature sx={{ fontSize: { xs: 40, md: 56 } }} />, title: '100% Organic', desc: 'All natural and organic seeds certified' },
            { icon: <VerifiedUser sx={{ fontSize: { xs: 40, md: 56 } }} />, title: 'Quality Assured', desc: 'High germination rate guaranteed' },
            { icon: <LocalShipping sx={{ fontSize: { xs: 40, md: 56 } }} />, title: 'Fast Delivery', desc: 'Quick delivery across India' },
            { icon: <LocalOffer sx={{ fontSize: { xs: 40, md: 56 } }} />, title: 'Best Prices', desc: 'Affordable combo packs available' },
          ].map((feature, index) => (
            <Grid item xs={6} sm={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, md: 3 },
                  textAlign: 'center',
                  height: '100%',
                  border: '2px solid',
                  borderColor: 'primary.light',
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 2,
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <Box sx={{ 
                  color: 'primary.main', 
                  mb: { xs: 1, md: 2 },
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  {feature.icon}
                </Box>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontSize: { xs: '0.875rem', md: '1.125rem' },
                    fontWeight: 600
                  }}
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
      <Container maxWidth="lg" sx={{ my: { xs: 4, md: 8 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '1.75rem', md: '3rem' },
              color: 'primary.main'
            }}
          >
            🌿 Featured Products
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Handpicked organic seeds and gardening supplies for your home garden
          </Typography>
        </Box>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {featuredProducts.map((product) => (
            <Grid item xs={6} sm={4} md={3} key={product._id}>
              <Card 
                component={Link}
                to={`/product/${product._id}`}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textDecoration: 'none',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={product.image || product.images?.[0] || 'https://via.placeholder.com/200'}
                  alt={product.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Typography 
                    gutterBottom 
                    variant="h6" 
                    component="div"
                    sx={{ 
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      fontWeight: 600,
                      minHeight: { xs: 40, md: 48 },
                      mb: 1
                    }}
                  >
                    {product.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography 
                      variant="h6" 
                      color="primary.main"
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: { xs: '1.125rem', md: '1.25rem' }
                      }}
                    >
                      ₹{product.price}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="success.main"
                      sx={{ 
                        bgcolor: 'success.lighter',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontWeight: 500
                      }}
                    >
                      In Stock
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    onClick={() => handleAddToCart(product)}
                    sx={{
                      mt: 1,
                      fontSize: { xs: '0.75rem', md: '0.875rem' }
                    }}
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ textAlign: 'center', mt: { xs: 3, md: 4 } }}>
          <Button 
            variant="outlined" 
            size="large" 
            component={Link} 
            to="/shop" 
            sx={{ 
              minWidth: { xs: '100%', sm: 300 },
              py: 1.5,
              fontSize: '1rem'
            }}
          >
            View All Products →
          </Button>
        </Box>
      </Container>

      {/* Combo Packs */}
      {combos.length > 0 && (
        <Box sx={{ bgcolor: 'grey.50', py: { xs: 4, md: 8 } }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant="h3" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.75rem', md: '3rem' },
                  color: 'primary.main'
                }}
              >
                🌱 Special Combo Packs
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                Save more with our specially curated combo packages
              </Typography>
            </Box>
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {combos.map((combo) => (
                <Grid item xs={12} sm={6} md={4} key={combo._id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="220"
                        image={combo.images?.[0] || 'https://via.placeholder.com/400x200?text=Combo+Pack'}
                        alt={combo.name}
                      />
                      <Chip
                        label="COMBO OFFER"
                        color="error"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Typography 
                        variant="h5" 
                        gutterBottom 
                        sx={{ 
                          fontSize: { xs: '1.125rem', md: '1.5rem' },
                          fontWeight: 600
                        }}
                      >
                        {combo.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        paragraph 
                        sx={{ 
                          fontSize: { xs: '0.875rem', md: '0.875rem' },
                          minHeight: 40
                        }}
                      >
                        {combo.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography 
                          variant="h4" 
                          color="primary" 
                          sx={{ 
                            fontSize: { xs: '1.5rem', md: '2rem' },
                            fontWeight: 'bold'
                          }}
                        >
                          ₹{combo.price}
                        </Typography>
                        {combo.originalPrice && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              textDecoration: 'line-through',
                              fontSize: '1rem'
                            }}
                          >
                            ₹{combo.originalPrice}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        component={Link}
                        to="/combos"
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button 
                variant="contained" 
                size="large" 
                component={Link} 
                to="/combos"
                sx={{ 
                  minWidth: { xs: '100%', sm: 300 },
                  py: 1.5,
                  fontSize: '1rem'
                }}
              >
                View All Combos →
              </Button>
            </Box>
          </Container>
        </Box>
      )}
    </>
  );
};

export default Home;
