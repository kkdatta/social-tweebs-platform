import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
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

export const FaqPage = () => {
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const data = await contentApi.getAllFaqs();
      setCategories(data.categories);
      if (data.categories.length > 0) {
        setActiveCategory(data.categories[0].slug);
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
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

  const toggleFaq = (faqId: string) => {
    const newExpanded = new Set(expandedFaqs);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedFaqs(newExpanded);
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
          <div className="space-y-3 sm:space-y-4">
            {searchResults.map((result: any) => (
              <div key={result.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFaq(result.id)}
                  className="w-full flex items-center justify-between p-3 sm:p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-xs text-purple-600 font-medium">{result.category.name}</span>
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base">{result.question}</h3>
                  </div>
                  {expandedFaqs.has(result.id) ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                  )}
                </button>
                {expandedFaqs.has(result.id) && (
                  <div className="p-3 sm:p-4 text-gray-600 border-t border-gray-200 text-sm">
                    {result.answer}
                  </div>
                )}
              </div>
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

        {/* FAQ List */}
        <div className="p-4 sm:p-6">
          {activeData && (
            <>
              {activeData.description && (
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{activeData.description}</p>
              )}
              <div className="space-y-2 sm:space-y-3">
                {activeData.faqs.map((faq) => (
                  <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="font-medium text-gray-900 pr-3 sm:pr-4 text-sm sm:text-base">{faq.question}</h3>
                      {expandedFaqs.has(faq.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                      )}
                    </button>
                    {expandedFaqs.has(faq.id) && (
                      <div className="p-3 sm:p-4 text-gray-600 bg-gray-50 border-t border-gray-200 text-sm">
                        {faq.answer}
                      </div>
                    )}
                  </div>
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
