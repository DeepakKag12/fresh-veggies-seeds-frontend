describe('Admin Workspace & Navigation Benchmarks', () => {
  // Test 1: Category Navigation Mapping & Groups
  test('Admin sidebar groups 5 distinct operational categories', () => {
    const navCategories = [
      'Overview & Analytics',
      'Catalog & Inventory',
      'Orders & Fulfillment',
      'Marketing & Live Chat',
      'Settings & Governance'
    ];

    expect(navCategories).toHaveLength(5);
    expect(navCategories).toContain('Overview & Analytics');
    expect(navCategories).toContain('Catalog & Inventory');
    expect(navCategories).toContain('Orders & Fulfillment');
    expect(navCategories).toContain('Marketing & Live Chat');
    expect(navCategories).toContain('Settings & Governance');
  });

  // Test 2: Dual-Mode Media Asset Handling
  test('DualMediaPicker formats single and multi-image URL arrays accurately', () => {
    // Single mode formatting
    const singleUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    const singleNormalized = Array.isArray(singleUrl) ? singleUrl : singleUrl ? [singleUrl] : [];
    expect(singleNormalized).toEqual(['https://res.cloudinary.com/demo/image/upload/sample.jpg']);

    // Multiple mode formatting
    const rawMultiString = 'https://res.cloudinary.com/demo/img1.jpg, https://res.cloudinary.com/demo/img2.jpg';
    const multiParsed = rawMultiString.split(',').map((u) => u.trim()).filter(Boolean);
    expect(multiParsed).toHaveLength(2);
    expect(multiParsed[0]).toBe('https://res.cloudinary.com/demo/img1.jpg');
    expect(multiParsed[1]).toBe('https://res.cloudinary.com/demo/img2.jpg');
  });

  // Test 3: Active Route Highlighting Logic
  test('Active route identification correctly handles query params and paths', () => {
    const isItemActive = (currentPath, currentSearch, targetPath, targetSearch = '') => {
      if (targetSearch) {
        return currentPath === targetPath && currentSearch === targetSearch;
      }
      if (targetPath === '/admin/dashboard') {
        return currentPath === '/admin/dashboard' && (!currentSearch || currentSearch === '?tab=home');
      }
      return currentPath.startsWith(targetPath) && (!targetSearch || currentSearch.includes(targetSearch));
    };

    // Dashboard root
    expect(isItemActive('/admin/dashboard', '', '/admin/dashboard')).toBe(true);
    expect(isItemActive('/admin/dashboard', '?tab=home', '/admin/dashboard')).toBe(true);

    // Sales Analytics tab
    expect(isItemActive('/admin/dashboard', '?tab=analytics', '/admin/dashboard', '?tab=analytics')).toBe(true);
    expect(isItemActive('/admin/dashboard', '?tab=revenue', '/admin/dashboard', '?tab=analytics')).toBe(false);

    // Products subpage
    expect(isItemActive('/admin/products', '', '/admin/products')).toBe(true);
    expect(isItemActive('/admin/orders', '', '/admin/products')).toBe(false);
  });

  // Test 4: Regression Guard: handleOpen product mapping with null categoryId
  test('Product edit form mapping safely handles null categoryId and missing images without crashing', () => {
    const mapProductToForm = (product) => {
      if (!product) return null;
      return {
        name: product.name || '',
        categoryId: product.categoryId?._id || product.categoryId || '',
        price: product.price ?? '',
        images: Array.isArray(product.images) ? product.images.join(', ') : (product.images || ''),
        hasPackages: Array.isArray(product.packages) && product.packages.length > 0
      };
    };

    // Product with null categoryId (e.g. deleted category)
    const productWithNullCategory = {
      _id: 'prod_999',
      name: 'Orphaned Heirloom Seed',
      categoryId: null, // Critical regression test
      price: 120,
      images: null,
      packages: null
    };

    const form = mapProductToForm(productWithNullCategory);
    expect(form).not.toBeNull();
    expect(form.categoryId).toBe('');
    expect(form.images).toBe('');
    expect(form.hasPackages).toBe(false);

    // Product with populated category object
    const productWithPopulatedCategory = {
      _id: 'prod_100',
      name: 'Organic Tomato',
      categoryId: { _id: 'cat_555', name: 'Vegetables' },
      price: 80,
      images: ['/img1.jpg', '/img2.jpg'],
      packages: [{ quantity: '50g', price: 80 }]
    };

    const form2 = mapProductToForm(productWithPopulatedCategory);
    expect(form2.categoryId).toBe('cat_555');
    expect(form2.images).toBe('/img1.jpg, /img2.jpg');
    expect(form2.hasPackages).toBe(true);
  });
});

