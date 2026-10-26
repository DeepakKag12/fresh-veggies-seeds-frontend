import React from 'react';
import AdminTopHeader from './AdminTopHeader';

/**
 * AdminHeader (Backwards compatibility wrapper)
 * Delegates to the elevated Stripe-grade AdminTopHeader.
 */
const AdminHeader = (props) => {
  return <AdminTopHeader {...props} />;
};

export default AdminHeader;
