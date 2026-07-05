import { useId } from 'react'
import styles from './TextArea.module.scss'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

/** Labeled multi-line text input, styled to match `TextField`. */
export function TextArea({
  label,
  error,
  hint,
  id,
  className,
  rows = 3,
  ...rest
}: TextAreaProps): React.JSX.Element {
  const generatedId = useId()
  const fieldId = id ?? generatedId

  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      {label && (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        rows={rows}
        className={`${styles.input} ${error ? styles.invalid : ''}`}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error ? (
        <span className={styles.error}>{error}</span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}
    </div>
  )
}
