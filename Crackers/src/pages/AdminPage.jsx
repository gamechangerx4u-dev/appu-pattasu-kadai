import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, Plus, Upload, X, ArrowUp, ArrowDown } from 'lucide-react';
import {
  addProduct,
  addCategory,
  updateProduct,
  deleteProduct,
  fetchAllProducts,
  fetchAllCategories,
  deleteCategory,
  reorderCategories,
  uploadProductImage,
  uploadAdminQR,
  getAdminQR,
  getBankDetails,
  updateBankDetails,
} from '../lib/adminOperations';
import { loginAdmin, logoutAdmin, getAdminToken, updateAdminPassword } from '../lib/adminAuth';
import { fetchOrders, updateOrderStatus } from '../lib/orders';
import {
  fetchAllBanners,
  createBanner,
  deleteBanner,
  toggleBannerActive,
  reorderBanners,
  uploadBannerImage,
} from '../lib/banners';
import { useToast } from '../context/ToastContext';

const AdminPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';
  const isMongoMode = Boolean(backendUrl);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [adminQRFile, setAdminQRFile] = useState(null);
  const [adminQRUrl, setAdminQRUrl] = useState(null);
  const [bankDetails, setBankDetails] = useState({
    account_holder: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    branch: '',
  });
  const [savingBankDetails, setSavingBankDetails] = useState(false);
  const [orders, setOrders] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bannerFile, setBannerFile] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    categories: [],
    image: '',
    our_price: '',
    market_price: '',
    stock: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        fetchAllProducts(),
        fetchAllCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      // load admin QR and orders
      try {
        const qr = await getAdminQR();
        setAdminQRUrl(qr);
      } catch {
        // ignore
      }
      try {
        const bank = await getBankDetails();
        setBankDetails({
          account_holder: bank.account_holder || '',
          bank_name: bank.bank_name || '',
          account_number: bank.account_number || '',
          ifsc_code: bank.ifsc_code || '',
          branch: bank.branch || '',
        });
      } catch {
        // ignore
      }
      try {
        const ordersData = await fetchOrders();
        setOrders(ordersData);
      } catch (error) {
        console.warn('Failed to load orders', error);
      }
      try {
        const bannersData = await fetchAllBanners();
        setBanners(bannersData);
      } catch (error) {
        console.warn('Failed to load banners', error);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Could not load admin data from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getAdminToken()) {
      setIsAuthenticated(true);
      const timer = setTimeout(() => {
        void loadData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-refresh orders periodically while admin is authenticated
  useEffect(() => {
    let intervalId = null;
    if (getAdminToken()) {
      intervalId = setInterval(() => {
        void handleRefreshOrders();
      }, 5000); // refresh every 5s
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleLogin = async () => {
    try {
      await loginAdmin(password);
      setIsAuthenticated(true);
      setPassword('');
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Incorrect admin password.');
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setIsAuthenticated(false);
    setPassword('');
    navigate('/');
  };

  const handleBannerUpload = async () => {
    if (!bannerFile) {
      toast.warning('Choose a banner image before uploading.');
      return;
    }
    try {
      setUploadingBanner(true);
      let uploadFile = bannerFile;
      try {
        const { compressImage } = await import('../utils/imageCompressor');
        uploadFile = await compressImage(bannerFile, { maxWidth: 1600, quality: 0.85 });
      } catch {
        // use original file
      }
      const uploaded = await uploadBannerImage(uploadFile);
      await createBanner({ image_url: uploaded.url, media_id: uploaded.id });
      setBannerFile(null);
      const bannersData = await fetchAllBanners();
      setBanners(bannersData);
      toast.success('Homepage banner added.', { title: 'Banner uploaded' });
    } catch (error) {
      toast.error(error.message || 'Could not upload the banner.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await deleteBanner(id);
      setBanners((prev) => prev.filter((banner) => banner.id !== id));
    } catch (error) {
      toast.error(error.message || 'Could not delete the banner.');
    }
  };

  const handleToggleBanner = async (banner) => {
    try {
      const updated = await toggleBannerActive(banner.id, !banner.active);
      setBanners((prev) => prev.map((item) => (item.id === banner.id ? updated : item)));
    } catch (error) {
      toast.error(error.message || 'Could not update the banner.');
    }
  };

  const moveBanner = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const reordered = [...banners];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    try {
      const updated = await reorderBanners(reordered.map((banner) => banner.id));
      setBanners(updated);
    } catch (error) {
      toast.error(error.message || 'Could not reorder banners.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.warning('Fill in your current password and the new password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.warning('The new passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await updateAdminPassword({ currentPassword, newPassword });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      toast.success('Your admin password has been updated.', { title: 'Password changed' });
    } catch (error) {
      console.error('Password update failed:', error);
      toast.error(error.message || 'Could not update the admin password.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingImage(true);
      // compress product image before upload
      let uploadFile = file;
      try {
        const { compressImage } = await import('../utils/imageCompressor');
        uploadFile = await compressImage(file, { maxWidth: 1200, quality: 0.8 });
      } catch {
        // fallback to original file
      }
      const tempId = `temp-${Date.now()}`;
      const url = await uploadProductImage(uploadFile, tempId);
      setFormData(prev => ({ ...prev, image: url }));
      toast.success('Product image uploaded.', { title: 'Image ready' });
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Could not upload the product image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAdminQRUpload = async (file) => {
    if (!file) return;
    try {
      setLoading(true);
      // compress QR before upload to reduce size
      let uploadFile = file;
      try {
        const { compressImage } = await import('../utils/imageCompressor');
        uploadFile = await compressImage(file, { maxWidth: 1200, quality: 0.9 });
      } catch {
        // ignore
      }
      const url = await uploadAdminQR(uploadFile);
      setAdminQRUrl(url);
      toast.success('GPay QR code is now active.', { title: 'QR uploaded' });
    } catch (error) {
      console.error('Admin QR upload failed', error);
      toast.error('Could not upload the GPay QR code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankDetails = async () => {
    const payload = {
      account_holder: bankDetails.account_holder.trim(),
      bank_name: bankDetails.bank_name.trim(),
      account_number: bankDetails.account_number.trim(),
      ifsc_code: bankDetails.ifsc_code.trim(),
      branch: bankDetails.branch.trim(),
    };

    if (!payload.account_holder || !payload.bank_name || !payload.account_number || !payload.ifsc_code) {
      toast.warning('Account holder, bank name, account number, and IFSC are required.');
      return;
    }

    try {
      setSavingBankDetails(true);
      const saved = await updateBankDetails(payload);
      setBankDetails({
        account_holder: saved.account_holder || '',
        bank_name: saved.bank_name || '',
        account_number: saved.account_number || '',
        ifsc_code: saved.ifsc_code || '',
        branch: saved.branch || '',
      });
      toast.success('Netbanking details saved for checkout.', { title: 'Bank details saved' });
    } catch (error) {
      toast.error(error.message || 'Could not save bank details.');
    } finally {
      setSavingBankDetails(false);
    }
  };

  const handleRefreshOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await fetchOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to refresh orders', error);
      toast.error('Could not refresh the orders list.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeOrderStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await handleRefreshOrders();
      toast.success('Order status updated.', { title: 'Status changed' });
    } catch (error) {
      console.error('Failed to update order status', error);
      toast.error('Could not update the order status.');
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.warning('Enter a category name first.');
      return;
    }

    try {
      setLoading(true);
      await addCategory(name);
      setNewCategoryName('');
      await loadData();
      toast.success('Category added to the store.', { title: 'Category created' });
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Could not add the category.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;

    try {
      setLoading(true);
      await deleteCategory(id);
      await loadData();
      toast.success('Category removed.', { title: 'Category deleted' });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Could not delete the category.');
    } finally {
      setLoading(false);
    }
  };

  const handleReorderCategory = async (index, direction) => {
    const newCategories = [...categories];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    setCategories(newCategories);

    try {
      setLoading(true);
      await reorderCategories(newCategories.map(c => c.id));
    } catch (error) {
      console.error('Failed to reorder categories:', error);
      toast.error('Could not save the new category order.');
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const hasCategory = formData.category || (Array.isArray(formData.categories) && formData.categories.length > 0);
    if (!formData.name || !hasCategory || !formData.our_price || !formData.market_price) {
      toast.warning('Fill in all required product fields.');
      return;
    }

    if (!formData.image) {
      toast.warning('Add a product image URL or upload an image.');
      return;
    }

    try {
      setLoading(true);
      const cats = Array.isArray(formData.categories) && formData.categories.length > 0 ? formData.categories : (formData.category ? [formData.category] : []);
      const newProduct = {
        name: formData.name,
        category: cats[0] || '',
        categories: cats,
        image: formData.image,
        our_price: parseFloat(formData.our_price),
        market_price: parseFloat(formData.market_price),
        stock: parseInt(formData.stock) || 0,
      };

      const wasEditing = Boolean(editingId);

      if (editingId) {
        await updateProduct(editingId, newProduct);
        setEditingId(null);
      } else {
        await addProduct(newProduct);
      }

      setFormData({ name: '', category: '', categories: [], image: '', our_price: '', market_price: '', stock: '' });
      setShowAddForm(false);
      setImageFile(null);
      await loadData();
      toast.success(wasEditing ? 'Product details updated.' : 'New product added to the catalog.', {
        title: wasEditing ? 'Product updated' : 'Product added',
      });
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Could not save the product.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      category: product.category,
      categories: Array.isArray(product.categories) ? product.categories : (product.category ? [product.category] : []),
      image: product.image,
      our_price: product.our_price,
      market_price: product.market_price,
      stock: product.stock,
    });
    setEditingId(product.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      setLoading(true);
      await deleteProduct(id);
      await loadData();
      toast.success('Product removed from the catalog.', { title: 'Product deleted' });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Could not delete the product.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: '', category: '', categories: [], image: '', our_price: '', market_price: '', stock: '' });
    setImageFile(null);
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '2rem', maxWidth: '400px', margin: '2rem auto' }}>
        <h1 style={{ textAlign: 'center', color: 'var(--primary-gold)' }}>Admin Login</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--glass-border)',
              fontSize: '1rem'
            }}
          />
          <button
            onClick={handleLogin}
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--primary-red)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-gold)' }}>Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--primary-red)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{
        marginBottom: '2rem',
        padding: '1rem 1.25rem',
        borderRadius: '1rem',
        background: isMongoMode ? 'rgba(46, 204, 113, 0.12)' : 'rgba(230, 57, 70, 0.12)',
        border: `1px solid ${isMongoMode ? 'rgba(46, 204, 113, 0.3)' : 'rgba(230, 57, 70, 0.3)'}`,
        color: 'var(--text-main)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>MongoDB Admin Mode</div>
            <div style={{ color: 'var(--text-muted)' }}>
              {isMongoMode ? `Connected through ${backendUrl}` : 'Backend API is not configured'}
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Products, categories, orders, and admin auth are served from MongoDB now.
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Change Admin Password</h3>
          <span style={{ color: 'var(--text-muted)' }}>Requires current password</span>
        </div>

        <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
          <input
            type="password"
            placeholder="Current password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--glass-border)',
              background: 'var(--dark-surface)',
              color: 'var(--text-main)'
            }}
          />
          <input
            type="password"
            placeholder="New password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--glass-border)',
              background: 'var(--dark-surface)',
              color: 'var(--text-main)'
            }}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={passwordForm.confirmNewPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--glass-border)',
              background: 'var(--dark-surface)',
              color: 'var(--text-main)'
            }}
          />

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1rem',
                background: loading ? 'var(--text-muted)' : 'var(--primary-red)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Hero Banners */}
      <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Homepage Banners</h3>
          <span style={{ color: 'var(--text-muted)' }}>{banners.length} total</span>
        </div>
        <p style={{ color: 'var(--text-muted)', marginTop: 0, marginBottom: '1rem' }}>
          Image-only banners rotate automatically on the homepage. Recommended size: wide landscape (about 1600×600).
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
          <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
          <button
            type="button"
            onClick={handleBannerUpload}
            disabled={!bannerFile || uploadingBanner}
            style={{
              padding: '0.75rem 1rem',
              background: uploadingBanner ? 'var(--text-muted)' : 'var(--primary-gold)',
              color: '#111',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: uploadingBanner ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            {uploadingBanner ? 'Uploading...' : 'Add Banner'}
          </button>
        </div>

        {banners.length === 0 ? (
          <div style={{ padding: '1rem', background: '#f7f7f7', borderRadius: '0.75rem', color: 'var(--text-muted)' }}>
            No banners yet. Upload one to replace the old 90% OFF hero section.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--glass-border)',
                  opacity: banner.active ? 1 : 0.55,
                }}
              >
                <img
                  src={banner.image_url}
                  alt=""
                  style={{ width: '160px', height: '72px', objectFit: 'cover', borderRadius: '0.5rem', background: '#111' }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>Banner #{index + 1}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {banner.active ? 'Visible on homepage' : 'Hidden'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => moveBanner(index, -1)} disabled={index === 0}><ArrowUp size={16} /></button>
                  <button type="button" onClick={() => moveBanner(index, 1)} disabled={index === banners.length - 1}><ArrowDown size={16} /></button>
                  <button type="button" onClick={() => handleToggleBanner(banner)}>
                    {banner.active ? 'Hide' : 'Show'}
                  </button>
                  <button type="button" onClick={() => handleDeleteBanner(banner.id)} style={{ color: 'var(--primary-red)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Categories</h3>
          <span style={{ color: 'var(--text-muted)' }}>{categories.length} total</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            style={{
              flex: '1 1 220px',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--glass-border)',
              background: 'var(--dark-surface)',
              color: 'var(--text-main)'
            }}
          />
          <button
            type="button"
            onClick={handleAddCategory}
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--primary-gold)',
              color: '#111',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Add Category
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {categories.map((category, index) => (
            <div key={category.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--dark-surface)', borderRadius: '999px', border: '1px solid var(--glass-border)' }}>
              <button
                type="button"
                disabled={index === 0}
                onClick={() => handleReorderCategory(index, -1)}
                style={{ background: 'transparent', border: 'none', color: index === 0 ? 'var(--text-muted)' : 'var(--primary-gold)', cursor: index === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                disabled={index === categories.length - 1}
                onClick={() => handleReorderCategory(index, 1)}
                style={{ background: 'transparent', border: 'none', color: index === categories.length - 1 ? 'var(--text-muted)' : 'var(--primary-gold)', cursor: index === categories.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
              >
                <ArrowDown size={14} />
              </button>
              <span style={{ margin: '0 0.25rem' }}>{category.name}</span>
              <button
                type="button"
                onClick={() => handleDeleteCategory(category.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary-red)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <button
              onClick={handleCancel}
              style={{ background: 'none', border: 'none', color: 'var(--primary-red)', cursor: 'pointer', fontSize: '1.5rem' }}
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleAddProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--dark-surface)',
                  color: 'var(--text-main)'
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Categories (Select one or more) *</label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--glass-border)',
                background: 'var(--dark-surface)',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                {categories.map(cat => {
                  const selectedCats = formData.categories || [];
                  const isChecked = selectedCats.includes(cat.name);
                  return (
                    <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: isChecked ? 'rgba(230, 175, 46, 0.15)' : 'rgba(255,255,255,0.05)', padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid ' + (isChecked ? 'var(--primary-gold)' : 'var(--glass-border)'), transition: 'all 0.2s', color: 'var(--text-main)' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          let nextCats = [...selectedCats];
                          if (e.target.checked) {
                            nextCats.push(cat.name);
                          } else {
                            nextCats = nextCats.filter(n => n !== cat.name);
                          }
                          setFormData({ ...formData, categories: nextCats, category: nextCats[0] || '' });
                        }}
                        style={{ accentColor: 'var(--primary-gold)' }}
                      />
                      <span>{cat.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Our Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.our_price}
                onChange={(e) => setFormData({ ...formData, our_price: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--dark-surface)',
                  color: 'var(--text-main)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Market Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.market_price}
                onChange={(e) => setFormData({ ...formData, market_price: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--dark-surface)',
                  color: 'var(--text-main)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Stock</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--dark-surface)',
                  color: 'var(--text-main)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Image URL</label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="Or upload below"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--dark-surface)',
                  color: 'var(--text-main)'
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Upload Image</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0])}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => imageFile && handleImageUpload(imageFile)}
                  disabled={!imageFile || uploadingImage}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: uploadingImage ? 'var(--text-muted)' : 'var(--primary-gold)',
                    color: '#111',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Upload size={16} /> {uploadingImage ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>

            {/* Image Preview */}
            {formData.image && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Image Preview</label>
                <img
                  src={formData.image}
                  alt="Preview"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--glass-border)'
                  }}
                  onError={() => toast.error('That image URL could not be loaded.')}
                />
              </div>
            )}

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: loading ? 'var(--text-muted)' : 'var(--primary-red)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: 'var(--dark-surface)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Product Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--primary-red)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 'bold'
          }}
        >
          <Plus size={18} /> Add New Product
        </button>
      )}

      {/* Admin QR Upload */}
      <div style={{ marginTop: '2rem', marginBottom: '2rem', background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '12px' }}>
        <h3>Active GPay QR</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {adminQRUrl ? (
            <img src={adminQRUrl} alt="Admin GPay QR" style={{ width: '180px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
          ) : (
            <div style={{ padding: '1rem', background: '#f7f7f7', borderRadius: '8px' }}>No active QR uploaded</div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="file" accept="image/*" onChange={(e) => setAdminQRFile(e.target.files?.[0])} />
            <button onClick={() => adminQRFile && handleAdminQRUpload(adminQRFile)} style={{ padding: '0.5rem 1rem', background: 'var(--primary-gold)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Upload QR</button>
          </div>
        </div>
      </div>

      {/* Netbanking Account Details */}
      <div style={{ marginBottom: '2rem', background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '12px' }}>
        <h3>Netbanking Account Details</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
          These details are shown to customers who choose Netbanking on the payment page.
        </p>
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: '520px' }}>
          <input
            type="text"
            placeholder="Account holder name"
            value={bankDetails.account_holder}
            onChange={(e) => setBankDetails((prev) => ({ ...prev, account_holder: e.target.value }))}
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
          />
          <input
            type="text"
            placeholder="Bank name"
            value={bankDetails.bank_name}
            onChange={(e) => setBankDetails((prev) => ({ ...prev, bank_name: e.target.value }))}
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
          />
          <input
            type="text"
            placeholder="Account number"
            value={bankDetails.account_number}
            onChange={(e) => setBankDetails((prev) => ({ ...prev, account_number: e.target.value }))}
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
          />
          <input
            type="text"
            placeholder="IFSC code"
            value={bankDetails.ifsc_code}
            onChange={(e) => setBankDetails((prev) => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
          />
          <input
            type="text"
            placeholder="Branch (optional)"
            value={bankDetails.branch}
            onChange={(e) => setBankDetails((prev) => ({ ...prev, branch: e.target.value }))}
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
          />
          <button
            type="button"
            onClick={handleSaveBankDetails}
            disabled={savingBankDetails}
            style={{
              padding: '0.75rem 1rem',
              background: savingBankDetails ? 'var(--text-muted)' : 'var(--primary-gold)',
              border: 'none',
              borderRadius: '8px',
              cursor: savingBankDetails ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              width: 'fit-content',
            }}
          >
            {savingBankDetails ? 'Saving...' : 'Save Bank Details'}
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div style={{ background: 'var(--glass-bg)', borderRadius: '1rem', overflow: 'hidden', marginTop: '1rem' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Orders ({orders.length})</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleRefreshOrders} style={{ padding: '0.5rem 1rem', background: 'var(--primary-gold)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Refresh</button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>No orders yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)' }}>Txn</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)' }}>Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)' }}>Phone</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)' }}>Total</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)' }}>Items</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.75rem' }}>{o.site_txn}</td>
                    <td style={{ padding: '0.75rem' }}>{o.customer_name}</td>
                    <td style={{ padding: '0.75rem' }}>{o.phone}</td>
                    <td style={{ padding: '0.75rem' }}>₹{Number(o.total).toFixed(2)}</td>
                    <td style={{ padding: '0.75rem' }}>{Array.isArray(o.items) ? o.items.length : (o.items && Object.keys(o.items).length) || 0}</td>
                    <td style={{ padding: '0.75rem' }}>{o.status}</td>
                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      {o.pdf_url && (
                        <a href={o.pdf_url} target="_blank" rel="noreferrer" style={{ padding: '0.4rem 0.6rem', background: 'var(--primary-gold)', borderRadius: '6px', color: '#111', textDecoration: 'none' }}>Download PDF</a>
                      )}
                      {o.receipt_url && (
                        <a href={o.receipt_url} target="_blank" rel="noreferrer" style={{ padding: '0.4rem 0.6rem', background: 'var(--dark-surface)', borderRadius: '6px', color: 'var(--text-main)', textDecoration: 'none' }}>Receipt</a>
                      )}
                      <select value={o.status} onChange={(e) => handleChangeOrderStatus(o.id, e.target.value)} style={{ padding: '0.4rem', borderRadius: '6px' }}>
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="fulfilled">fulfilled</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Products List */}
      <div style={{ background: 'var(--glass-bg)', borderRadius: '1rem', overflow: 'hidden' }}>
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h2>Current Products ({products.length})</h2>
        </div>

        {loading && <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}

        {products.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No products. Click "Add New Product" to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>Category</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>Our Price</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>Market Price</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>Stock</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem' }}>{product.name}</td>
                    <td style={{ padding: '1rem' }}>{Array.isArray(product.categories) && product.categories.length > 0 ? product.categories.join(', ') : product.category}</td>
                    <td style={{ padding: '1rem' }}>₹{product.our_price.toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>₹{product.market_price.toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>{product.stock}</td>
                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(product)}
                        style={{
                          padding: '0.5rem',
                          background: 'var(--primary-gold)',
                          color: '#111',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(230, 57, 70, 0.2)',
                          color: 'var(--primary-red)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
