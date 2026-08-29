import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, ActivityFilters } from '../types';
import { ActivityCard } from '../components/ActivityCard';
import { FilterBar } from '../components/FilterBar';
import { RegistrationModal } from '../components/RegistrationModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import api from '../services/api';

export const ActivitiesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filters State initialized from URL query params
  const [filters, setFilters] = useState<ActivityFilters>(() => ({
    type: searchParams.get('type') || undefined,
    location: searchParams.get('location') || undefined,
    difficulty: searchParams.get('difficulty') || undefined,
    category: searchParams.get('category') || undefined,
    search: searchParams.get('search') || undefined,
  }));

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getActivities(filters);
      let list = res.activities;
      
      // Client-side search keyword filtering
      if (filters.search && filters.search.trim()) {
        const query = filters.search.toLowerCase();
        list = list.filter(
          (a: Activity) =>
            a.name.toLowerCase().includes(query) ||
            a.description.toLowerCase().includes(query) ||
            a.interests?.some((tag: string) => tag.toLowerCase().includes(query)) ||
            a.tags?.some((tag: string) => tag.toLowerCase().includes(query)) ||
            a.species?.some((s: string) => s.toLowerCase().includes(query))
        );
      }

      setActivities(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load activities from BNHS backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [filters]);

  const handleFilterChange = (newFilters: ActivityFilters) => {
    setFilters(newFilters);
    // Update URL query params
    const nextParams = new URLSearchParams();
    if (newFilters.type) nextParams.set('type', newFilters.type);
    if (newFilters.location) nextParams.set('location', newFilters.location);
    if (newFilters.difficulty) nextParams.set('difficulty', newFilters.difficulty);
    if (newFilters.category) nextParams.set('category', newFilters.category);
    if (newFilters.search) nextParams.set('search', newFilters.search);
    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    const emptyFilters: ActivityFilters = {};
    setFilters(emptyFilters);
    setSearchParams(new URLSearchParams());
  };

  const handleRegisterClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setModalOpen(true);
  };

  return (
    <div className="container" style={{ padding: '40px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Authentic Inventory
        </span>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--color-forest-dark)', marginBottom: '10px' }}>
          Explore BNHS Activities
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', maxWidth: '680px' }}>
          Discover naturalist-led nature walks, herpetology field camps, certificate biodiversity courses, and volunteer opportunities.
        </p>
      </div>


      {/* Filter Component */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Content State */}
      {loading ? (
        <LoadingSpinner message="Fetching authentic BNHS activities..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchActivities} />
      ) : activities.length === 0 ? (
        <EmptyState
          title="No Activities Found"
          description="We couldn't find any activities matching your selected filters. Try clearing some criteria."
          actionText="Reset Filters"
          onActionClick={handleResetFilters}
        />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Showing <strong>{activities.length}</strong> activities
            </span>
          </div>

          <div className="cards-grid" style={{ marginTop: 0 }}>
            {activities.map((activity, index) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                index={index}
                onRegisterClick={handleRegisterClick}
              />
            ))}
          </div>
        </>
      )}

      {/* Registration Modal */}
      <RegistrationModal
        activity={selectedActivity}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};
