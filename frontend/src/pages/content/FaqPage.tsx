import { useState, useEffect } from 'react';
import { Search, HelpCircle, X } from 'lucide-react';
import { contentApi } from '../../services/api';

interface Faq {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
}

interface FaqCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  faqs: Faq[];
}

/** Shown when the API fails or returns no categories (PRD-aligned structure). */
const FALLBACK_FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'fallback-general',
    name: 'General',
    slug: 'general',
    description: 'Credits, data, and how SocialTweebs fits your workflow.',
    faqs: [
      {
        id: 'fg1',
        displayOrder: 1,
        question: 'What products do you offer?',
        answer:
          'SocialTweebs is an analytics platform for influencer marketing. Core areas include influencer discovery and search, influencer insights (demographics and performance), paid collaboration tracking, audience overlap, sentiment analysis, and campaign tools — with exports and reporting across supported platforms.',
      },
      {
        id: 'fg2',
        displayOrder: 2,
        question: 'Can I try the platform for free?',
        answer:
          'Many teams start with a trial or starter allocation of credits after signup and verification. Exact trial terms depend on your workspace — check your dashboard or contact support for current offers. No credit card is required for basic signup where applicable.',
      },
      {
        id: 'fg3',
        displayOrder: 3,
        question: 'How is this data obtained?',
        answer:
          'We respect user privacy and rely on public, aggregated signals available from social platforms. Metrics are derived using our models and partner data; we do not sell private messages or non-public personal data.',
      },
      {
        id: 'fg4',
        displayOrder: 4,
        question: 'Do you support multiple social platforms?',
        answer:
          'Yes. Coverage depends on the module (e.g. Instagram, TikTok, YouTube) — each feature page shows which platforms apply.',
      },
      {
        id: 'fg5',
        displayOrder: 5,
        question: 'Can I download reports as PDF?',
        answer:
          'Yes. Where a report type supports export, you can download or share from the report detail or list actions.',
      },
    ],
  },
  {
    id: 'fallback-discovery',
    name: 'Influencer Discovery',
    slug: 'influencer-discovery',
    description: 'Finding and exporting the right creators.',
    faqs: [
      {
        id: 'fd1',
        displayOrder: 1,
        question: 'What is Influencer Discovery?',
        answer:
          'Influencer Discovery lets you search and filter creators by audience, content, and performance signals, then shortlist and export lists for your campaigns.',
      },
      {
        id: 'fd2',
        displayOrder: 2,
        question: 'How do I export an influencer list?',
        answer:
          'Run a search, refine with filters, then use the export action from discovery or open Generated Reports after export completes.',
      },
      {
        id: 'fd3',
        displayOrder: 3,
        question: 'How do I find influencers by topic?',
        answer:
          'Use keywords and relevance-style filters so results match the themes and niches you care about; combine with audience filters to narrow further.',
      },
      {
        id: 'fd4',
        displayOrder: 4,
        question: 'What are lookalikes?',
        answer:
          'Lookalikes help you find creators similar to a seed profile — by content similarity or overlapping audience — so you can scale what already works.',
      },
    ],
  },
  {
    id: 'fallback-insights',
    name: 'Influencer Insights',
    slug: 'influencer-insights',
    description: 'Deep profiles and performance context.',
    faqs: [
      {
        id: 'fi1',
        displayOrder: 1,
        question: 'What is Influencer Insights?',
        answer:
          'Influencer Insights surfaces demographics, engagement, and content signals for a profile so you can validate fit before you commit budget.',
      },
      {
        id: 'fi2',
        displayOrder: 2,
        question: 'How do credits work for insights?',
        answer:
          'Viewing or refreshing deep insight data typically consumes credits per profile or action; your balance and pricing are shown in-app before you confirm.',
      },
      {
        id: 'fi3',
        displayOrder: 3,
        question: 'Can I revisit a profile without paying again?',
        answer:
          'Once an influencer is saved to your insights for your account, revisiting that saved record usually does not charge the same “first view” fee again — see in-app copy for your workspace rules.',
      },
    ],
  },
];

