import { useId } from 'react'
import styles from './Select.module.scss'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  /** Optional leading placeholder rendered as a disabled first option. */
  placeholder?: string
}

/** Labeled native `<select>`, styled to match the design system. */
export function Select({
  label,
  error,
  options,
  placeholder,
  id,
  className,
  value,
  ...rest
}: SelectProps): React.JSX.Element {
  const generatedId = useId()
  const fieldId = id ?? generatedId

  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      {label && (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
      )}
      <div className={styles.wrap}>
        <select
          id={fieldId}
          className={`${styles.select} ${error ? styles.invalid : ''}`}
          aria-invalid={error ? true : undefined}
          value={value}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
