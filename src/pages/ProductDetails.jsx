import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, ChevronLeft, ChevronRight } from 'lucide-react';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    axios.get(import.meta.env.VITE_API_URL + `/api/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(err => {
        console.error('Error fetching product:', err);
        setProduct(null); // Keep null to show loading or handle error differently
      });
  }, [id]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = product?.images?.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=800'];

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      navigate('/cart');
    }
  };

  if (!product) {
    return <div className="text-center mt-8 page-enter"><p>Loading details...</p></div>;
  }

  return (
    <div className="page-enter">
      <button 
        onClick={() => navigate(-1)} 
        style={{ background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '1rem' }}
      >
        <ArrowLeft size={20} /> Back to Shop
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'start' }}>
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '24px' }}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', aspectRatio: '4/5' }}>
            <img 
              src={images[currentImageIndex]} 
              alt={product.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  style={{ position: 'absolute', top: '50%', left: '0.5rem', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={nextImage}
                  style={{ position: 'absolute', top: '50%', right: '0.5rem', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
          
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {images.map((img, index) => (
                <img 
                  key={index}
                  src={img}
                  alt={`${product.name} - thumbnail ${index + 1}`}
                  onClick={() => setCurrentImageIndex(index)}
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    objectFit: 'cover', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    border: currentImageIndex === index ? '2px solid var(--accent-color)' : '2px solid transparent',
                    opacity: currentImageIndex === index ? 1 : 0.6,
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <span style={{ color: 'var(--accent-color)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.9rem' }}>
            {product.category}
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0 1.5rem 0', lineHeight: 1.2 }}>
            {product.name}
          </h1>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2rem' }}>
            ₹{product.price}
          </div>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '2rem' }}>
            {product.description}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={24} style={{ color: 'var(--success-color)' }} />
              <span>Verified Authentic Vintage</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
              <Truck size={24} style={{ color: 'var(--accent-color)' }} />
              <span>Ships within 24 hours</span>
            </div>
          </div>

          <button 
            onClick={handleAddToCart}
            className="btn-primary" 
            style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}
            disabled={product.stock === 0}
          >
            <ShoppingCart size={22} />
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