type SelectedFaq = {
  id: string;
  question: string;
  answer: string;
  categoryName?: string;
};

export const FaqPage = () => {
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedFaq, setSelectedFaq] = useState<SelectedFaq | null>(null);

  useEffect(() => {
    loadFaqs();
  }, []);

  useEffect(() => {
    if (!selectedFaq) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedFaq(null);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [selectedFaq]);

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const data = await contentApi.getAllFaqs();
      const list = data.categories?.length ? data.categories : FALLBACK_FAQ_CATEGORIES;
      setCategories(list);
      if (list.length > 0) {
        setActiveCategory(list[0].slug);
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
      setCategories(FALLBACK_FAQ_CATEGORIES);
      setActiveCategory(FALLBACK_FAQ_CATEGORIES[0].slug);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const data = await contentApi.searchFaqs(searchQuery);
      setSearchResults(data.results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const activeData = categories.find(c => c.slug === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      {selectedFaq && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="faq-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedFaq(null)}
            aria-label="Close dialog"
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 max-h-[min(85vh,640px)] flex flex-col">
            <div className="flex items-start justify-between gap-4 p-5 sm:p-6 pb-0 shrink-0">
              <div className="min-w-0 flex-1 pt-0.5">
                {selectedFaq.categoryName && (
                  <p className="text-xs font-medium text-purple-600 mb-2">{selectedFaq.categoryName}</p>
                )}
                <h2 id="faq-modal-title" className="text-lg sm:text-xl font-semibold text-gray-900 leading-snug">
                  {selectedFaq.question}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFaq(null)}
                className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 pt-4 overflow-y-auto text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-wrap">
              {selectedFaq.answer}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">FAQ</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">Find answers to commonly asked questions.</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Search Results ({searchResults.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {searchResults.map((result: any) => (
              <button
                key={result.id}
                type="button"
                onClick={() =>
                  setSelectedFaq({
                    id: result.id,
                    question: result.question,
                    answer: result.answer,
                    categoryName: result.category?.name,
                  })
                }
                className="text-left border border-gray-200 rounded-xl p-4 sm:p-5 hover:bg-gray-50 hover:border-purple-200 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <span className="text-xs text-purple-600 font-medium block mb-1.5">{result.category.name}</span>
                <h3 className="font-medium text-gray-900 text-sm sm:text-base leading-snug">{result.question}</h3>
              </button>
            ))}
          </div>
          <button
            onClick={() => setSearchResults([])}
            className="mt-4 text-sm text-purple-600 hover:text-purple-700"
          >
            Clear search results
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-4 sm:mb-6">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto hide-scrollbar">
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setActiveCategory(category.slug)}
                className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeCategory === category.slug
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {category.name}
                <span className="ml-1.5 sm:ml-2 text-xs bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full">
                  {category.faqs.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ cards */}
        <div className="p-4 sm:p-6">
          {activeData && (
            <>
              {activeData.description && (
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{activeData.description}</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {activeData.faqs.map((faq) => (
                  <button
                    key={faq.id}
                    type="button"
                    onClick={() =>
                      setSelectedFaq({
                        id: faq.id,
                        question: faq.question,
                        answer: faq.answer,
                      })
                    }
                    className="text-left border border-gray-200 rounded-xl p-4 sm:p-5 hover:bg-gray-50 hover:border-purple-200 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base leading-snug">{faq.question}</h3>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-4 sm:p-6 text-white text-center">
        <h3 className="text-base sm:text-lg font-semibold mb-2">Still have questions?</h3>
        <p className="text-purple-100 mb-4 text-sm sm:text-base">
          Can't find the answer you're looking for? Contact our support team.
        </p>
        <a
          href="mailto:contact@socialtweebs.com"
          className="inline-block px-5 sm:px-6 py-2 sm:py-2.5 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors text-sm"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
};
