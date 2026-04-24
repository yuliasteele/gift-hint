'use client';

import { useState, useEffect, useMemo } from 'react';
import { Pacifico, Dancing_Script } from 'next/font/google';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const dancingScript = Dancing_Script({
  weight: '500',
  subsets: ['latin'],
  display: 'swap',
});

interface GiftIdea {
  id: string;
  idea: string;
  price: number;
  createdAt: number;
  archived: boolean;
}

interface Person {
  name: string;
  gifts: GiftIdea[];
}

type SortOption = 'name' | 'price-low' | 'price-high';

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [person, setPerson] = useState('');
  const [giftIdea, setGiftIdea] = useState('');
  const [price, setPrice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/gifts');
        const data = await response.json();
        setPeople(data);
      } catch (error) {
        console.error('Failed to fetch gifts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Save data to API whenever people state changes
  useEffect(() => {
    if (!isLoading) {
      const saveData = async () => {
        try {
          await fetch('/api/gifts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(people),
          });
        } catch (error) {
          console.error('Failed to save gifts:', error);
        }
      };

      saveData();
    }
  }, [people, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!person.trim() || !giftIdea.trim() || !price) return;

    const personName = person.trim();
    const newGiftIdea: GiftIdea = {
      id: Date.now().toString(),
      idea: giftIdea.trim(),
      price: parseFloat(price),
      createdAt: Date.now(),
      archived: false,
    };

    setPeople(prevPeople => {
      const existingPersonIndex = prevPeople.findIndex(
        p => p.name.toLowerCase() === personName.toLowerCase()
      );

      if (existingPersonIndex !== -1) {
        const updated = [...prevPeople];
        updated[existingPersonIndex] = {
          ...updated[existingPersonIndex],
          gifts: [newGiftIdea, ...updated[existingPersonIndex].gifts],
        };
        return updated;
      } else {
        return [...prevPeople, { name: personName, gifts: [newGiftIdea] }];
      }
    });

    setPerson('');
    setGiftIdea('');
    setPrice('');
  };

  const handleBought = (personName: string, giftId: string) => {
    setPeople(prevPeople => {
      return prevPeople.map(person => {
        if (person.name === personName) {
          return {
            ...person,
            gifts: person.gifts.map(gift =>
              gift.id === giftId ? { ...gift, archived: true } : gift
            ),
          };
        }
        return person;
      });
    });
  };

  const getTotalBudget = () => {
    return people.reduce((total, person) => {
      return total + person.gifts.filter(g => !g.archived).reduce((sum, gift) => sum + gift.price, 0);
    }, 0);
  };

  const getTotalGiftCount = () => {
    return people.reduce((total, person) => total + person.gifts.filter(g => !g.archived).length, 0);
  };

  const getArchivedBudget = () => {
    return people.reduce((total, person) => {
      return total + person.gifts.filter(g => g.archived).reduce((sum, gift) => sum + gift.price, 0);
    }, 0);
  };

  const getArchivedGiftCount = () => {
    return people.reduce((total, person) => total + person.gifts.filter(g => g.archived).length, 0);
  };

  const filteredAndSortedPeople = useMemo(() => {
    // First filter to only show active (non-archived) gifts
    const activePeople = people
      .map(person => ({
        ...person,
        gifts: person.gifts.filter(gift => !gift.archived),
      }))
      .filter(person => person.gifts.length > 0);

    let filtered = activePeople;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = activePeople
        .map(person => {
          const personMatches = person.name.toLowerCase().includes(query);
          const matchingGifts = person.gifts.filter(gift =>
            gift.idea.toLowerCase().includes(query)
          );

          if (personMatches) {
            return person;
          } else if (matchingGifts.length > 0) {
            return { ...person, gifts: matchingGifts };
          }
          return null;
        })
        .filter((person): person is Person => person !== null);
    }

    // Sort gifts within each person
    const sorted = filtered.map(person => ({
      ...person,
      gifts: [...person.gifts].sort((a, b) => {
        switch (sortBy) {
          case 'price-low':
            return a.price - b.price;
          case 'price-high':
            return b.price - a.price;
          case 'name':
            return a.idea.localeCompare(b.idea);
          default:
            return 0;
        }
      }),
    }));

    return sorted;
  }, [people, searchQuery, sortBy]);

  const archivedPeople = useMemo(() => {
    return people
      .map(person => ({
        ...person,
        gifts: person.gifts.filter(gift => gift.archived),
      }))
      .filter(person => person.gifts.length > 0);
  }, [people]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600"></div>
            <p className="mt-4 text-lg text-gray-600">Loading your gifts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className={`${pacifico.className} text-5xl text-pink-600 sm:text-6xl`}>
            Gift Hint
          </h1>
          <p className={`${dancingScript.className} mt-3 text-2xl text-gray-700`}>
            Keep track of gift ideas for your loved ones
          </p>
        </div>

        {/* Total Budget */}
        {people.length > 0 && (
          <div className="mb-8">
            <div className="rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-center shadow-lg">
              <p className="text-sm font-medium text-pink-100">Total Budget</p>
              <p className="mt-2 text-4xl font-bold text-white">
                ${getTotalBudget().toFixed(2)}
              </p>
              <p className="mt-2 text-sm text-pink-100">
                {getTotalGiftCount()} {getTotalGiftCount() === 1 ? 'gift' : 'gifts'} planned
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
            <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200">
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="person" className="block text-sm font-medium text-gray-700">
                      Person
                    </label>
                    <input
                      type="text"
                      id="person"
                      value={person}
                      onChange={(e) => setPerson(e.target.value)}
                      placeholder="e.g., Mom, John, Sarah"
                      className="mt-2 block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Price
                    </label>
                    <div className="relative mt-2">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input
                        type="number"
                        id="price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="block w-full rounded-lg border-gray-300 bg-gray-50 py-3 pl-8 pr-4 text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="giftIdea" className="block text-sm font-medium text-gray-700">
                    Gift Idea
                  </label>
                  <input
                    type="text"
                    id="giftIdea"
                    value={giftIdea}
                    onChange={(e) => setGiftIdea(e.target.value)}
                    placeholder="e.g., Wireless headphones, Coffee maker"
                    className="mt-2 block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Add Gift Idea
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Search and Sort */}
        {getTotalGiftCount() > 0 && (
          <div className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by person or gift name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 bg-white py-3 pl-11 pr-4 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:w-64">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="block w-full rounded-lg border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Gift List */}
        {filteredAndSortedPeople.length > 0 ? (
          <div className="space-y-4">
            <h2 className="mb-6 text-2xl font-semibold text-gray-900">
              Your Gift Ideas
            </h2>
            <div className="space-y-6">
              {filteredAndSortedPeople.map((person) => (
                <div
                  key={person.name}
                  className="rounded-xl bg-white p-6 shadow-md ring-1 ring-gray-200"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="inline-block rounded-full bg-indigo-100 px-4 py-2">
                        <span className="text-lg font-semibold text-indigo-700">
                          {person.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {person.gifts.length} {person.gifts.length === 1 ? 'idea' : 'ideas'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Subtotal</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${person.gifts.reduce((sum, gift) => sum + gift.price, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {person.gifts.map((gift) => (
                      <li
                        key={gift.id}
                        className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-4 transition-all hover:bg-gray-100"
                      >
                        <div className="flex-1">
                          <p className="text-base font-medium text-gray-900">
                            {gift.idea}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-indigo-600">
                            ${gift.price.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleBought(person.name, gift.id)}
                          className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                          Bought
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : people.length > 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No matches found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search query
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No gift ideas yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by adding your first gift idea above
            </p>
          </div>
        )}

        {/* Archive Section */}
        {archivedPeople.length > 0 && (
          <div className="mt-12 space-y-4">
            <div className="mb-6 flex items-center justify-between border-t border-gray-300 pt-8">
              <h2 className="text-2xl font-semibold text-gray-900">
                Archive - Completed Purchases
              </h2>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-emerald-600">
                  ${getArchivedBudget().toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {archivedPeople.map((person) => (
                <div
                  key={person.name}
                  className="rounded-xl bg-emerald-50 p-6 shadow-md ring-1 ring-emerald-200"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="inline-block rounded-full bg-emerald-100 px-4 py-2">
                        <span className="text-lg font-semibold text-emerald-700">
                          {person.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {person.gifts.length} {person.gifts.length === 1 ? 'gift' : 'gifts'} purchased
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Spent</p>
                      <p className="text-xl font-bold text-emerald-700">
                        ${person.gifts.reduce((sum, gift) => sum + gift.price, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {person.gifts.map((gift) => (
                      <li
                        key={gift.id}
                        className="flex items-center justify-between gap-4 rounded-lg bg-white p-4"
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <svg
                            className="h-6 w-6 shrink-0 text-emerald-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <div className="flex-1">
                            <p className="text-base font-medium text-gray-700 line-through">
                              {gift.idea}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-emerald-600">
                              ${gift.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-lg bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                          Completed
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
