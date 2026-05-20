import React from 'react';
import { LifeBuoy, Mail } from 'lucide-react';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';

const FAQItem = ({ question, answer }) => (
  <div className="mb-6">
    <h3 className="text-[16px] font-semibold text-slate-900 mb-2">{question}</h3>
    <p className="text-[15px] text-slate-600 leading-relaxed">{answer}</p>
  </div>
);

const HelpCenterPage = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-white py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <LifeBuoy className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <p className="text-[13px] font-semibold text-slate-500 uppercase tracking-widest mb-6">
            Frequently Asked Questions
          </p>

          <FAQItem
            question="How do I become a verified seller?"
            answer="Go to your Profile and complete the campus verification steps. You'll need to upload a valid student ID."
          />
          <FAQItem
            question="Is it safe to buy items here?"
            answer="Yes. We restrict the platform to verified campus students and staff. Always meet in public places on campus during daylight."
          />
          <FAQItem
            question="What if a buyer doesn't show up?"
            answer="You can mark the order as a 'No Show' in the Order Details page. The buyer's reputation score will be negatively impacted."
          />
          <FAQItem
            question="How do I change my college?"
            answer="Currently, you cannot change your college once registered. If you made a mistake, please contact support to reset your account."
          />

          <div className="bg-slate-50 rounded-3xl p-6 mt-4 flex flex-col items-center text-center">
            <Mail className="w-8 h-8 text-slate-500 mb-4" />
            <h2 className="text-[18px] font-bold text-slate-900 mb-2">Still need help?</h2>
            <p className="text-[15px] text-slate-600 mb-6">
              Our campus moderation team is here to help you.
            </p>
            <button
              onClick={() =>
                alert(
                  'Coming Soon\n\nIn-app support messaging is currently under development. Please email support@campusmitra.com for assistance in the meantime.'
                )
              }
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-6 rounded-2xl transition-colors"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HelpCenterPage;
