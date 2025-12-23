import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
} from '@mui/material';
import { Nature, VerifiedUser, LocalShipping, Support } from '@mui/icons-material';

const About = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        About Fresh Veggies
      </Typography>

      <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'primary.light', color: 'white' }}>
        <Typography variant="h5" gutterBottom>
          🌱 Treat Your Self Organic
        </Typography>
        <Typography variant="body1">
          Welcome to Fresh Veggies - your trusted partner in organic home gardening! We specialize in 
          providing premium quality organic seeds, combo packs, and complete gardening solutions for 
          beginners and enthusiasts alike.
        </Typography>
      </Paper>

      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>
            Our Mission
          </Typography>
          <Typography variant="body1" paragraph>
            To make organic home gardening accessible and easy for everyone. We believe that growing your 
            own vegetables is not just a hobby, but a step towards a healthier lifestyle and a sustainable 
            future.
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>
            Why Choose Us?
          </Typography>
          <Typography variant="body1" paragraph>
            We carefully select and test all our seeds to ensure high germination rates. Our combo packs 
            are designed specifically for Indian homes - whether you have a terrace, balcony, or kitchen 
            garden.
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {[
          {
            icon: <Nature sx={{ fontSize: 48 }} />,
            title: '100% Organic',
            desc: 'All our seeds are organic and non-GMO, perfect for healthy home gardening',
          },
          {
            icon: <VerifiedUser sx={{ fontSize: 48 }} />,
            title: 'Quality Assured',
            desc: 'High germination rate guaranteed with proper growing instructions',
          },
          {
            icon: <LocalShipping sx={{ fontSize: 48 }} />,
            title: 'Fast Delivery',
            desc: 'Quick and safe delivery across India to your doorstep',
          },
          {
            icon: <Support sx={{ fontSize: 48 }} />,
            title: 'Expert Support',
            desc: 'WhatsApp support for all your gardening queries and doubts',
          },
        ].map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                height: '100%',
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Box sx={{ color: 'primary.main', mb: 2 }}>
                {item.icon}
              </Box>
              <Typography variant="h6" gutterBottom>
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.desc}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 4, mt: 4, bgcolor: 'grey.50' }}>
        <Typography variant="h5" gutterBottom>
          Perfect For
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>🌱 Beginners</Typography>
            <Typography variant="body2" color="text.secondary">
              Easy-to-grow seeds with detailed growing instructions
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>🏠 Terrace Gardeners</Typography>
            <Typography variant="body2" color="text.secondary">
              Specially curated combos for terrace and balcony gardens
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>👨‍🍳 Kitchen Gardens</Typography>
            <Typography variant="body2" color="text.secondary">
              Fresh herbs and vegetables for your cooking needs
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default About;
