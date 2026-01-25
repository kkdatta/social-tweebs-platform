import { useState, useEffect } from 'react';
import { Shield, Calendar } from 'lucide-react';
import { contentApi } from '../../services/api';

interface StaticContent {
  id: string;
  slug: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export const PrivacyPolicyPage = () => {
  const [content, setContent] = useState<StaticContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await contentApi.getPrivacyPolicy();
      setContent(data);
    } catch (err) {
      console.error('Failed to load Privacy Policy:', err);
      setError('Failed to load Privacy Policy. Please try again later.');
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
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 text-center">
          <p className="text-red-600 text-sm sm:text-base">{error || 'Content not found'}</p>
          <button
            onClick={loadContent}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
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
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8 mb-4 sm:mb-6">
        <div className="flex items-start sm:items-center gap-3 mb-4">
          <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{content.title}</h1>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mt-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Last Updated: {content.lastUpdated}</span>
            </div>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          This Privacy Policy outlines how we collect, use, and protect your personal information.
        </p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8">
        <div className="prose prose-gray prose-sm sm:prose max-w-none">
          {sections.map((section, index) => {
            // First section is the intro paragraph
            if (index === 0 && !section.match(/^\d+\./)) {
              return (
                <p key={index} className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                  {section.trim()}
                </p>
              );
            }

            // Parse section header and content
            const match = section.match(/^(\d+\..*?)(?:\n|$)([\s\S]*)/);
            if (match) {
              const [, header, body] = match;
              return (
                <div key={index} className="mb-6 sm:mb-8">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">{header.trim()}</h2>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                    {body.trim().split('\n').map((paragraph, pIndex) => {
                      // Check if it's a sub-section (e.g., 1.1, 2.2)
                      const subMatch = paragraph.match(/^(\d+\.\d+\s+.*)$/);
                      if (subMatch) {
                        return (
                          <h3 key={pIndex} className="text-sm sm:text-base font-medium text-gray-800 mt-3 sm:mt-4 mb-1 sm:mb-2">
                            {subMatch[1]}
                          </h3>
                        );
                      }
                      return paragraph ? <p key={pIndex} className="mb-2">{paragraph}</p> : null;
                    })}
                  </div>
                </div>
              );
            }

            return (
              <p key={index} className="text-gray-600 mb-4 leading-relaxed text-sm sm:text-base">
                {section.trim()}
              </p>
            );
          })}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mt-4 sm:mt-6 text-center">
        <p className="text-sm sm:text-base text-gray-600">
          If you have any questions about this Privacy Policy, please contact us at{' '}
          <a href="mailto:contact@socialtweebs.com" className="text-purple-600 hover:underline">
            contact@socialtweebs.com
          </a>
        </p>
      </div>
    </div>
  );
};
