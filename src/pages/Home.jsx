import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag } from 'lucide-react';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  useEffect(() => {
    axios.get(import.meta.env.VITE_API_URL + '/api/products')
      .then(res => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        setFetchError('Unable to load products. Is the backend server running?');
        setLoading(false);
      });
  }, []);

  return (
    <div className="page-enter">
      {/* Hero Section */}
      <div className="hero-section glass-panel text-center" style={{ padding: '4rem 2rem', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', fontWeight: 700, marginBottom: '1rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Curated Vintage & Thrift
          </h1>
          <p className="hero-subtitle" style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)', color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
            Discover unique, high-quality pre-loved fashion. Sustainable style for the modern wardrobe.
          </p>
          <button className="btn-primary hero-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: 'clamp(1rem, 3vw, 1.1rem)' }}>
            <ShoppingBag size={20} />
            Shop Collection
          </button>
        </div>
      </div>

      <div className="section-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '2rem', gap: '1.5rem' }}>
        <h2 className="section-title" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 600 }}>Latest Drops</h2>
        
        {!loading && !fetchError && categories.length > 1 && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '999px',
                  background: selectedCategory === category ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                  color: selectedCategory === category ? '#fff' : 'var(--text-primary)',
                  border: `1px solid ${selectedCategory === category ? 'var(--accent-color)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  textTransform: 'capitalize'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center mt-8">
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Loading fresh styles...</p>
        </div>
      ) : fetchError ? (
        <div className="text-center mt-8">
          <p style={{ color: 'var(--danger-color)', fontSize: '1.2rem' }}>{fetchError}</p>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <Link to={`/product/${product._id}`} key={product._id} className="glass-panel product-card">
              <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=500'} alt={product.name} className="product-image" />
              <div className="product-info">
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', fontWeight: 600 }}>
                  {product.category}
                </span>
                <h3 className="product-title">{product.name}</h3>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <span className="product-price">₹{product.price}</span>
                  <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    View
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
