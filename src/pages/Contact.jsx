import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
} from '@mui/material';
import {
  Phone,
  Email,
  WhatsApp,
  LocationOn,
  Facebook,
  Instagram,
  Twitter,
} from '@mui/icons-material';

const Contact = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Contact Us
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Get in Touch
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Have questions about our products or need gardening advice? We're here to help!
            </Typography>

            <Box sx={{ mt: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Phone sx={{ color: 'primary.main', fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1">+91 98765 43210</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <WhatsApp sx={{ color: 'success.main', fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    WhatsApp
                  </Typography>
                  <Typography variant="body1">+91 98765 43210</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<WhatsApp />}
                    href="https://wa.me/919876543210"
                    target="_blank"
                    sx={{ mt: 1 }}
                  >
                    Chat with us
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Email sx={{ color: 'primary.main', fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">info@freshveggies.com</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <LocationOn sx={{ color: 'error.main', fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1">India</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Business Hours
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We're available to help you during these hours:
            </Typography>

            <Box sx={{ mt: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>Monday - Saturday</Typography>
                <Typography>9:00 AM - 7:00 PM</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>Sunday</Typography>
                <Typography>10:00 AM - 5:00 PM</Typography>
              </Box>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Follow Us
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Stay updated with gardening tips and offers
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Facebook />}
                href="https://facebook.com"
                target="_blank"
              >
                Facebook
              </Button>
              <Button
                variant="outlined"
                startIcon={<Instagram />}
                href="https://instagram.com"
                target="_blank"
              >
                Instagram
              </Button>
              <Button
                variant="outlined"
                startIcon={<Twitter />}
                href="https://twitter.com"
                target="_blank"
              >
                Twitter
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 4, mt: 4, bgcolor: 'primary.light', color: 'white' }}>
        <Typography variant="h5" gutterBottom>
          💬 Need Gardening Help?
        </Typography>
        <Typography variant="body1">
          Our team is happy to help with any gardening questions - from seed selection to growing tips. 
          Feel free to reach out via WhatsApp for quick support!
        </Typography>
      </Paper>
    </Container>
  );
};

export default Contact;
