import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, ArrowRight, Package, Users, Layers, Sparkles, UserCog, Truck, Users2, Settings2 } from 'lucide-react';
import { searchService } from '../../services/operationalServices';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchService.globalSearch(query.trim());
        setResults(data.results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (route) => {
    navigate(route);
    onClose();
  };

  const getCategoryIcon = (key) => {
    switch (key) {
      case 'users': return <Users className="w-4 h-4 text-indigo-700" />;
      case 'products': return <Package className="w-4 h-4 text-purple-700" />;
      case 'fabrics': return <Layers className="w-4 h-4 text-teal-700" />;
      case 'yarns': return <Sparkles className="w-4 h-4 text-saffron-700" />;
      case 'artisans': return <UserCog className="w-4 h-4 text-coral-700" />;
      case 'suppliers': return <Truck className="w-4 h-4 text-blue-700" />;
      case 'customers': return <Users2 className="w-4 h-4 text-emerald-700" />;
      case 'looms': return <Settings2 className="w-4 h-4 text-amber-700" />;
      default: return <Search className="w-4 h-4 text-linen-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24">
        <div
          className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl border border-linen-200 animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-4 border-b border-linen-200 bg-linen-50/50">
            <Search className="w-5 h-5 text-linen-400 shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users, fabrics, yarns, artisans, looms, products..."
              className="w-full py-4 text-sm bg-transparent text-linen-900 placeholder:text-linen-400 focus:outline-none"
            />
            {loading ? (
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
            ) : query ? (
              <button onClick={() => setQuery('')} className="p-1 text-linen-400 hover:text-linen-700">
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-[11px] font-semibold text-linen-400 border border-linen-300 rounded px-1.5 py-0.5">
                ESC
              </span>
            )}
          </div>

          {/* Results Container */}
          <div className="max-h-96 overflow-y-auto p-4">
            {results && Object.keys(results).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(results).map(([category, items]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-wider text-linen-400">
                      {getCategoryIcon(category)}
                      <span>{category}</span>
                    </div>
                    <div className="divide-y divide-linen-100 rounded-xl border border-linen-100 bg-linen-50/30 overflow-hidden">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item.route)}
                          className="group flex items-center justify-between p-3 hover:bg-linen-100/80 cursor-pointer transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-linen-900 group-hover:text-indigo-900">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-linen-500 mt-0.5">{item.subtitle}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-linen-400 opacity-0 group-hover:opacity-100 group-hover:text-indigo-900 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : query.length >= 2 && !loading ? (
              <div className="py-12 text-center text-xs text-linen-500">
                No matching records found for "{query}". Try a different keyword.
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-linen-400">
                Type at least 2 characters to search across all LOOMORA ERP modules.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
