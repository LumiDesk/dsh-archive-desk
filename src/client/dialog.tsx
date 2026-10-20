import { useEffect, useState } from 'react'

import {
  Button,
  IconCloseOutlineRegular,
  IconLoadingOutlineRegular,
  IconWarningTriangleOutlineRegular,
  Modal,
} from '@deepseek-ai/dsh-client-ui-primitives'

import { formatBytes } from './format'
import type { Translate } from './locales'
import type { DeleteMode, InspectResult, Pending } from './types'

export interface ConfirmDialogProps {
  t: Translate
  pending: Pending
  preview: InspectResult | null
  previewLoading: boolean
  mode: DeleteMode
  busy: boolean
  error: string | null
  onMode: (mode: DeleteMode) => void
  onCancel: () => void
  onConfirm: () => void
}

const MAX_VISIBLE_ITEMS = 5

export function ConfirmDialog(props: ConfirmDialogProps) {
  const { t, pending, preview, previewLoading, mode, busy, error, onMode, onCancel, onConfirm } =
    props
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    setAcknowledged(false)
  }, [pending, mode])

  const isDelete = pending.kind === 'delete'
  const isPurge = !isDelete || mode === 'purge'
  const count = isDelete ? pending.ids.length : pending.count
  const totalBytes = isDelete ? (preview?.totalBytes ?? 0) : pending.bytes

  const title = isDelete
    ? t('confirm.deleteTitle', { count })
    : pending.kind === 'empty'
      ? t('confirm.emptyTitle')
      : t('confirm.purgeTitle', { count })

  const description = isDelete
    ? t('confirm.deleteBody')
    : pending.kind === 'empty'
      ? t('confirm.emptyBody', { count })
      : t('confirm.purgeBody')

  const items = isDelete ? (preview?.items ?? []) : []
  const skipped = isDelete ? (preview?.running ?? 0) + (preview?.open ?? 0) : 0
  const notArchived = isDelete ? (preview?.notArchived.length ?? 0) : 0
  const checking = isDelete && previewLoading
  const canConfirm =
    !busy &&
    !checking &&
    (!isDelete || preview !== null) &&
    (!isDelete || (preview?.deletable ?? 0) > 0) &&
    (!isPurge || acknowledged)

  const close = (): void => {
    if (busy) return
    onCancel()
  }

  return (
    <Modal
      open
      title={title}
      closeLabel={t('action.close')}
      onClose={close}
      headless
      className="adk-dialog"
    >
      <div className="adk-dialog-header">
        {isPurge && (
          <span className="adk-dialog-icon" aria-hidden="true">
            <IconWarningTriangleOutlineRegular size={20} />
          </span>
        )}
        <div className="adk-dialog-heading">
          <h2 className="adk-dialog-title">{title}</h2>
          <p className="adk-dialog-desc">{description}</p>
        </div>
        <button
          type="button"
          className="adk-dialog-close"
          aria-label={t('action.close')}
          onClick={close}
          disabled={busy}
        >
          <IconCloseOutlineRegular size={16} />
        </button>
      </div>

      <div className="adk-dialog-body">
        {checking ? (
          <div className="adk-dialog-loading" role="status">
            <span className="adk-spinner" aria-hidden="true">
              <IconLoadingOutlineRegular size={15} />
            </span>
            {t('confirm.checking')}
          </div>
        ) : (
          <>
            {items.length > 0 && (
              <ul className="adk-dialog-list">
                {items.slice(0, MAX_VISIBLE_ITEMS).map((item) => (
                  <li className="adk-dialog-item" key={item.id}>
                    <span className="adk-dialog-item-title" title={item.title}>
                      {item.title}
                    </span>
                    <span className="adk-dialog-item-size">{formatBytes(item.sizeBytes)}</span>
                  </li>
                ))}
                {items.length > MAX_VISIBLE_ITEMS && (
                  <li className="adk-dialog-item">
                    <span className="adk-dialog-item-title">
                      {t('confirm.others', { count: items.length - MAX_VISIBLE_ITEMS })}
                    </span>
                  </li>
                )}
              </ul>
            )}
            <div className="adk-dialog-total">
              <span>{t('confirm.total')}</span>
              <strong>{t('confirm.release', { size: formatBytes(totalBytes) })}</strong>
            </div>
          </>
        )}

        {skipped > 0 && (
          <div className="adk-alert" data-tone="warn">
            {t('confirm.skipped', {
              running: preview?.running ?? 0,
              open: preview?.open ?? 0,
            })}
          </div>
        )}
        {notArchived > 0 && (
          <div className="adk-alert" data-tone="warn">
            {t('confirm.notArchived', { count: notArchived })}
          </div>
        )}

        {isDelete && (
          <div className="adk-choices" role="radiogroup" aria-label={t('action.delete')}>
            <label className="adk-choice" data-selected={mode === 'trash'}>
              <input
                type="radio"
                name="archive-desk-delete-mode"
                checked={mode === 'trash'}
                disabled={busy}
                onChange={() => onMode('trash')}
              />
              <span className="adk-choice-body">
                <span className="adk-choice-title">{t('confirm.option.trash')}</span>
                <span className="adk-choice-desc">{t('confirm.option.trashHint')}</span>
              </span>
            </label>
            <label className="adk-choice" data-selected={mode === 'purge'} data-danger="true">
              <input
                type="radio"
                name="archive-desk-delete-mode"
                checked={mode === 'purge'}
                disabled={busy}
                onChange={() => onMode('purge')}
              />
              <span className="adk-choice-body">
                <span className="adk-choice-title">{t('confirm.option.purge')}</span>
                <span className="adk-choice-desc">{t('confirm.option.purgeHint')}</span>
              </span>
            </label>
          </div>
        )}

        {isPurge && (
          <label className="adk-ack">
            <input
              type="checkbox"
              checked={acknowledged}
              disabled={busy}
              onChange={(event) => setAcknowledged(event.currentTarget.checked)}
            />
            <span>{t('confirm.ack')}</span>
          </label>
        )}

        {error !== null && (
          <div className="adk-alert" role="alert">
            {error}
          </div>
        )}
      </div>

      <div className="adk-dialog-footer">
        <Button variant="outline" onClick={close} disabled={busy} data-modal-autofocus>
          {t('action.cancel')}
        </Button>
        <Button
          variant={isPurge ? 'outline' : 'primary'}
          className={isPurge ? 'adk-danger' : undefined}
          onClick={onConfirm}
          disabled={!canConfirm}
        >
          {busy && (
            <span className="adk-spinner" aria-hidden="true">
              <IconLoadingOutlineRegular size={14} />
            </span>
          )}
          {t('action.confirm')}
        </Button>
      </div>
    </Modal>
  )
}
