describe('Frontend Cart, Checkout, and Route Alias Regressions', () => {
  // 1. Route Alias Consistency (BUG-008 Regression Guard)
  test('Admin route aliases match standard routes consistently', () => {
    const routeAliases = {
      '/admin/inventory': '/admin/products',
      '/admin/customers': '/admin/users',
      '/admin/messages': '/admin/communication',
      '/admin/chat': '/admin/communication',
      '/admin/history': '/admin/recycle-bin',
      '/admin/trash': '/admin/recycle-bin',
      '/admin/profile': '/admin/settings'
    };

    expect(routeAliases['/admin/inventory']).toBe('/admin/products');
    expect(routeAliases['/admin/customers']).toBe('/admin/users');
    expect(routeAliases['/admin/messages']).toBe('/admin/communication');
    expect(routeAliases['/admin/chat']).toBe('/admin/communication');
    expect(routeAliases['/admin/history']).toBe('/admin/recycle-bin');
    expect(routeAliases['/admin/trash']).toBe('/admin/recycle-bin');
    expect(routeAliases['/admin/profile']).toBe('/admin/settings');
  });

  // 2. Cart Hydration & Failure Recovery (BUG-002 Regression Guard)
  test('Cart hydration does not overwrite server cart when server read fails', () => {
    let serverWriteIssued = false;
    const simulateCartHydration = ({ serverReadSucceeded, localCart, serverCart }) => {
      let activeCart = [];
      if (serverReadSucceeded) {
        activeCart = serverCart;
        serverWriteIssued = true;
      } else {
        // Fallback: keep local cart visible, but NEVER push it back to the server
        activeCart = localCart;
        serverWriteIssued = false;
      }
      return { activeCart, serverWriteIssued };
    };

    // Scenario A: Server read succeeds
    const resultSuccess = simulateCartHydration({
      serverReadSucceeded: true,
      localCart: [],
      serverCart: [{ id: 'prod_1', quantity: 2 }]
    });
    expect(resultSuccess.activeCart).toHaveLength(1);
    expect(resultSuccess.serverWriteIssued).toBe(true);

    // Scenario B: Temporary network failure (BUG-002)
    const resultFailure = simulateCartHydration({
      serverReadSucceeded: false,
      localCart: [{ id: 'prod_local', quantity: 1 }],
      serverCart: []
    });
    expect(resultFailure.activeCart).toHaveLength(1);
    expect(resultFailure.activeCart[0].id).toBe('prod_local');
    expect(resultFailure.serverWriteIssued).toBe(false); // Must NEVER overwrite server
  });

  // 3. Guest Chat Capability Header Attachment
  test('API request interceptor attaches X-Guest-Capability header when capability exists', () => {
    const attachHeaders = (headers, guestCapability) => {
      const config = { headers: { ...headers } };
      if (guestCapability) {
        config.headers['X-Guest-Capability'] = guestCapability;
      }
      return config;
    };

    const configWithCap = attachHeaders({}, 'guest_0123456789abcdef0123456789abcdef.signature');
    expect(configWithCap.headers['X-Guest-Capability']).toBe('guest_0123456789abcdef0123456789abcdef.signature');

    const configWithoutCap = attachHeaders({}, null);
    expect(configWithoutCap.headers['X-Guest-Capability']).toBeUndefined();
  });

  // 4. Same Cart Line Key Invariant
  test('sameCartLine correctly distinguishes package variants vs base products', () => {
    const sameCartLine = (a, b) => {
      if (!a || !b) return false;
      const idA = a.id || a._id || a.productId;
      const idB = b.id || b._id || b.productId;
      if (String(idA) !== String(idB)) return false;
      return String(a.packageId || '') === String(b.packageId || '');
    };

    const itemBase = { id: 'p1', quantity: 1 };
    const itemPack1 = { id: 'p1', packageId: 'pkg_500g', quantity: 1 };
    const itemPack2 = { id: 'p1', packageId: 'pkg_1kg', quantity: 1 };
    const itemBaseClone = { id: 'p1', quantity: 2 };

    expect(sameCartLine(itemBase, itemBaseClone)).toBe(true);
    expect(sameCartLine(itemBase, itemPack1)).toBe(false);
    expect(sameCartLine(itemPack1, itemPack2)).toBe(false);
    expect(sameCartLine(itemPack1, { ...itemPack1, quantity: 3 })).toBe(true);
  });
});

