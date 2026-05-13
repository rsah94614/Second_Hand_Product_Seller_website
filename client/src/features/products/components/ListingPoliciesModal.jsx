import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

const LISTING_POLICIES = [
  {
    icon: '🚀',
    title: 'How CampusMitra Helps You',
    items: [
      'Your listing reaches all verified students on your campus.',
      'Built-in chat so buyers contact you directly — no middlemen.',
      'Wishlist & price-drop alerts bring buyers back to your listing.',
      'Listings auto-expire after 60 days to keep the marketplace fresh (you can relist).',
      'Free platform — no commission or fees ever.',
    ],
  },
  {
    icon: '✅',
    title: 'Listing Guidelines',
    items: [
      'Use clear, honest photos — at least 1 required (2 for electronics).',
      'Set a fair price — you can negotiate in chat.',
      'Describe the actual condition accurately.',
      'Only list items you physically own and can hand over on campus.',
    ],
  },
  {
    icon: '🚫',
    title: 'Not Allowed',
    items: [
      'Counterfeit, stolen, or prohibited items.',
      'Digital goods, services, or subscriptions.',
      'Misleading titles or fake photos.',
      'Listing the same item multiple times simultaneously.',
    ],
  },
  {
    icon: '🤝',
    title: 'Safety & Meetup',
    items: [
      'Always meet in a public campus location (Library, Main Gate, Canteen, etc.).',
      'Never share personal financial details in chat.',
      'Use the in-app confirmation photo after completing a deal.',
      'Report suspicious buyers/sellers immediately.',
    ],
  },
  {
    icon: '💰',
    title: 'Pricing & Payments',
    items: [
      'All payments are handled directly between buyer and seller (cash on meetup).',
      'Never pay in advance before seeing the item.',
      'Disputes can be filed through the app if something goes wrong.',
    ],
  },
  {
    icon: '⚠️',
    title: 'Account Consequences',
    items: [
      'Misleading listings may be removed without notice.',
      'Repeated violations lead to account suspension.',
      'No-shows affect your trust score and reputation.',
      'Verified sellers get a badge — builds buyer confidence.',
    ],
  },
];

export const ListingPoliciesModal = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-6 py-4 border-b border-gray-100 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Listing Policies</h2>
            <p className="text-sm text-gray-500 mt-0.5">Read before you publish</p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-6">
          {LISTING_POLICIES.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{section.icon}</span>
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 rounded-b-3xl">
          <Button onClick={onClose} className="w-full">Got it</Button>
        </div>
      </div>
    </div>
  );
};
