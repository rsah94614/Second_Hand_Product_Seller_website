import React from 'react';
import { MessageCircle, Mail } from 'lucide-react';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';

const HelpCenterPage = () => {
  const faqs = [
    {
      q: "How do I sell an item?",
      a: "Click on the 'Sell Item' button in the header, upload photos, set a price, and describe your product. Once approved, it will be visible to everyone on campus."
    },
    {
      q: "How do I get verified?",
      a: "Go to your profile settings and upload a photo of your student ID. Our moderators will review it within 24 hours."
    },
    {
      q: "Is it safe to meet buyers?",
      a: "Always meet in public, well-lit areas on campus. We recommend the library plaza or student center during daylight hours."
    },
    {
      q: "How do I report a scam?",
      a: "If you encounter any suspicious activity, use the 'Report' button on the listing or user profile. Our team investigates all reports immediately."
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50/50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">How can we help?</h1>
            <p className="text-gray-500 font-medium text-lg">Read through the FAQ's below or contact our support team.</p>
            
            {/* <div className="mt-8 max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search for articles..." 
                className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
              />
            </div> */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white p-8 rounded-4xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed font-medium text-sm">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="bg-indigo-600 rounded-5xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-3xl font-black mb-2">Still have questions?</h2>
                <p className="text-indigo-100 font-medium">Our support team is here to help you 24/7.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <button className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-50 transition-colors shadow-lg">
                  <MessageCircle className="w-5 h-5" /> Live Chat
                </button>
                <button className="bg-indigo-500 text-white border border-indigo-400 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-400 transition-colors">
                  <Mail className="w-5 h-5" /> Contact Us
                </button>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HelpCenterPage;
