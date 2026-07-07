import { Modal } from '@renderer/components/Modal'
import { Button, ChipToggleGroup, Select } from '@renderer/components/ui'
import { useArtists } from '../hooks/useArtists'
import { ArtistSelect } from './ArtistSelect'
import {
  DEFAULT_FILTERS,
  PLATFORMS,
  SORT_OPTIONS,
  TYPE_FILTER_OPTIONS,
  type ReleaseFilters,
  type SortKey
} from '../constants'
import styles from './ReleaseFilterModal.module.scss'

interface ReleaseFilterModalProps {
  isOpen: boolean
  onClose: () => void
  filters: ReleaseFilters
  /** Called live as controls change so the grid updates behind the modal. */
  onChange: (next: ReleaseFilters) => void
}

/**
 * Sort + filter editor for the catalog. Controlled: each control updates the
 * page's filter state immediately (results refresh behind the modal), so the
 * footer only needs Reset and Done. Artists are picked by name but stored as
 * IDs — `ChipToggleGroup` works in names, and we map back on change.
 */
export function ReleaseFilterModal({
  isOpen,
  onClose,
  filters,
  onChange
}: ReleaseFilterModalProps): React.JSX.Element {
  const { artists } = useArtists()

  const patch = <K extends keyof ReleaseFilters>(key: K, value: ReleaseFilters[K]): void =>
    onChange({ ...filters, [key]: value })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filter & Sort">
      <div className={styles.body}>
        <Select
          label="Sort by"
          options={SORT_OPTIONS}
          value={filters.sort}
          onChange={(event) => patch('sort', event.target.value as SortKey)}
        />

        <Select
          label="Project type"
          options={TYPE_FILTER_OPTIONS}
          value={filters.type}
          onChange={(event) => patch('type', event.target.value)}
        />

        {artists.length > 0 && (
          <ArtistSelect
            label="Artists"
            artists={artists}
            selectedIds={filters.artistIds}
            onChange={(ids) => patch('artistIds', ids)}
            allowCreate={false}
            placeholder="Search artists…"
          />
        )}

        <ChipToggleGroup
          label="Available on"
          options={PLATFORMS}
          value={filters.platforms}
          onChange={(platforms) => patch('platforms', platforms)}
        />

        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => onChange(DEFAULT_FILTERS)}>
            Reset
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  )
}
