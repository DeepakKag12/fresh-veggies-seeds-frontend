/**
 * Geolocation & Reverse Geocoding Service
 *
 * Uses the browser Geolocation API and reverse-geocodes coordinates into
 * standard Indian shipping address fields (Street, City, State, Pincode).
 * Uses OpenStreetMap Nominatim with a seamless BigDataCloud fallback.
 */

export const getCurrentCoordinates = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser. Please enter your address manually.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let msg = 'Could not access your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission was denied. Please allow location access in your browser or type your address manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Location information is currently unavailable. Please enter your address manually.';
            break;
          case error.TIMEOUT:
            msg = 'Location request timed out. Please try again or enter your address manually.';
            break;
          default:
            msg = error.message || msg;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  });
};

/**
 * Reverse geocode latitude and longitude to Indian address fields.
 */
export const reverseGeocode = async (latitude, longitude) => {
  // 1. Try Nominatim (OpenStreetMap)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      // Build street address from street/road + locality/suburb
      const streetParts = [
        addr.house_number,
        addr.building,
        addr.road || addr.pedestrian || addr.footway || addr.path,
        addr.suburb || addr.neighbourhood || addr.residential || addr.subdivision,
      ].filter(Boolean);

      const street = streetParts.join(', ') || addr.amenity || data.display_name?.split(',')[0] || '';
      const city = addr.city || addr.town || addr.village || addr.city_district || addr.county || '';
      const state = addr.state || '';
      const pincode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : '';
      const country = addr.country || 'India';

      if (city || state || pincode) {
        return {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          country: country.trim() || 'India',
          formattedAddress: data.display_name || '',
        };
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode attempt failed, trying fallback...', err);
  }

  // 2. Fallback: BigDataCloud free client reverse geocoding
  try {
    const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(fallbackUrl);
    if (res.ok) {
      const data = await res.json();
      const street = [data.locality, data.principalSubdivisionCode].filter(Boolean).join(', ') || '';
      const city = data.city || data.locality || '';
      const state = data.principalSubdivision || '';
      const pincode = data.postcode ? data.postcode.replace(/\D/g, '').slice(0, 6) : '';
      const country = data.countryName || 'India';

      return {
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: country.trim() || 'India',
        formattedAddress: [city, state, country].filter(Boolean).join(', '),
      };
    }
  } catch (err) {
    console.error('BigDataCloud reverse geocode fallback failed:', err);
  }

  throw new Error('Could not resolve your location to an address. Please enter details manually.');
};

/**
 * High-level helper to fetch current address directly from device GPS.
 */
export const fetchCurrentAddress = async () => {
  const coords = await getCurrentCoordinates();
  const addressDetails = await reverseGeocode(coords.latitude, coords.longitude);
  return addressDetails;
};
