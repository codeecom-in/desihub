import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Package, TrendingUp, Users, DollarSign, Plus, Edit, Trash2, Shield, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createAdmin } from '../services/auth';

const AdminDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('inventory');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '', price: '', description: '', category: '', stock: '', images: []
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminStatus, setAdminStatus] = useState({ message: '', type: '' });
  const { user } = useAuth();

  useEffect(() => {
    fetchInventory();
    fetchCustomers();
    loadOrders();

    const handleStorageUpdate = (event) => {
      if (event.key === 'desihub_orders') {
        loadOrders();
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  useEffect(() => {
    if (location.hash) {
      const requestedTab = location.hash.replace('#', '');
      if (['inventory', 'orders', 'customers', 'admins'].includes(requestedTab)) {
        setActiveTab(requestedTab);
        setShowAddProduct(false);
      }
    }
  }, [location.hash]);

  const fetchInventory = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_URL + '/api/products');
      setInventory(res.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_URL + '/api/users');
      setCustomers(res.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const loadOrders = () => {
    try {
      const storedOrders = JSON.parse(localStorage.getItem('desihub_orders') || '[]');
      setOrders(Array.isArray(storedOrders) ? storedOrders : []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    }
  };

  const handleProductChange = (e) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const newImages = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post(
          import.meta.env.VITE_API_URL + '/api/upload',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        const uploadedUrl = response.data;
        const finalUrl = uploadedUrl.startsWith('http') ? uploadedUrl : import.meta.env.VITE_API_URL + uploadedUrl;
        newImages.push(finalUrl);
      } catch (err) {
        console.error('Image upload error:', err);
        alert('Failed to upload image: ' + file.name);
      }
    }

    setUploadedImages([...uploadedImages, ...newImages]);
    setProductForm({ ...productForm, images: [...uploadedImages, ...newImages] });
    setUploading(false);
  };

  const removeImage = (index) => {
    const updated = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updated);
    setProductForm({ ...productForm, images: updated });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    if (uploadedImages.length === 0) {
      alert('Please upload at least one image');
      return;
    }

    try {
      if (editingProduct) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/products/${editingProduct._id}`, {
          ...productForm,
          images: uploadedImages
        });
        alert('Product updated successfully!');
      } else {
        await axios.post(import.meta.env.VITE_API_URL + '/api/products', {
          ...productForm,
          images: uploadedImages
        });
        alert('Product added to inventory successfully!');
      }

      setProductForm({ name: '', price: '', description: '', category: '', stock: '', images: [] });
      setUploadedImages([]);
      setEditingProduct(null);
      setShowAddProduct(false);
      fetchInventory();
    } catch (err) {
      alert('Error saving product: ' + err.message);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      stock: product.stock,
      images: product.images || []
    });
    setUploadedImages(product.images || []);
    setShowAddProduct(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
      fetchInventory();
      alert('Product deleted successfully');
    } catch (error) {
      alert('Failed to delete product. Please try again.');
      console.error('Delete error:', error);
    }
  };

  const handleShareProduct = async (item) => {
    const productUrl = `${window.location.origin}/product/${item._id}`;
    try {
      await navigator.clipboard.writeText(productUrl);
      alert('Product link copied to clipboard!');
    } catch (error) {
      console.error('Clipboard write failed:', error);
      alert('Unable to copy link. Please copy manually: ' + productUrl);
    }
  };

  const getStockColor = (status) => {
    if (status === 'In Stock') return 'var(--success-color)';
    if (status === 'Low Stock') return 'var(--warning)';
    return 'var(--danger-color)';
  };

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const stats = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(0)}`, icon: DollarSign, color: 'var(--success-color)' },
    { label: 'Total Orders', value: totalOrders.toString(), icon: TrendingUp, color: 'var(--accent-color)' },
    { label: 'Active Products', value: inventory.length.toString(), icon: Package, color: 'var(--primary-gold)' },
    { label: 'Customers', value: customers.length.toString(), icon: Users, color: 'var(--accent-rust)' }
  ];

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>Admin Dashboard</h1>
        {activeTab === 'inventory' && !showAddProduct && (
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowAddProduct(true)}>
            <Plus size={20} /> Add New Product
          </button>
        )}
      </div>
      
      {/* Top Stats Row */}
      <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel admin-stats-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="admin-stats-icon" style={{ padding: '1rem', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', color: stat.color }}>
              <stat.icon size={28} />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <button 
          className={`admin-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          style={{ padding: '0.75rem 1.5rem', background: 'none', color: activeTab === 'inventory' ? 'var(--accent-color)' : 'var(--text-secondary)', borderBottom: activeTab === 'inventory' ? '2px solid var(--accent-color)' : '2px solid transparent', fontWeight: 600, fontSize: '1.1rem' }}
          onClick={() => { setActiveTab('inventory'); setShowAddProduct(false); }}
        >
          Inventory Management
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          style={{ padding: '0.75rem 1.5rem', background: 'none', color: activeTab === 'orders' ? 'var(--accent-color)' : 'var(--text-secondary)', borderBottom: activeTab === 'orders' ? '2px solid var(--accent-color)' : '2px solid transparent', fontWeight: 600, fontSize: '1.1rem' }}
          onClick={() => { setActiveTab('orders'); setShowAddProduct(false); }}
        >
          Order Management
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          style={{ padding: '0.75rem 1.5rem', background: 'none', color: activeTab === 'customers' ? 'var(--accent-color)' : 'var(--text-secondary)', borderBottom: activeTab === 'customers' ? '2px solid var(--accent-color)' : '2px solid transparent', fontWeight: 600, fontSize: '1.1rem' }}
          onClick={() => { setActiveTab('customers'); setShowAddProduct(false); }}
        >
          Customers
        </button>
        {user?.role === 'master_admin' && (
          <button 
            className={`admin-tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
            style={{ padding: '0.75rem 1.5rem', background: 'none', color: activeTab === 'admins' ? 'var(--danger-color)' : 'var(--text-secondary)', borderBottom: activeTab === 'admins' ? '2px solid var(--danger-color)' : '2px solid transparent', fontWeight: 600, fontSize: '1.1rem' }}
            onClick={() => { setActiveTab('admins'); setShowAddProduct(false); }}
          >
            Manage Admins
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>
        
        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && !showAddProduct && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Product Catalog</h2>
              <div style={{ position: 'relative' }}>
                <label htmlFor="inventory-search" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>Search inventory</label>
                <input id="inventory-search" name="inventorySearch" type="text" placeholder="Search inventory..." className="input-field" style={{ width: '300px', padding: '0.5rem 1rem' }} />
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '1rem' }}>Product Name</th>
                    <th style={{ padding: '1rem' }}>Category</th>
                    <th style={{ padding: '1rem' }}>Price</th>
                    <th style={{ padding: '1rem' }}>Stock</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => {
                    const status = item.stock > 10 ? 'In Stock' : item.stock > 0 ? 'Low Stock' : 'Out of Stock';
                    return (
                    <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{item.name}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.category}</td>
                      <td style={{ padding: '1rem' }}>₹{item.price}</td>
                      <td style={{ padding: '1rem' }}>{item.stock} units</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.85rem', background: 'rgba(0,0,0,0.05)', color: getStockColor(status), border: `1px solid ${getStockColor(status)}` }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button
                          style={{ background: 'none', color: 'var(--primary-gold)', marginRight: '1rem' }}
                          onClick={() => handleShareProduct(item)}
                          title="Share Product Link"
                        >
                          <Share2 size={18} />
                        </button>
                        <button
                          style={{ background: 'none', color: 'var(--accent-color)', marginRight: '1rem' }}
                          onClick={() => handleEditProduct(item)}
                          title="Edit Product"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          style={{ background: 'none', color: 'var(--danger-color)' }}
                          onClick={() => handleDeleteProduct(item._id)}
                          title="Delete Product"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADD PRODUCT FORM */}
        {activeTab === 'inventory' && showAddProduct && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Add New Product to Inventory</h2>
              <button onClick={() => setShowAddProduct(false)} style={{ background: 'none', color: 'var(--text-secondary)', textDecoration: 'underline' }}>Cancel</button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="product-name">Product Name</label>
                  <input id="product-name" type="text" name="name" className="input-field" value={productForm.name} onChange={handleProductChange} required />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="product-price">Price (₹)</label>
                  <input id="product-price" type="number" name="price" className="input-field" value={productForm.price} onChange={handleProductChange} required />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="product-description">Description</label>
                <textarea id="product-description" name="description" className="input-field" rows="4" value={productForm.description} onChange={handleProductChange} required></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="product-category">Category</label>
                  <select id="product-category" name="category" className="input-field" value={productForm.category} onChange={handleProductChange} required>
                    <option value="">Select Category</option>
                    <option value="Tops">Tops</option>
                    <option value="Bottoms">Bottoms</option>
                    <option value="Outerwear">Outerwear</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="product-stock">Initial Stock Quantity</label>
                  <input id="product-stock" type="number" name="stock" className="input-field" value={productForm.stock} onChange={handleProductChange} required />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Product Images</label>
                <div style={{ border: '2px dashed var(--border-color)', padding: '2rem', textAlign: 'center', borderRadius: '8px', background: 'rgba(0,0,0,0.02)', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    id="img-upload"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  <label htmlFor="img-upload" style={{ cursor: uploading ? 'not-allowed' : 'pointer', color: 'var(--accent-color)', fontWeight: 500 }}>
                    {uploading ? 'Uploading...' : 'Click to browse files'}
                  </label>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Supports JPG, PNG (Max 5MB each)</p>
                </div>
                
                {/* Preview uploaded images */}
                {uploadedImages.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Uploaded Images ({uploadedImages.length}):</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          <img src={img} alt={`preview-${idx}`} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                          <button 
                            type="button"
                            onClick={() => removeImage(idx)}
                            style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setShowAddProduct(false)} className="btn-primary" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Cancel</button>
                <button type="submit" className="btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Order Management</h2>
            {orders.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>No orders have been placed yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '1rem' }}>Order ID</th>
                      <th style={{ padding: '1rem' }}>Date</th>
                      <th style={{ padding: '1rem' }}>Customer</th>
                      <th style={{ padding: '1rem' }}>Amount</th>
                      <th style={{ padding: '1rem' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', fontWeight: 500 }}>{order.id}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{new Date(order.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '1rem' }}>{order.customer?.name || 'Guest'}</td>
                        <td style={{ padding: '1rem' }}>₹{order.total}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
                            {order.status || 'Paid'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => window.alert('Order fulfillment is managed externally.')}>Fulfill</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Customer Directory</h2>
            {customers.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>No customer accounts found yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '1rem' }}>Customer</th>
                      <th style={{ padding: '1rem' }}>Phone</th>
                      <th style={{ padding: '1rem' }}>Email</th>
                      <th style={{ padding: '1rem' }}>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', fontWeight: 500 }}>{customer.email || 'N/A'}</td>
                        <td style={{ padding: '1rem' }}>{customer.phone || '-'}</td>
                        <td style={{ padding: '1rem' }}>{customer.email || '-'}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{new Date(customer.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MANAGE ADMINS TAB */}
        {activeTab === 'admins' && user?.role === 'master_admin' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Shield size={48} style={{ color: 'var(--danger-color)', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Add New Admin</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Grant another user access to the admin dashboard.</p>
            </div>

            {adminStatus.message && (
              <div style={{ background: adminStatus.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: adminStatus.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
                {adminStatus.message}
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setAdminStatus({ message: 'Creating admin...', type: 'info' });
              try {
                const res = await createAdmin(user.email, newAdminEmail);
                if (res.success) {
                  setAdminStatus({ message: 'Admin created! They can now log in using the Admin Login tab.', type: 'success' });
                  setNewAdminEmail('');
                } else {
                  setAdminStatus({ message: res.message || 'Failed to create admin.', type: 'error' });
                }
              } catch (err) {
                setAdminStatus({ message: 'An error occurred.', type: 'error' });
              }
            }}>
              <div className="input-group">
                <label className="input-label" htmlFor="new-admin-email">New Admin Email</label>
                <input
                  id="new-admin-email"
                  type="email"
                  className="input-field"
                  placeholder="newadmin@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', background: 'var(--danger-color)' }}>
                Create Admin Account
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
