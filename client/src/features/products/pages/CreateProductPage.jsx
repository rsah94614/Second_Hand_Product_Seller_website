import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { useCreateProduct } from '../hooks/useCreateProduct';
import { ListingPoliciesModal } from '../components/ListingPoliciesModal';
import { ImageUploadGrid } from '../components/ImageUploadGrid';
import { ProductFormFields } from '../components/ProductFormFields';
import { ContactSection } from '../components/ContactSection';

const CreateProductPage = () => {
  const navigate = useNavigate();
  const {
    user,
    formData,
    setFormData,
    images,
    isLoading,
    policyOpen,
    categories,
    setPolicyOpen,
    handleChange,
    handleImageChange,
    removeImage,
    handleSubmit,
  } = useCreateProduct();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please log in to create a product</h1>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ListingPoliciesModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
      
      <div className="px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <Card className="rounded-3xl border-gray-100 shadow-sm animate-fade-in">
            <CardHeader className="pb-2 text-center">
              <div className="flex items-center justify-center gap-3">
                <CardTitle className="text-3xl text-gray-800">Create Listing</CardTitle>
                <button
                  type="button"
                  onClick={() => setPolicyOpen(true)}
                  className="h-8 w-8 rounded-full bg-primary-50 hover:bg-primary-100 flex items-center justify-center transition-colors"
                >
                  <Info className="w-4 h-4 text-primary-600" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Read our{' '}
                <button
                  type="button"
                  onClick={() => setPolicyOpen(true)}
                  className="text-primary-600 hover:underline font-medium"
                >
                  listing guidelines
                </button>
                {' '}before publishing.
              </p>
            </CardHeader>

            <CardContent className="p-8 pt-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <ProductFormFields 
                  formData={formData} 
                  categories={categories} 
                  onChange={handleChange}
                  onSelectChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
                />

                <ContactSection 
                  contactInfo={formData.contactInfo} 
                  onChange={handleChange} 
                />

                <ImageUploadGrid 
                  images={images} 
                  onImageChange={handleImageChange} 
                  onRemoveImage={removeImage} 
                />

                <div className="flex flex-col items-center">
                  <Button type="submit" disabled={isLoading} className="mb-4 w-full md:w-2/4 shadow-lg shadow-primary-600/20">
                    {isLoading ? 'Creating...' : 'Create Listing'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="w-full md:w-2/4"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreateProductPage;
