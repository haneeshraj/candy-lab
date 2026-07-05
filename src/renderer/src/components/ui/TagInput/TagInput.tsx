import { useId, useState } from 'react'
import styles from './TagInput.module.scss'

interface TagInputProps {
  label?: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  hint?: string
}

/** Free-form tag entry (used for genres). Type and press Enter or comma to add;
 * Backspace on an empty field removes the last tag. Duplicates are ignored
 * (case-insensitive). */
export function TagInput({
  label,
  value,
  onChange,
  placeholder,
  hint
}: TagInputProps): React.JSX.Element {
  const fieldId = useId()
  const [draft, setDraft] = useState('')

  const addTag = (raw: string): void => {
    const tag = raw.trim()
    if (!tag) return
    const exists = value.some((existing) => existing.toLowerCase() === tag.toLowerCase())
    if (!exists) onChange([...value, tag])
    setDraft('')
  }

  const removeTag = (tag: string): void => {
    onChange(value.filter((existing) => existing !== tag))
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(draft)
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
      )}
      <div className={styles.box}>
        {value.map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
            <button
              type="button"
              className={styles.remove}
              aria-label={`Remove ${tag}`}
              onClick={() => removeTag(tag)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={fieldId}
          className={styles.input}
          value={draft}
          placeholder={value.length === 0 ? placeholder : undefined}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => addTag(draft)}
        />
      </div>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}
