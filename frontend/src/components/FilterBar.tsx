import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { ActivityFilters } from '../types';

interface FilterBarProps {
  filters: ActivityFilters;
  onFilterChange: (newFilters: ActivityFilters) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onReset }) => {
  return (
    <div className="filter-bar">
      <div className="filter-grid">
        {/* Search */}
        <div className="filter-group">
          <label className="filter-label">Search Keywords</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="e.g. Flamingo, Herpetology, Trees..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="filter-input"
              style={{ paddingLeft: '36px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--color-text-light)' }} />
          </div>
        </div>

        {/* Activity Type */}
        <div className="filter-group">
          <label className="filter-label">Activity Format</label>
          <select
            value={filters.type || ''}
            onChange={(e) => onFilterChange({ ...filters, type: e.target.value || undefined })}
            className="filter-select"
          >
            <option value="">All Formats (Walk, Camp, Course, Volunteer)</option>
            <option value="walk">Nature Walk</option>
            <option value="camp">Field Camp</option>
            <option value="course">Hybrid Course</option>
            <option value="volunteer">Volunteering / SEVA</option>
          </select>
        </div>

        {/* Location */}
        <div className="filter-group">
          <label className="filter-label">Location</label>
          <select
            value={filters.location || ''}
            onChange={(e) => onFilterChange({ ...filters, location: e.target.value || undefined })}
            className="filter-select"
          >
            <option value="">All Locations</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Navi Mumbai">Navi Mumbai</option>
            <option value="Pune">Pune</option>
            <option value="Delhi">Delhi (CEC Asola Bhatti)</option>
            <option value="Matheran">Matheran (Western Ghats)</option>
            <option value="Amboli">Amboli (Biodiversity Hotspot)</option>
          </select>
        </div>

        {/* Difficulty */}
        <div className="filter-group">
          <label className="filter-label">Difficulty</label>
          <select
            value={filters.difficulty || ''}
            onChange={(e) => onFilterChange({ ...filters, difficulty: e.target.value || undefined })}
            className="filter-select"
          >
            <option value="">All Difficulty Levels</option>
            <option value="easy">Easy (Beginner-Friendly)</option>
            <option value="intermediate">Intermediate</option>
            <option value="moderate">Moderate</option>
          </select>
        </div>
      </div>

      {/* Reset button if any filter is active */}
      {(filters.type || filters.location || filters.difficulty || filters.category || filters.search) && (
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onReset}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}
          >
            <RotateCcw size={13} />
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};
