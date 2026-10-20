window.__ModuleLoader__.load({id:"dsh-archive-desk",factory(require){
"use strict";
var __dshArchiveDesk = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/client/index.tsx
  var index_exports = {};
  __export(index_exports, {
    create: () => create
  });
  var import_react = __require("react");
  var import_jsx_runtime = __require("react/jsx-runtime");
  var PANEL_ID = "archive-desk";
  var NS = "archive-desk";
  var ROUTE = "/archive-desk";
  var PAGE_SIZE = 20;
  var pendingDeletion = null;
  var deletionListeners = /* @__PURE__ */ new Set();
  function requestDeletion(sessionId) {
    pendingDeletion = sessionId;
    for (const listener of deletionListeners) listener();
  }
  function takeDeletion() {
    const value = pendingDeletion;
    pendingDeletion = null;
    return value;
  }
  function subscribeDeletion(listener) {
    deletionListeners.add(listener);
    return () => {
      deletionListeners.delete(listener);
    };
  }
  var colors = {
    text: "var(--dsw-alias-label-primary)",
    secondary: "var(--dsw-alias-label-secondary)",
    border: "var(--dsw-alias-border-l1)",
    base: "var(--dsw-alias-bg-base)",
    layer: "var(--dsw-alias-bg-layer-1)",
    overlay: "var(--dsw-alias-bg-overlay)",
    brand: "var(--dsw-alias-brand-primary)",
    danger: "var(--dsw-alias-state-error-primary)",
    warn: "var(--dsw-alias-state-warn-primary)"
  };
  var styles = {
    root: {
      display: "flex",
      flexDirection: "column",
      height: "100%",
      minHeight: 0,
      background: colors.base,
      color: colors.text,
      fontSize: 14
    },
    header: { padding: "24px 32px 8px" },
    headerRow: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 16
    },
    title: { margin: 0, fontSize: 20, fontWeight: 600 },
    summary: { color: colors.secondary, fontSize: 13 },
    tabs: {
      display: "flex",
      gap: 4,
      padding: "12px 32px 0",
      borderBottom: `1px solid ${colors.border}`
    },
    toolbar: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 32px",
      borderBottom: `1px solid ${colors.border}`
    },
    search: {
      flex: 1,
      minWidth: 120,
      padding: "6px 10px",
      borderRadius: 8,
      border: `1px solid ${colors.border}`,
      background: colors.layer,
      color: colors.text,
      fontSize: 13,
      outline: "none"
    },
    list: { flex: 1, minHeight: 0, overflowY: "auto", padding: "0 32px" },
    row: {
      display: "grid",
      gridTemplateColumns: "24px minmax(0, 1fr) 150px 96px",
      gap: 12,
      alignItems: "center",
      padding: "10px 4px",
      borderBottom: `1px solid ${colors.border}`
    },
    rowTitle: {
      display: "block",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    rowSnippet: {
      display: "block",
      color: colors.secondary,
      fontSize: 12,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    meta: { color: colors.secondary, fontSize: 12 },
    footer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 32px",
      borderTop: `1px solid ${colors.border}`,
      color: colors.secondary,
      fontSize: 13
    },
    empty: {
      padding: "48px 0",
      textAlign: "center",
      color: colors.secondary
    },
    button: {
      padding: "6px 12px",
      borderRadius: 8,
      border: `1px solid ${colors.border}`,
      background: colors.layer,
      color: colors.text,
      cursor: "pointer",
      fontSize: 13
    },
    primaryButton: {
      padding: "6px 12px",
      borderRadius: 8,
      border: `1px solid ${colors.brand}`,
      background: colors.brand,
      color: "#fff",
      cursor: "pointer",
      fontSize: 13
    },
    dangerButton: {
      padding: "6px 12px",
      borderRadius: 8,
      border: `1px solid ${colors.danger}`,
      background: "transparent",
      color: colors.danger,
      cursor: "pointer",
      fontSize: 13
    },
    tab: (active) => ({
      padding: "6px 12px",
      border: "none",
      borderBottom: `2px solid ${active ? colors.brand : "transparent"}`,
      background: "transparent",
      color: active ? colors.text : colors.secondary,
      cursor: "pointer",
      fontSize: 13
    }),
    banner: (tone) => ({
      margin: "0 32px 12px",
      padding: "8px 12px",
      borderRadius: 8,
      fontSize: 13,
      border: `1px solid ${tone === "error" ? colors.danger : colors.border}`,
      color: tone === "error" ? colors.danger : colors.text,
      background: colors.layer
    }),
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2e3
    },
    dialog: {
      width: 460,
      maxWidth: "calc(100vw - 48px)",
      padding: 20,
      borderRadius: 14,
      background: colors.overlay,
      border: `1px solid ${colors.border}`,
      boxShadow: "0 20px 60px rgba(0,0,0,0.25)"
    },
    dialogTitle: { margin: "0 0 12px", fontSize: 16, fontWeight: 600 },
    dialogList: {
      maxHeight: 180,
      overflowY: "auto",
      margin: "0 0 12px",
      padding: 0,
      listStyle: "none",
      fontSize: 13,
      color: colors.secondary
    },
    dialogRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      padding: "4px 0"
    },
    choice: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      padding: "6px 0",
      fontSize: 13
    },
    actions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 16
    }
  };
  var zh = {
    panel: "\u5F52\u6863\u5DE5\u4F5C\u53F0",
    "page.title": "\u5F52\u6863\u5DE5\u4F5C\u53F0",
    "page.summary": "{count} \u4E2A\u5DF2\u5F52\u6863\u5BF9\u8BDD \xB7 {size}",
    "tab.archived": "\u5DF2\u5F52\u6863",
    "tab.trash": "\u56DE\u6536\u7AD9",
    "search.placeholder": "\u641C\u7D22\u6807\u9898\u3001\u6458\u8981\u6216\u9879\u76EE",
    "action.selectAll": "\u5168\u9009",
    "action.delete": "\u5220\u9664\u6240\u9009",
    "action.restore": "\u6062\u590D",
    "action.purge": "\u5F7B\u5E95\u5220\u9664",
    "action.emptyTrash": "\u6E05\u7A7A\u56DE\u6536\u7AD9",
    "action.cancel": "\u53D6\u6D88",
    "action.confirm": "\u786E\u8BA4",
    "toggle.trash": "\u5220\u9664\u65F6\u653E\u5165\u56DE\u6536\u7AD9",
    "empty.archived": "\u8FD8\u6CA1\u6709\u5F52\u6863\u7684\u5BF9\u8BDD\u3002",
    "empty.trash": "\u56DE\u6536\u7AD9\u662F\u7A7A\u7684\u3002",
    "status.live": "\u8FD0\u884C\u4E2D",
    "status.missing": "\u5931\u6548",
    "notice.deleted": "\u5DF2\u5220\u9664 {count} \u4E2A\u4F1A\u8BDD\uFF0C\u91CA\u653E {size}",
    "notice.restored": "\u5DF2\u6062\u590D {count} \u4E2A\u4F1A\u8BDD",
    "notice.purged": "\u5DF2\u5F7B\u5E95\u5220\u9664 {count} \u4E2A\u6761\u76EE\uFF0C\u91CA\u653E {size}",
    "notice.dangling": "\u5DF2\u6E05\u7406 {count} \u6761\u5931\u6548\u5F15\u7528",
    "notice.keep": "\u5DF2\u8DF3\u8FC7 {count} \u4E2A\u65E0\u6CD5\u5220\u9664\u7684\u4F1A\u8BDD",
    "confirm.deleteTitle": "\u5220\u9664 {count} \u4E2A\u5F52\u6863\u5BF9\u8BDD\uFF1F",
    "confirm.emptyTitle": "\u6E05\u7A7A\u56DE\u6536\u7AD9\uFF1F",
    "confirm.purgeOneTitle": "\u5F7B\u5E95\u5220\u9664\u8FD9\u4E2A\u4F1A\u8BDD\uFF1F",
    "confirm.deleteBody": "\u6240\u9009\u4F1A\u8BDD\u5C06\u88AB\u79FB\u51FA\u5F52\u6863\u5217\u8868\u3002",
    "confirm.emptyBody": "\u56DE\u6536\u7AD9\u4E2D\u7684 {count} \u4E2A\u6761\u76EE\u5C06\u88AB\u6C38\u4E45\u5220\u9664\uFF0C\u65E0\u6CD5\u6062\u590D\u3002",
    "confirm.purgeOneBody": "\u8BE5\u6761\u76EE\u5C06\u88AB\u6C38\u4E45\u5220\u9664\uFF0C\u65E0\u6CD5\u6062\u590D\u3002",
    "confirm.ack": "\u6211\u5DF2\u77E5\u6653\uFF1A\u5F7B\u5E95\u5220\u9664\u540E\u65E0\u6CD5\u627E\u56DE",
    "confirm.release": "\u91CA\u653E\u7A7A\u95F4\uFF1A{size}",
    "page.prev": "\u4E0A\u4E00\u9875",
    "page.next": "\u4E0B\u4E00\u9875",
    "page.indicator": "\u7B2C {page} / {total} \u9875",
    "trash.deletedAt": "\u5220\u9664\u4E8E {time}",
    "selection.count": "\u5DF2\u9009 {count} \u9879"
  };
  var en = {
    panel: "Archive Desk",
    "page.title": "Archive Desk",
    "page.summary": "{count} archived conversations \xB7 {size}",
    "tab.archived": "Archived",
    "tab.trash": "Recycle bin",
    "search.placeholder": "Search title, preview, or project",
    "action.selectAll": "Select all",
    "action.delete": "Delete selected",
    "action.restore": "Restore",
    "action.purge": "Delete permanently",
    "action.emptyTrash": "Empty recycle bin",
    "action.cancel": "Cancel",
    "action.confirm": "Confirm",
    "toggle.trash": "Move to recycle bin",
    "empty.archived": "No archived conversations yet.",
    "empty.trash": "The recycle bin is empty.",
    "status.live": "Running",
    "status.missing": "Missing",
    "notice.deleted": "Deleted {count} conversations, freed {size}",
    "notice.restored": "Restored {count} conversations",
    "notice.purged": "Permanently deleted {count} entries, freed {size}",
    "notice.dangling": "Dropped {count} dangling references",
    "notice.keep": "Skipped {count} conversations that could not be deleted",
    "confirm.deleteTitle": "Delete {count} archived conversations?",
    "confirm.emptyTitle": "Empty the recycle bin?",
    "confirm.purgeOneTitle": "Delete this conversation permanently?",
    "confirm.deleteBody": "The selected conversations leave the archive list.",
    "confirm.emptyBody": "The {count} entries in the recycle bin are deleted forever.",
    "confirm.purgeOneBody": "This entry is deleted forever.",
    "confirm.ack": "I understand this cannot be undone",
    "confirm.release": "Frees {size}",
    "page.prev": "Previous",
    "page.next": "Next",
    "page.indicator": "Page {page} of {total}",
    "trash.deletedAt": "Deleted {time}",
    "selection.count": "{count} selected"
  };
  function formatBytes(bytes) {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
  }
  function formatTime(value) {
    const date = typeof value === "string" ? new Date(value) : new Date(value);
    if (Number.isNaN(date.getTime())) return "\u2014";
    return date.toLocaleString(void 0, {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  async function call(endpoint, payload) {
    const response = await fetch(`${ROUTE}/${endpoint}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload ?? {})
    });
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`HTTP ${response.status}`);
    }
    const envelope = body;
    if (envelope.ok === true) return envelope.value;
    throw new Error(envelope.error?.message ?? `HTTP ${response.status}`);
  }
  function ArchiveDeskIcon({ size = 18 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        style: { display: "block" },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "3", y: "4", width: "18", height: "4.5", rx: "1.5", fill: "currentColor", fillOpacity: "0.12" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4.75 8.5v9.75A1.75 1.75 0 0 0 6.5 20h11a1.75 1.75 0 0 0 1.75-1.75V8.5" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 11.6v4.6" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m9.9 14.3 2.1 2.1 2.1-2.1" })
        ]
      }
    );
  }
  function ConfirmDialog(props) {
    const { t, pending, mode, onMode, busy, onCancel, onConfirm } = props;
    const [acknowledged, setAcknowledged] = (0, import_react.useState)(false);
    const isPurge = pending.kind === "empty" || pending.kind === "purgeOne" || mode === "purge";
    const needsAck = isPurge;
    const title = pending.kind === "delete" ? t("confirm.deleteTitle", { count: pending.ids.length }) : pending.kind === "empty" ? t("confirm.emptyTitle") : t("confirm.purgeOneTitle");
    const body = pending.kind === "delete" ? t("confirm.deleteBody") : pending.kind === "empty" ? t("confirm.emptyBody", { count: pending.count }) : t("confirm.purgeOneBody");
    const bytes = pending.kind === "delete" ? pending.bytes : pending.kind === "empty" ? pending.bytes : pending.bytes;
    const labels = pending.kind === "delete" ? pending.labels : pending.kind === "purgeOne" ? [pending.label] : [];
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.overlay, role: "dialog", "aria-modal": "true", "aria-label": title, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.dialog, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: styles.dialogTitle, children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "0 0 12px", fontSize: 13, color: colors.secondary }, children: body }),
      labels.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { style: styles.dialogList, children: [
        labels.slice(0, 6).map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { style: styles.dialogRow, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "span",
          {
            style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
            children: label
          }
        ) }, `${label}-${index}`)),
        labels.length > 6 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { style: styles.dialogRow, children: [
          "+",
          labels.length - 6
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 13, color: colors.secondary }, children: t("confirm.release", { size: formatBytes(bytes) }) }),
      pending.kind === "delete" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginTop: 12 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: styles.choice, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "radio",
              checked: mode === "trash",
              onChange: () => onMode("trash"),
              disabled: busy
            }
          ),
          t("toggle.trash")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: styles.choice, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "radio",
              checked: mode === "purge",
              onChange: () => onMode("purge"),
              disabled: busy
            }
          ),
          t("action.purge")
        ] })
      ] }),
      needsAck && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { ...styles.choice, marginTop: 8, color: colors.danger }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "checkbox",
            checked: acknowledged,
            onChange: (event) => setAcknowledged(event.target.checked),
            disabled: busy
          }
        ),
        t("confirm.ack")
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.actions, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: styles.button, onClick: onCancel, disabled: busy, type: "button", children: t("action.cancel") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            style: needsAck ? styles.dangerButton : styles.primaryButton,
            onClick: onConfirm,
            disabled: busy || needsAck && !acknowledged,
            type: "button",
            children: t("action.confirm")
          }
        )
      ] })
    ] }) });
  }
  function ArchiveDeskPage({ t }) {
    const [tab, setTab] = (0, import_react.useState)("archived");
    const [query, setQuery] = (0, import_react.useState)("");
    const [appliedQuery, setAppliedQuery] = (0, import_react.useState)("");
    const [page, setPage] = (0, import_react.useState)(0);
    const [list, setList] = (0, import_react.useState)({
      total: 0,
      offset: 0,
      limit: PAGE_SIZE,
      totalBytes: 0,
      matchingIds: [],
      items: []
    });
    const [trash, setTrash] = (0, import_react.useState)([]);
    const [selected, setSelected] = (0, import_react.useState)([]);
    const [mode, setMode] = (0, import_react.useState)("trash");
    const [pending, setPending] = (0, import_react.useState)(null);
    const [dialogMode, setDialogMode] = (0, import_react.useState)("trash");
    const [busy, setBusy] = (0, import_react.useState)(false);
    const [notice, setNotice] = (0, import_react.useState)(null);
    const [error, setError] = (0, import_react.useState)(null);
    (0, import_react.useEffect)(() => {
      const handle = setTimeout(() => {
        setAppliedQuery(query);
        setPage(0);
      }, 250);
      return () => clearTimeout(handle);
    }, [query]);
    const refresh = (0, import_react.useCallback)(async () => {
      try {
        if (tab === "archived") {
          const result = await call("list", {
            offset: page * PAGE_SIZE,
            limit: PAGE_SIZE,
            ...appliedQuery === "" ? {} : { query: appliedQuery }
          });
          setList(result);
        } else {
          const entries = await call("listTrash", {});
          setTrash(entries);
        }
        setError(null);
      } catch (failure) {
        setError(failure.message);
      }
    }, [tab, page, appliedQuery]);
    (0, import_react.useEffect)(() => {
      void refresh();
    }, [refresh]);
    (0, import_react.useEffect)(() => {
      let active = true;
      const openRequested = async () => {
        const id = takeDeletion();
        if (id === null || !active) return;
        try {
          const found = await call("list", { query: id, limit: 5 });
          const item = found.items.find((row) => row.id === id);
          if (item === void 0 || !active) return;
          setTab("archived");
          setDialogMode("trash");
          setPending({ kind: "delete", ids: [id], labels: [item.title], bytes: item.sizeBytes });
        } catch {
        }
      };
      const unsubscribe = subscribeDeletion(() => {
        void openRequested();
      });
      void openRequested();
      return () => {
        active = false;
        unsubscribe();
      };
    }, []);
    const totalBytes = (0, import_react.useMemo)(
      () => tab === "archived" ? list.totalBytes : trash.reduce((sum, item) => sum + item.sizeBytes, 0),
      [tab, list.totalBytes, trash]
    );
    const selectedSet = (0, import_react.useMemo)(() => new Set(selected), [selected]);
    const pageIds = (0, import_react.useMemo)(() => list.items.map((item) => item.id), [list.items]);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedSet.has(id));
    const toggle = (id) => {
      setSelected(
        (current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
      );
    };
    const selectAll = () => {
      setSelected(allSelected ? [] : list.matchingIds);
    };
    const run = async (operation) => {
      setBusy(true);
      setError(null);
      try {
        setNotice(await operation());
        await refresh();
      } catch (failure) {
        setError(failure.message);
      } finally {
        setBusy(false);
        setPending(null);
      }
    };
    const confirmDelete = () => {
      if (pending === null || pending.kind !== "delete") return;
      void run(async () => {
        const result = await call("delete", { ids: pending.ids, mode: dialogMode });
        setSelected([]);
        const skipped = result.skipped.length > 0 ? ` \xB7 ${t("notice.keep", { count: result.skipped.length })}` : "";
        return `${t("notice.deleted", { count: result.deleted.length, size: formatBytes(result.freedBytes) })}${skipped}`;
      });
    };
    const confirmPurgeOne = () => {
      if (pending === null || pending.kind !== "purgeOne") return;
      void run(async () => {
        const result = await call("purgeTrash", { trashIds: [pending.trashId] });
        return t("notice.purged", {
          count: result.purged.length,
          size: formatBytes(result.freedBytes)
        });
      });
    };
    const confirmEmpty = () => {
      if (pending === null || pending.kind !== "empty") return;
      void run(async () => {
        const result = await call("emptyTrash", {});
        return t("notice.purged", {
          count: result.purged.length,
          size: formatBytes(result.freedBytes)
        });
      });
    };
    const restore = (trashId) => {
      void run(async () => {
        const result = await call("restore", { trashIds: [trashId] });
        return t("notice.restored", { count: result.restored.length });
      });
    };
    const cleanDangling = () => {
      void run(async () => {
        const result = await call("cleanDangling", {});
        return t("notice.dangling", { count: result.removed.length });
      });
    };
    const missing = list.items.filter((item) => item.status === "missing").length;
    const totalPages = Math.max(1, Math.ceil(list.total / PAGE_SIZE));
    const selectedBytes = list.items.filter((item) => selectedSet.has(item.id)).reduce((sum, item) => sum + item.sizeBytes, 0);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.root, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.header, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.headerRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: styles.title, children: t("page.title") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.summary, children: t("page.summary", {
          count: tab === "archived" ? list.total : trash.length,
          size: formatBytes(totalBytes)
        }) })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.tabs, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            style: styles.tab(tab === "archived"),
            onClick: () => setTab("archived"),
            children: t("tab.archived")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", style: styles.tab(tab === "trash"), onClick: () => setTab("trash"), children: [
          t("tab.trash"),
          " (",
          trash.length,
          ")"
        ] })
      ] }),
      error !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.banner("error"), children: error }),
      notice !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.banner("info"), children: notice }),
      tab === "archived" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.toolbar, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              style: styles.search,
              value: query,
              placeholder: t("search.placeholder"),
              onChange: (event) => setQuery(event.target.value)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 13 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: allSelected, onChange: selectAll }),
            t("action.selectAll")
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.meta, children: t("selection.count", { count: selected.length }) }),
          missing > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: styles.button, onClick: cleanDangling, disabled: busy, children: t("notice.dangling", { count: missing }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 13 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                checked: mode === "trash",
                onChange: (event) => setMode(event.target.checked ? "trash" : "purge")
              }
            ),
            t("toggle.trash")
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "button",
            {
              type: "button",
              style: styles.dangerButton,
              disabled: busy || selected.length === 0,
              onClick: () => {
                setDialogMode(mode);
                setPending({
                  kind: "delete",
                  ids: selected,
                  labels: list.items.filter((item) => selectedSet.has(item.id)).map((item) => item.title),
                  bytes: selectedBytes
                });
              },
              children: [
                t("action.delete"),
                " (",
                selected.length,
                ")"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.list, children: list.items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.empty, children: t("empty.archived") }) : list.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: selectedSet.has(item.id),
              onChange: () => toggle(item.id)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.rowTitle, children: item.title }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.rowSnippet, children: item.snippet })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: styles.meta, children: [
            item.workspaceTitle ?? item.cwd ?? "\u2014",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
            item.status === "live" ? t("status.live") : item.status === "missing" ? t("status.missing") : formatTime(item.updatedAt)
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.meta, children: formatBytes(item.sizeBytes) })
        ] }, item.id)) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.footer, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("page.indicator", { page: page + 1, total: totalPages }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                type: "button",
                style: styles.button,
                disabled: page === 0,
                onClick: () => setPage((value) => Math.max(0, value - 1)),
                children: t("page.prev")
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                type: "button",
                style: styles.button,
                disabled: page + 1 >= totalPages,
                onClick: () => setPage((value) => value + 1),
                children: t("page.next")
              }
            )
          ] })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.toolbar, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.meta, children: t("tab.trash") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1 } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              style: styles.dangerButton,
              disabled: busy || trash.length === 0,
              onClick: () => setPending({
                kind: "empty",
                count: trash.length,
                bytes: trash.reduce((sum, item) => sum + item.sizeBytes, 0)
              }),
              children: t("action.emptyTrash")
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.list, children: trash.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.empty, children: t("empty.trash") }) : trash.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.rowTitle, children: item.title }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.rowSnippet, children: item.snippet })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.meta, children: t("trash.deletedAt", { time: formatTime(item.movedAt) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 6, justifyContent: "flex-end" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                type: "button",
                style: styles.button,
                onClick: () => restore(item.trashId),
                children: t("action.restore")
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                type: "button",
                style: styles.dangerButton,
                onClick: () => setPending({
                  kind: "purgeOne",
                  trashId: item.trashId,
                  label: item.title,
                  bytes: item.sizeBytes
                }),
                children: "\xD7"
              }
            )
          ] })
        ] }, item.trashId)) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.footer, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("tab.trash") }) })
      ] }),
      pending !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        ConfirmDialog,
        {
          t,
          pending,
          mode: dialogMode,
          onMode: setDialogMode,
          busy,
          onCancel: () => setPending(null),
          onConfirm: pending.kind === "delete" ? confirmDelete : pending.kind === "empty" ? confirmEmpty : confirmPurgeOne
        }
      )
    ] });
  }
  function SessionMenuDelete(props) {
    const { sessionId, useWorkspaces, useMenuOpenState, t, openPanel } = props;
    const [, setMenuOpen] = useMenuOpenState();
    const archived = useWorkspaces((state) => state.archivedSessionIds.includes(sessionId));
    if (!archived) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .archive-desk-menu-row{display:flex;align-items:center;width:100%;padding:8px 12px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font-size:13px;text-align:left;cursor:pointer}
        .archive-desk-menu-row:hover{background:var(--dsw-alias-bg-layer-2)}
        .archive-desk-menu-row:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
      ` }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          role: "menuitem",
          className: "archive-desk-menu-row",
          onClick: () => {
            setMenuOpen(false);
            requestDeletion(sessionId);
            openPanel();
          },
          children: t("action.delete")
        }
      )
    ] });
  }
  function create(_require) {
    return {
      inject: ["slots", "locale", "layout"],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), "archive-desk: dictionaries");
        const t = ctx.locale.bind(NS);
        ctx.slots.inject(
          "sidebar.panellist",
          () => ctx.slots.register(
            {
              name: "sidebar.panellist",
              id: PANEL_ID,
              order: 20,
              locale: NS,
              label: () => t("panel")
            },
            ArchiveDeskIcon
          )
        );
        ctx.slots.inject(
          "main",
          () => ctx.slots.register(
            {
              name: "main",
              key: PANEL_ID,
              locale: NS,
              inject: () => ({ t })
            },
            ArchiveDeskPage
          )
        );
        ctx.slots.inject(
          "sidebar.workspaces.session.menu.item",
          () => ctx.slots.register(
            {
              name: "sidebar.workspaces.session.menu.item",
              id: "archive-desk-delete",
              order: 460,
              locale: NS,
              inject: () => ({
                t,
                openPanel: () => ctx.layout.selectPanel(PANEL_ID)
              })
            },
            SessionMenuDelete
          )
        );
      }
    };
  }
  return __toCommonJS(index_exports);
})();
return __dshArchiveDesk.create(require);}});
