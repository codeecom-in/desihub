import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, TrendingUp, Users, DollarSign, Plus, Edit, Trash2, Shield, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createAdmin } from '../services/auth';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '', price: '', description: '', category: '', stock: '', images: []
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminStatus, setAdminStatus] = useState({ message: '', type: '' });
  const { user } = useAuth();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_URL + '/api/products');
      setInventory(res.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  // Mock stats
  const stats = [
    { label: 'Total Revenue', value: '₹45,231', icon: DollarSign, color: 'var(--success-color)' },
    { label: 'Total Orders', value: '152', icon: TrendingUp, color: 'var(--accent-color)' },
    { label: 'Active Products', value: inventory.length.toString(), icon: Package, color: 'var(--primary-gold)' },
    { label: 'Customers', value: '89', icon: Users, color: 'var(--accent-rust)' }
  ];

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
        newImages.push(import.meta.env.VITE_API_URL + response.data);
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
      await axios.post(import.meta.env.VITE_API_URL + '/api/products', {
        ...productForm,
        images: uploadedImages
      });
      alert('Product added to inventory successfully!');
      setProductForm({ name: '', price: '', description: '', category: '', stock: '', images: [] });
      setUploadedImages([]);
      setShowAddProduct(false);
      fetchInventory();
    } catch (err) {
      alert('Error adding product: ' + err.message);
    }
  };

  const getStockColor = (status) => {
    if (status === 'In Stock') return 'var(--success-color)';
    if (status === 'Low Stock') return 'var(--warning)';
    return 'var(--danger-color)';
  };

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
          Order Fulfillment
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
                          onClick={() => {
                            const productUrl = `${window.location.origin}/product/${item._id}`;
                            navigator.clipboard.writeText(productUrl);
                            alert('Product link copied to clipboard!');
                          }}
                          title="Share Product Link"
                        >
                          <Share2 size={18} />
                        </button>
                        <button style={{ background: 'none', color: 'var(--accent-color)', marginRight: '1rem' }}><Edit size={18} /></button>
                        <button style={{ background: 'none', color: 'var(--danger-color)' }}><Trash2 size={18} /></button>
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
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Order Fulfillment</h2>
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
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>#ORD-1234</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Today, 10:45 AM</td>
                    <td style={{ padding: '1rem' }}>John Doe</td>
                    <td style={{ padding: '1rem' }}>₹1299</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
                        Paid - Unfulfilled
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Fulfill</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
