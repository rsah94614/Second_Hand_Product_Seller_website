import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    PackageCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Cart = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: () =>
            axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/cart`).then((res) => res.data),
        enabled: !!user,
    });

    const updateQuantity = useMutation({
        mutationFn: ({ productId, quantity }) =>
            axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/cart/${productId}`,
                { quantity }
            ),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },

        onError: () => {
            toast.error('Unable to update quantity. Please try again.');
        },
    });

    const removeItem = useMutation({
        mutationFn: (productId) =>
            axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/cart/${productId}`
            ),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Item removed from cart');
        },

        onError: () => {
            toast.error('Unable to remove item. Please try again.');
        },
    });


    const checkout = useMutation({
        mutationFn: () =>
            axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/cart/checkout`),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });

            toast.success('Order placed successfully');
            navigate('/orders');
        },

        onError: (error) => {
            toast.error(error.response?.data?.message || 'Checkout failed');
        },
    });


    const formatPrice = (price = 0) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md text-center bg-white p-8 rounded-xl shadow-md">
                    <ShoppingCart className="w-12 h-12 mx-auto text-primary-600 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Login to view your cart
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Your cart items are saved to your account. Please login to continue
                        shopping.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            {[...Array(3)].map((_, index) => (
                                <div
                                    key={index}
                                    className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse"
                                >
                                    <div className="flex space-x-4">
                                        <div className="w-32 h-32 bg-gray-200 rounded-lg" />
                                        <div className="flex-1 space-y-4">
                                            <div className="h-6 w-3/4 bg-gray-200 rounded" />
                                            <div className="h-4 w-1/2 bg-gray-200 rounded" />
                                            <div className="h-4 w-1/3 bg-gray-200 rounded" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4 animate-pulse h-fit">
                            <div className="h-6 w-1/2 bg-gray-200 rounded" />
                            <div className="h-4 w-full bg-gray-200 rounded" />
                            <div className="h-4 w-2/3 bg-gray-200 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const items = data?.items || [];
    const summary = data?.summary || { itemCount: 0, totalAmount: 0 };

    return (
        <div>
            <Header />
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 font-display flex items-center">
                            <ShoppingCart className="w-8 h-8 mr-3 text-primary-600" />
                            Your Cart
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {summary.itemCount} item{summary.itemCount === 1 ? '' : 's'} in your
                            cart
                        </p>
                    </div>

                    {items.length === 0 ? (
                        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center max-w-2xl mx-auto">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShoppingCart className="w-12 h-12 text-gray-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Your cart is empty
                            </h2>
                            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                Looks like you haven&apos;t added anything yet. Browse our products to find something you love!
                            </p>
                            <Link
                                to="/products"
                                className="inline-flex items-center justify-center bg-primary-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
                            >
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                {items.map((item, index) => (
                                    <div
                                        key={item._id || item.product?._id || index}
                                        className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 group hover:shadow-md transition-shadow"
                                    >
                                        <div className="relative w-full sm:w-32 h-32 shrink-0">
                                            <img
                                                src={
                                                    item.product?.images?.[0] ||
                                                    'https://via.placeholder.com/150'
                                                }
                                                alt={item.product?.title}
                                                className="w-full h-full object-cover rounded-xl"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                                                        {item.product?.title}
                                                    </h3>
                                                    <button
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                        onClick={() => removeItem.mutate(item.product?._id)}
                                                        title="Remove item"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-4 flex items-center">
                                                    {item.product?.location}
                                                </p>
                                            </div>

                                            <div className="flex items-end justify-between">
                                                {/* <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                                                    <button
                                                        className="p-2 text-gray-600 hover:text-primary-600 disabled:opacity-50 transition-colors"
                                                        onClick={() =>
                                                            updateQuantity.mutate({
                                                                productId: item.product?._id,
                                                                quantity: Math.max(1, item.quantity - 1),
                                                            })
                                                        }
                                                        disabled={item.quantity === 1}
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-10 text-center font-semibold text-gray-900 text-sm">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                                                        onClick={() =>
                                                            updateQuantity.mutate({
                                                                productId: item.product?._id,
                                                                quantity: item.quantity + 1,
                                                            })
                                                        }
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div> */}
                                                <div className="text-right">
                                                    {/* <p className="text-xs text-gray-500 mb-1">Total</p> */}
                                                    <p className="text-xl font-bold text-primary-600">
                                                        {formatPrice(item.subtotal)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-24">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 font-display">
                                    Order Summary
                                </h2>
                                <div className="space-y-4 border-b border-gray-100 pb-6">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal ({summary.itemCount} items)</span>
                                        <span className="font-medium text-gray-900">{formatPrice(summary.totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Delivery Charges</span>
                                        <span className="text-green-600 font-medium">Free</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-lg font-bold text-gray-900 my-6">
                                    <span>Total Amount</span>
                                    <span className="text-2xl text-primary-600">{formatPrice(summary.totalAmount)}</span>
                                </div>
                                <button
                                    className="w-full flex items-center justify-center bg-primary-600 text-white py-4 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 disabled:opacity-70 disabled:shadow-none"
                                    onClick={() => checkout.mutate()}
                                    disabled={checkout.isLoading}
                                >
                                    {checkout.isLoading ? (
                                        'Processing...'
                                    ) : (
                                        <>
                                            <PackageCheck className="w-5 h-5 mr-2" />
                                            Proceed to Checkout
                                        </>
                                    )}
                                </button>
                                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Secure Checkout
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Cart;

