import React from 'react';
import { HelpCircle, MessageCircle, Mail, ChevronRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      a: "Click the flag icon on any listing or user profile to submit a report. Our team reviews all reports immediately."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex p-4 bg-indigo-600 rounded-4xl text-white shadow-xl shadow-indigo-200 mb-6">
            <HelpCircle className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">How can we help?</h1>
          <p className="text-gray-500 font-medium text-lg max-w-2xl mx-auto">
            Everything you need to know about using Campus Mitra safely and effectively.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white p-8 rounded-4xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-lg font-black text-gray-900 mb-3">{faq.q}</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-black mb-2">Still have questions?</h2>
              <p className="text-indigo-100 font-medium">Our student support team is ready to help you.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <a href="mailto:support@campusmitra.edu" className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg">
                <Mail className="w-5 h-5" /> Email Us
              </a>
              <Link to="/chat" className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-500 text-white font-black rounded-2xl hover:bg-indigo-400 transition-colors shadow-lg">
                <MessageCircle className="w-5 h-5" /> Live Chat
              </Link>
            </div>
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
