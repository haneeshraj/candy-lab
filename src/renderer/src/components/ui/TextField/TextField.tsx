import { useId } from 'react'
import styles from './TextField.module.scss'

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  /** Error message; also toggles the invalid styling. */
  error?: string
  /** Muted helper text shown below the field (hidden when `error` is set). */
  hint?: string
}

/** Labeled text input with optional hint / error, wired for accessibility. */
export function TextField({
  label,
  error,
  hint,
  id,
  className,
  ...rest
}: TextFieldProps): React.JSX.Element {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const describedById = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined

  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      {label && (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
      )}
      <input
        id={fieldId}
        className={`${styles.input} ${error ? styles.invalid : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        {...rest}
      />
      {error ? (
        <span id={`${fieldId}-error`} className={styles.error}>
          {error}
        </span>
      ) : hint ? (
        <span id={`${fieldId}-hint`} className={styles.hint}>
          {hint}
        </span>
      ) : null}
    </div>
  )
}
