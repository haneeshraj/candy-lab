import { useId } from 'react'
import styles from './Checkbox.module.scss'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  /** Muted description under the label. */
  description?: string
}

/** Labeled checkbox with an optional description line. */
export function Checkbox({
  label,
  description,
  id,
  className,
  ...rest
}: CheckboxProps): React.JSX.Element {
  const generatedId = useId()
  const fieldId = id ?? generatedId

  return (
    <label className={`${styles.row} ${className ?? ''}`} htmlFor={fieldId}>
      <input id={fieldId} type="checkbox" className={styles.input} {...rest} />
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
    </label>
  )
}
