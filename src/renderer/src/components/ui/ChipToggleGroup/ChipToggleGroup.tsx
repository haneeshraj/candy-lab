import styles from './ChipToggleGroup.module.scss'

interface ChipToggleGroupProps {
  label?: string
  /** The full set of selectable options. */
  options: readonly string[]
  /** Currently-selected options. */
  value: string[]
  onChange: (next: string[]) => void
}

/** A row of toggleable chips for picking a subset from a fixed option set
 * (used for platforms). */
export function ChipToggleGroup({
  label,
  options,
  value,
  onChange
}: ChipToggleGroupProps): React.JSX.Element {
  const toggle = (option: string): void => {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option])
  }

  return (
    <div className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.chips}>
        {options.map((option) => {
          const selected = value.includes(option)
          return (
            <button
              key={option}
              type="button"
              className={`${styles.chip} ${selected ? styles.selected : ''}`}
              aria-pressed={selected}
              onClick={() => toggle(option)}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
