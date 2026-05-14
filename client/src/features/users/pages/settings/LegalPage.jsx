import React from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';

const LegalPage = () => {
  const location = useLocation();
  const isPrivacy = location.pathname === '/privacy';

  const content = isPrivacy ? {
    title: "Privacy Policy",
    icon: Shield,
    color: "bg-emerald-50 text-emerald-600",
    sections: [
      {
        h: "1. Information Collection",
        p: "We collect your campus email, student details, and profile information to ensure a secure environment for students."
      },
      {
        h: "2. Data Usage",
        p: "Your data is used strictly for facilitating trades and maintaining safety on the platform."
      },
      {
        h: "3. Cookie Policy",
        p: "We use essential cookies to keep you logged in and remember your preferences."
      }
    ]
  } : {
    title: "Terms of Service",
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
    sections: [
      {
        h: "1. Eligibility",
        p: "You must be an active student or staff member of the registered educational institution to use this platform."
      },
      {
        h: "2. Trading Rules",
        p: "All items must be legal, accurately described, and hand-delivered within campus grounds."
      },
      {
        h: "3. Prohibited Items",
        p: "Sale of alcohol, drugs, weapons, or any strictly banned campus materials is strictly forbidden."
      }
    ]
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50/50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/settings" className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-6 hover:gap-3 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Link>

          <div className="bg-white rounded-4xl border border-gray-100 shadow-xl p-8 md:p-12">
            <div className="flex items-center gap-6 mb-12">
              <div className={`p-4 rounded-3xl ${content.color}`}>
                <content.icon className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">{content.title}</h1>
                <p className="text-gray-500 font-medium">Last updated: August 2026</p>
              </div>
            </div>

            <div className="prose prose-indigo max-w-none">
              {content.sections.map((section, i) => (
                <div key={i} className="mb-10 last:mb-0">
                  <h2 className="text-xl font-black text-gray-900 mb-4">{section.h}</h2>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    {section.p}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100">
              <p className="text-sm text-gray-400 font-medium text-center italic">
                By using Campus Mitra, you agree to these {content.title.toLowerCase()}.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LegalPage;
