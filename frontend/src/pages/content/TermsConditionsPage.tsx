import { useState, useEffect } from 'react';
import { FileText, Calendar } from 'lucide-react';
import { contentApi } from '../../services/api';

interface StaticContent {
  id: string;
  slug: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export const TermsConditionsPage = () => {
  const [content, setContent] = useState<StaticContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await contentApi.getTermsConditions();
      setContent(data);
    } catch (err) {
      console.error('Failed to load Terms & Conditions:', err);
      setError('Failed to load Terms & Conditions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">{error || 'Content not found'}</p>
          <button
            onClick={loadContent}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Parse content into sections
  const sections = content.content.split(/\n(?=\d+\.)/);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8 mb-4 sm:mb-6">
        <div className="flex items-start sm:items-center gap-3 mb-3 sm:mb-4">
          <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{content.title}</h1>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mt-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Last Updated: {content.lastUpdated}</span>
            </div>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          Please read these Terms & Conditions carefully before using SocialTweebs.com.
        </p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8">
        <div className="prose prose-gray max-w-none">
          {sections.map((section, index) => {
            // First section is the intro paragraph
            if (index === 0 && !section.match(/^\d+\./)) {
              return (
                <p key={index} className="text-gray-600 mb-6 leading-relaxed">
                  {section.trim()}
                </p>
              );
            }

            // Parse section header and content
            const match = section.match(/^(\d+\..*?)(?:\n|$)([\s\S]*)/);
            if (match) {
              const [, header, body] = match;
              return (
                <div key={index} className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">{header.trim()}</h2>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {body.trim().split('\n').map((paragraph, pIndex) => {
                      // Check if it's a sub-section (e.g., 1.1, 2.2)
                      const subMatch = paragraph.match(/^(\d+\.\d+\s+.*)$/);
                      if (subMatch) {
                        return (
                          <h3 key={pIndex} className="text-base font-medium text-gray-800 mt-4 mb-2">
                            {subMatch[1]}
                          </h3>
                        );
                      }
                      // Check for lettered list items (a., b., c., etc.)
                      const listMatch = paragraph.match(/^([a-z]\.)\s+(.*)$/);
                      if (listMatch) {
                        return (
                          <div key={pIndex} className="flex gap-2 mb-2 ml-4">
                            <span className="font-medium">{listMatch[1]}</span>
                            <span>{listMatch[2]}</span>
                          </div>
                        );
                      }
                      return paragraph ? <p key={pIndex} className="mb-2">{paragraph}</p> : null;
                    })}
                  </div>
                </div>
              );
            }

            return (
              <p key={index} className="text-gray-600 mb-4 leading-relaxed">
                {section.trim()}
              </p>
            );
          })}
        </div>
      </div>

      {/* Agreement Notice */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mt-6">
        <p className="text-purple-800 text-center">
          By using SocialTweebs.com, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.
        </p>
      </div>

      {/* Contact */}
      <div className="bg-gray-50 rounded-xl p-6 mt-6 text-center">
        <p className="text-gray-600">
          If you have any questions about these Terms, please contact us at{' '}
          <a href="mailto:contact@socialtweebs.com" className="text-purple-600 hover:underline">
            contact@socialtweebs.com
          </a>
        </p>
      </div>
    </div>
  );
};
