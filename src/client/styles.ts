/**
 * Panel stylesheet.
 *
 * The page module table supplies the shell's theme tokens and UI primitives;
 * this file only adds layout. Colors are aliases rather than literals so the
 * panel follows light/dark themes and the user's theme overrides.
 */
export const STYLES = `
.adk-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 22px;
}
.adk-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1180px;
  height: 100%;
  min-height: 0;
  margin: 0 auto;
}
.adk-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 26px 32px 10px;
}
.adk-header-main { min-width: 0; }
.adk-title {
  margin: 0;
  font-size: 20px;
  line-height: 28px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.adk-subtitle {
  margin-top: 4px;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  line-height: 20px;
}
.adk-header-actions { display: inline-flex; align-items: center; gap: 8px; flex: none; }
.adk-tabs { padding: 0 32px; }
.adk-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 32px;
  padding: 9px 12px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  line-height: 20px;
}
.adk-banner[data-tone="warn"] {
  border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 7%, var(--dsw-alias-bg-base));
  color: var(--dsw-alias-label-primary);
}
.adk-banner[data-tone="error"] {
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, var(--dsw-alias-bg-base));
  color: var(--dsw-alias-state-error-primary);
}
.adk-banner-spacer { flex: 1; }
.adk-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 12px;
  row-gap: 10px;
  padding: 16px 32px 12px;
}
.adk-search {
  position: relative;
  flex: 1 1 240px;
  min-width: 160px;
  max-width: 360px;
  overflow: hidden;
}
.adk-search-input { box-sizing: border-box; width: 100%; max-width: 100%; }
.adk-search-clear {
  position: absolute;
  top: 50%;
  right: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
  transform: translateY(-50%);
}
.adk-search-clear:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.adk-sort { display: flex; flex: 0 0 auto; align-items: center; }
.adk-select {
  box-sizing: border-box;
  flex: 0 0 156px;
  width: 156px;
  height: 32px;
  padding: 0 26px 0 10px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  outline: none;
}
.adk-select:hover { border-color: var(--dsw-alias-border-l3); }
.adk-select:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -1px; }
.adk-toolbar-spacer { flex: 1; }
.adk-toolbar-actions { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.adk-selected {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  white-space: nowrap;
}
.adk-linkish {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-brand-primary);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.adk-linkish:disabled { color: var(--dsw-alias-label-caption); cursor: default; text-decoration: none; }
.adk-danger:not(:disabled) {
  color: var(--dsw-alias-state-error-primary);
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 55%, transparent);
}
.adk-danger:not(:disabled):hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); }
.adk-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.adk-icon-button:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.adk-icon-button:disabled { color: var(--dsw-alias-label-caption); cursor: default; }
.adk-table {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 32px;
}
.adk-table-scroll { flex: 1; min-height: 0; overflow: auto; transition: opacity 140ms var(--ds-ease-in-out); }
.adk-table-scroll[data-refreshing="true"] { opacity: 0.52; }
.adk-table-head,
.adk-row {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) 150px 104px 78px 86px 64px;
  gap: 12px;
  align-items: center;
}
.adk-table-head {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 7px 8px;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}
.adk-row {
  min-height: 58px;
  padding: 8px;
  border-bottom: 0.5px solid var(--dsw-alias-border-l1);
  border-radius: 9px;
  cursor: pointer;
  transition: background 140ms var(--ds-ease-in-out);
}
.adk-row:hover { background: var(--dsw-alias-interactive-bg-hover); }
.adk-row[data-selected="true"] { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }
.adk-row[data-disabled="true"] { cursor: default; }
.adk-cell-check { display: flex; align-items: center; justify-content: center; }
.adk-cell-main { min-width: 0; }
.adk-row-title {
  overflow: hidden;
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 21px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.adk-row-snippet {
  overflow: hidden;
  margin-top: 1px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.adk-cell-project,
.adk-cell-time,
.adk-cell-size {
  overflow: hidden;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.adk-cell-size { text-align: right; font-variant-numeric: tabular-nums; }
.adk-cell-status { display: flex; align-items: center; min-width: 0; }
.adk-cell-actions { display: flex; justify-content: flex-end; }
.adk-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.adk-status[data-status="running"] { color: var(--dsw-alias-state-warn-primary); }
.adk-status[data-status="missing"] { color: var(--dsw-alias-state-error-primary); }
.adk-trash-head,
.adk-trash-row {
  grid-template-columns: 26px minmax(0, 1fr) 140px 100px 78px 86px 64px;
}
.adk-trash-row { cursor: default; }
.adk-trash-row[data-selected="true"] { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }
.adk-row-actions { display: inline-flex; align-items: center; gap: 2px; }
.adk-skeleton { padding: 4px 0; }
.adk-skeleton-row {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) 150px 78px 86px;
  gap: 12px;
  align-items: center;
  min-height: 58px;
  padding: 8px;
}
.adk-skeleton-bar {
  height: 12px;
  border-radius: 6px;
  background: var(--dsw-alias-bg-skeleton);
  animation: adk-pulse 1.6s ease-in-out infinite;
}
.adk-skeleton-bar[data-wide="true"] { height: 15px; width: 72%; }
.adk-skeleton-bar[data-short="true"] { width: 42%; }
.adk-skeleton-bar[data-dot="true"] { width: 16px; height: 16px; border-radius: 4px; }
@keyframes adk-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
.adk-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 240px;
  padding: 48px 24px;
  text-align: center;
}
.adk-empty-icon { color: var(--dsw-alias-label-caption); margin-bottom: 6px; }
.adk-empty-title { color: var(--dsw-alias-label-primary); font-size: 14px; font-weight: 500; }
.adk-empty-hint { color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 20px; }
.adk-empty-action { margin-top: 8px; }
.adk-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 32px 20px;
  border-top: 0.5px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
.adk-footer-left,
.adk-footer-right { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.adk-pager { display: inline-flex; align-items: center; gap: 3px; }
.adk-page {
  min-width: 30px;
  height: 30px;
  padding: 0 7px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.adk-page:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.adk-page[data-active="true"] {
  border-color: var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font-weight: 600;
}
.adk-page:disabled { color: var(--dsw-alias-label-caption); cursor: default; }
.adk-page-gap { padding: 0 2px; color: var(--dsw-alias-label-caption); }
.adk-spinner { display: inline-flex; animation: adk-spin 800ms linear infinite; }
@keyframes adk-spin { to { transform: rotate(360deg); } }

/* The modal primitive supplies the portal, mask, focus handling and Escape. */
.adk-dialog {
  width: min(480px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 14px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.38),
    0 2px 8px rgba(0, 0, 0, 0.18);
}
.adk-dialog-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 22px 24px 0;
}
.adk-dialog-heading { flex: 1; min-width: 0; }
.adk-dialog-icon { flex: none; margin-top: 2px; color: var(--dsw-alias-state-error-primary); }
.adk-dialog-title { margin: 0; font-size: 16px; line-height: 24px; font-weight: 600; }
.adk-dialog-desc {
  margin: 6px 0 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  line-height: 20px;
}
.adk-dialog-close {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin: -2px -4px 0 0;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
}
.adk-dialog-close:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.adk-dialog-body { padding: 16px 24px 0; }
.adk-dialog-list {
  box-sizing: border-box;
  max-height: 178px;
  margin: 0 0 8px;
  padding: 2px 14px;
  overflow: auto;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  background: transparent;
}
.adk-dialog-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 0.5px solid var(--dsw-alias-border-l1);
  font-size: 13px;
  line-height: 19px;
}
.adk-dialog-item:last-child { border-bottom: 0; }
.adk-dialog-item-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.adk-dialog-item-size { flex: none; color: var(--dsw-alias-label-tertiary); font-size: 12px; font-variant-numeric: tabular-nums; }
.adk-dialog-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 2px;
  border-top: 0.5px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
.adk-dialog-total strong { color: var(--dsw-alias-label-primary); font-weight: 500; }
.adk-choices { display: flex; flex-direction: column; gap: 8px; margin: 10px 0 2px; }
.adk-choice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  transition: border-color 140ms var(--ds-ease-in-out), background 140ms var(--ds-ease-in-out);
}
.adk-choice:hover { border-color: var(--dsw-alias-border-l4); }
.adk-choice[data-selected="true"] {
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 65%, var(--dsw-alias-border-l2));
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, transparent);
}
.adk-choice input { margin: 3px 0 0; accent-color: var(--dsw-alias-brand-primary); }
.adk-choice-body { display: block; flex: 1; min-width: 0; }
.adk-choice-title { display: block; font-size: 13px; line-height: 19px; font-weight: 500; }
.adk-choice-desc {
  display: block;
  margin-top: 2px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}
.adk-choice[data-danger="true"] .adk-choice-title { color: var(--dsw-alias-state-error-primary); }
.adk-ack {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 10px 0 2px;
  color: var(--dsw-alias-state-error-primary);
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}
.adk-ack input { margin: 2px 0 0; accent-color: var(--dsw-alias-state-error-primary); }
.adk-alert {
  margin: 8px 0;
  padding: 8px 10px;
  border: 0.5px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 40%, transparent);
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-state-error-primary);
  font-size: 12px;
  line-height: 18px;
}
.adk-alert[data-tone="warn"] {
  border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, transparent);
  color: var(--dsw-alias-label-primary);
}
.adk-dialog-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 2px;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
}
.adk-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
  padding: 16px 24px 20px;
  border-top: 0.5px solid var(--dsw-alias-border-l1);
  background: transparent;
}
.adk-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.adk-menu-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.adk-menu-row:hover { background: var(--dsw-alias-bg-layer-2); }
.adk-menu-row:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }

@media (max-width: 860px) {
  .adk-header { padding: 20px 20px 8px; }
  .adk-tabs { padding: 0 20px; }
  .adk-banner { margin: 8px 20px; }
  .adk-toolbar { padding: 14px 20px 10px; }
  .adk-table { padding: 0 20px; }
  .adk-footer { padding: 12px 20px 18px; }
  .adk-table-head,
  .adk-row { grid-template-columns: 26px minmax(0, 1fr) 96px 78px 64px; }
  .adk-cell-project,
  .adk-cell-time,
  .adk-trash-head .adk-cell-project,
  .adk-trash-row .adk-cell-project { display: none; }
  .adk-table-head > span:nth-child(3),
  .adk-table-head > span:nth-child(4) { display: none; }
  .adk-trash-head,
  .adk-trash-row { grid-template-columns: 26px minmax(0, 1fr) 96px 78px 64px; }
}
@media (max-width: 620px) {
  .adk-header { flex-direction: column; gap: 8px; }
  .adk-toolbar-spacer { display: none; }
  .adk-search { max-width: none; flex-basis: 100%; }
  .adk-toolbar-actions { width: 100%; justify-content: flex-end; }
  .adk-table-head,
  .adk-row { grid-template-columns: 26px minmax(0, 1fr) 78px 64px; }
  .adk-cell-status,
  .adk-trash-head .adk-cell-status,
  .adk-trash-row .adk-cell-status { display: none; }
  .adk-table-head > span:nth-child(6) { display: none; }
  .adk-trash-head > span:nth-child(6) { display: none; }
  .adk-trash-head,
  .adk-trash-row { grid-template-columns: 26px minmax(0, 1fr) 78px 64px; }
  .adk-select { max-width: 150px; }
}
@media (prefers-reduced-motion: reduce) {
  .adk-row,
  .adk-choice,
  .adk-skeleton-bar,
  .adk-spinner { transition: none; animation: none; }
}
`
