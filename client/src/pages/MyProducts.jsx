import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../components/Header';

const MyProducts = () => {
  const { user } = useAuth();

const { data: products, isLoading, refetch } = useQuery({
  queryKey: ['user-products', user?.id],
  queryFn: () =>
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/products/user/${user?.id}`)
      .then(res => res.data),
  enabled: !!user?.id,
});

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(import.meta.env.VITE_BACKEND_URL + `/api/products/${productId}`);
      toast.success('Product deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      await axios.put(import.meta.env.VITE_BACKEND_URL + `/api/products/${productId}`, {
        isActive: !currentStatus
      });
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      refetch();
    } catch (error) {
      toast.error('Failed to update product status');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view your products</h1>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header/>
      <div className="container mx-auto px-4 max-w-7xl py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Products</h1>
          <Link
            to="/create-product"
            className="flex items-center space-x-2 btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No products yet</h2>
            <p className="text-gray-600 mb-6">Start selling by listing your first product!</p>
            <Link to="/create-product" className="btn bg-blue-500 py-2 px-4 rounded text-white">
              Create Your First Product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products?.map((product) => (
              <div key={product._id} className="card group">
                <div className="relative">
                  <img
                    src={product.images[0] || '/placeholder-image.jpg'}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                    }}
                  />
                  {!product.isActive && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-sm font-semibold">
                      INACTIVE
                    </div>
                  )}
                  {product.isSold && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                      SOLD
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2">
                    {product.title}
                  </h3>
                  
                  <p className="text-2xl font-bold text-green-600 mb-2">
                    ₹{product.price?.toLocaleString()}
                  </p>
                  
                  <div className="flex items-center text-gray-600 text-sm mb-4">
                    <span className="truncate">{product.location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-gray-500 text-sm mb-4">
                    <span>{product.views || 0} views</span>
                    <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      to={`/products/${product._id}`}
                      className="flex-1 flex items-center justify-center space-x-1 btn btn-outline text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Link>
                    <Link
                      to={`/edit-product/${product._id}`}
                      className="flex-1 flex items-center justify-center space-x-1 btn btn-outline text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="flex-1 flex items-center justify-center space-x-1 btn btn-danger text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => toggleProductStatus(product._id, product.isActive)}
                    className={`w-full mt-2 btn text-sm ${
                      product.isActive ? 'btn-secondary' : 'btn-primary'
                    }`}
                  >
                    {product.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProducts;
