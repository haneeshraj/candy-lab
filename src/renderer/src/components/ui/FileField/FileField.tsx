import { useId, useRef } from 'react'
import styles from './FileField.module.scss'

interface FileFieldProps {
  label?: string
  accept?: string
  /** Name of the currently-selected file, if any. */
  fileName?: string | null
  /** Object URL for an image preview thumbnail, if applicable. */
  previewUrl?: string | null
  hint?: string
  onSelect: (file: File | null) => void
}

/** File picker showing the chosen file's name, an optional image preview, and a
 * clear button. The raw `<input type=file>` is visually hidden. */
export function FileField({
  label,
  accept,
  fileName,
  previewUrl,
  hint,
  onSelect
}: FileFieldProps): React.JSX.Element {
  const fieldId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const clear = (): void => {
    if (inputRef.current) inputRef.current.value = ''
    onSelect(null)
  }

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
      )}
      <div className={styles.control}>
        {previewUrl && <img className={styles.preview} src={previewUrl} alt="" />}
        <button type="button" className={styles.pick} onClick={() => inputRef.current?.click()}>
          {fileName ? 'Change file' : 'Choose file'}
        </button>
        {fileName && (
          <>
            <span className={styles.name}>{fileName}</span>
            <button type="button" className={styles.clear} aria-label="Remove file" onClick={clear}>
              ×
            </button>
          </>
        )}
        <input
          id={fieldId}
          ref={inputRef}
          type="file"
          accept={accept}
          className={styles.hidden}
          onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
        />
      </div>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}
