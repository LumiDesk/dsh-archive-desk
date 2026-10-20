window.__ModuleLoader__.load({id:"dsh-archive-desk",factory(require){
"use strict";var __dshArchiveDesk=(()=>{var Re=Object.defineProperty;var wa=Object.getOwnPropertyDescriptor;var Ta=Object.getOwnPropertyNames;var Na=Object.prototype.hasOwnProperty;var D=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(n,i)=>(typeof require<"u"?require:n)[i]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var za=(e,n)=>{for(var i in n)Re(e,i,{get:n[i],enumerable:!0})},Sa=(e,n,i,d)=>{if(n&&typeof n=="object"||typeof n=="function")for(let g of Ta(n))!Na.call(e,g)&&g!==i&&Re(e,g,{get:()=>n[g],enumerable:!(d=wa(n,g))||d.enumerable});return e};var Ra=e=>Sa(Re({},"__esModule",{value:!0}),e);var Ha={};za(Ha,{create:()=>qa});var Ca={panel:"\u5F52\u6863\u5DE5\u4F5C\u53F0","page.title":"\u5F52\u6863\u5DE5\u4F5C\u53F0","page.summary":"{count} \u4E2A\u4F1A\u8BDD \xB7 {size}","tab.archived":"\u5DF2\u5F52\u6863","tab.trash":"\u56DE\u6536\u7AD9","search.placeholder":"\u641C\u7D22\u6807\u9898\u3001\u6458\u8981\u6216\u9879\u76EE","search.clear":"\u6E05\u7A7A\u641C\u7D22","search.noResultsTitle":"\u6CA1\u6709\u5339\u914D\u7684\u4F1A\u8BDD","search.noResultsHint":"\u6362\u4E2A\u5173\u952E\u8BCD\uFF0C\u6216\u6E05\u7A7A\u641C\u7D22\u67E5\u770B\u5168\u90E8\u5F52\u6863\u3002","sort.label":"\u6392\u5E8F","sort.recent":"\u6700\u8FD1\u6D3B\u52A8","sort.size":"\u4F53\u79EF\u4ECE\u5927\u5230\u5C0F","sort.title":"\u6807\u9898","sort.archive":"\u5F52\u6863\u987A\u5E8F","pageSize.label":"\u6BCF\u9875","pageSize.unit":"\u6761","select.allPage":"\u5168\u9009\u672C\u9875","select.selected":"\u5DF2\u9009 {count} \u9879","select.selectAllMatching":"\u9009\u62E9\u5168\u90E8 {count} \u9879","select.clear":"\u6E05\u9664\u9009\u62E9","select.truncated":"\u7ED3\u679C\u8D85\u8FC7 {limit} \u9879\uFF0C\u5168\u9009\u53EA\u5305\u542B\u524D {limit} \u9879\u3002","action.refresh":"\u5237\u65B0","action.delete":"\u5220\u9664","action.restore":"\u6062\u590D","action.purge":"\u5F7B\u5E95\u5220\u9664","action.emptyTrash":"\u6E05\u7A7A\u56DE\u6536\u7AD9","action.cancel":"\u53D6\u6D88","action.confirm":"\u786E\u8BA4","action.cleanDangling":"\u6E05\u7406\u5931\u6548\u5F15\u7528\uFF08{count}\uFF09","action.retry":"\u91CD\u8BD5","action.removeReference":"\u79FB\u9664\u5F15\u7528","action.close":"\u5173\u95ED","table.session":"\u4F1A\u8BDD","table.project":"\u9879\u76EE","table.activity":"\u6700\u8FD1\u6D3B\u52A8","table.size":"\u4F53\u79EF","table.status":"\u72B6\u6001","status.running":"\u8FD0\u884C\u4E2D","status.open":"\u672A\u5173\u95ED","status.missing":"\u5931\u6548","status.corrupt":"\u635F\u574F","status.ok":"\u6B63\u5E38","status.tooltip.running":"\u4F1A\u8BDD\u6B63\u5728\u8FD0\u884C\uFF0C\u7ED3\u675F\u540E\u624D\u80FD\u5220\u9664\u3002","status.tooltip.open":"\u4F1A\u8BDD\u4ECD\u5728\u4E3B\u9762\u677F\u4E2D\u6253\u5F00\uFF0C\u8BF7\u5148\u5207\u6362\u5230\u5176\u4ED6\u4F1A\u8BDD\u518D\u5220\u9664\u3002","status.tooltip.missing":"\u4F1A\u8BDD\u65E5\u5FD7\u5DF2\u4E0D\u5728\u78C1\u76D8\u4E0A\uFF0C\u53EA\u80FD\u79FB\u9664\u5F52\u6863\u5F15\u7528\u3002","status.tooltip.corrupt":"\u56DE\u6536\u7AD9\u6761\u76EE\u5DF2\u635F\u574F\uFF0C\u53EA\u80FD\u5220\u9664\u3002","row.missingTitle":"\u5931\u6548\u4F1A\u8BDD \xB7 {id}","row.missingSnippet":"\u4F1A\u8BDD\u65E5\u5FD7\u5DF2\u4E0D\u5728\u78C1\u76D8\u4E0A\uFF0C\u53EA\u5269\u5F52\u6863\u5F15\u7528","empty.archived.title":"\u8FD8\u6CA1\u6709\u5F52\u6863\u7684\u5BF9\u8BDD","empty.archived.hint":"\u5728\u4FA7\u680F\u4F1A\u8BDD\u7684\u300C\u2026\u300D\u83DC\u5355\u91CC\u70B9\u5F52\u6863\uFF0C\u4E4B\u540E\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002","empty.trash.title":"\u56DE\u6536\u7AD9\u662F\u7A7A\u7684","empty.trash.hint":"\u5220\u9664\u7684\u5F52\u6863\u4F1A\u8BDD\u4F1A\u5148\u653E\u5728\u8FD9\u91CC\uFF0C\u53EF\u4EE5\u968F\u65F6\u6062\u590D\u3002","empty.search.title":"\u6CA1\u6709\u5339\u914D\u7684\u4F1A\u8BDD","empty.search.hint":"\u8BD5\u8BD5\u66F4\u77ED\u7684\u5173\u952E\u8BCD\uFF0C\u6216\u6E05\u7A7A\u641C\u7D22\u3002","banner.missing":"\u53D1\u73B0 {count} \u6761\u6307\u5411\u5DF2\u4E0D\u5B58\u5728\u4F1A\u8BDD\u7684\u5F52\u6863\u5F15\u7528\uFF0C\u53EF\u4EE5\u4E00\u952E\u6E05\u7406\u3002","banner.error":"\u52A0\u8F7D\u5931\u8D25\uFF1A{message}",loading:"\u52A0\u8F7D\u4E2D\u2026",refreshing:"\u6B63\u5728\u5237\u65B0\u2026","notice.deleted":"\u5DF2\u5220\u9664 {count} \u4E2A\u4F1A\u8BDD\uFF0C\u91CA\u653E {size}","notice.restored":"\u5DF2\u6062\u590D {count} \u4E2A\u4F1A\u8BDD","notice.purged":"\u5DF2\u5F7B\u5E95\u5220\u9664 {count} \u4E2A\u6761\u76EE\uFF0C\u91CA\u653E {size}","notice.cleaned":"\u5DF2\u6E05\u7406 {count} \u6761\u5931\u6548\u5F15\u7528","notice.partial":"{count} \u4E2A\u4F1A\u8BDD\u5DF2\u79FB\u5165\u56DE\u6536\u7AD9\uFF0C\u4F46\u5F52\u6863\u72B6\u6001\u66F4\u65B0\u5931\u8D25","notice.skipped":"\u8DF3\u8FC7 {count} \u4E2A\u65E0\u6CD5\u5220\u9664\u7684\u4F1A\u8BDD","notice.failed":"{count} \u9879\u64CD\u4F5C\u5931\u8D25","notice.removedReference":"\u5DF2\u79FB\u9664 {count} \u6761\u5931\u6548\u5F15\u7528","confirm.deleteTitle":"\u5220\u9664 {count} \u4E2A\u5F52\u6863\u5BF9\u8BDD\uFF1F","confirm.deleteBody":"\u6240\u9009\u4F1A\u8BDD\u4F1A\u4ECE\u5F52\u6863\u5217\u8868\u79FB\u9664\uFF1B\u9ED8\u8BA4\u653E\u5165\u56DE\u6536\u7AD9\uFF0C\u53EF\u968F\u65F6\u6062\u590D\u3002","confirm.purgeTitle":"\u5F7B\u5E95\u5220\u9664 {count} \u4E2A\u6761\u76EE\uFF1F","confirm.purgeBody":"\u8FD9\u4E9B\u6761\u76EE\u5C06\u88AB\u6C38\u4E45\u5220\u9664\uFF0C\u65E0\u6CD5\u6062\u590D\u3002","confirm.emptyTitle":"\u6E05\u7A7A\u56DE\u6536\u7AD9\uFF1F","confirm.emptyBody":"\u56DE\u6536\u7AD9\u4E2D\u7684 {count} \u4E2A\u6761\u76EE\u5C06\u88AB\u6C38\u4E45\u5220\u9664\uFF0C\u65E0\u6CD5\u6062\u590D\u3002","confirm.release":"\u91CA\u653E\u7A7A\u95F4\uFF1A{size}","confirm.ack":"\u6211\u5DF2\u77E5\u6653\uFF1A\u5F7B\u5E95\u5220\u9664\u540E\u65E0\u6CD5\u627E\u56DE","confirm.option.trash":"\u653E\u5165\u56DE\u6536\u7AD9","confirm.option.trashHint":"\u63A8\u8350\u3002\u4E4B\u540E\u53EF\u4EE5\u5728\u56DE\u6536\u7AD9\u91CC\u6062\u590D\u3002","confirm.option.purge":"\u5F7B\u5E95\u5220\u9664","confirm.option.purgeHint":"\u76F4\u63A5\u5220\u9664\u6587\u4EF6\uFF0C\u4E0D\u80FD\u6062\u590D\u3002","confirm.checking":"\u6B63\u5728\u68C0\u67E5\u6240\u9009\u4F1A\u8BDD\u2026","confirm.skipped":"\u5176\u4E2D {running} \u4E2A\u6B63\u5728\u8FD0\u884C\u3001{open} \u4E2A\u5C1A\u672A\u5173\u95ED\uFF0C\u5C06\u88AB\u8DF3\u8FC7\u3002","confirm.notArchived":"\u5176\u4E2D {count} \u4E2A\u5DF2\u4E0D\u5728\u5F52\u6863\u96C6\u5408\u4E2D\uFF0C\u5C06\u88AB\u8DF3\u8FC7\u3002","confirm.others":"\u53E6\u6709 {count} \u4E2A","confirm.total":"\u5408\u8BA1","trash.movedAt":"\u5220\u9664\u4E8E {time}","trash.corruptHint":"\u8BE5\u6761\u76EE\u7F3A\u5C11\u5143\u6570\u636E\u6216 payload\uFF0C\u4E0D\u80FD\u6062\u590D\uFF0C\u53EA\u80FD\u5220\u9664\u3002","pagination.range":"\u7B2C {from}-{to} \u6761\uFF0C\u5171 {total} \u6761","pagination.prev":"\u4E0A\u4E00\u9875","pagination.next":"\u4E0B\u4E00\u9875","menu.delete":"\u5220\u9664","error.archive/live-session":"\u4F1A\u8BDD\u6B63\u5728\u8FD0\u884C\uFF0C\u4E0D\u80FD\u5220\u9664\u3002","error.archive/open-session":"\u4F1A\u8BDD\u4ECD\u5728\u6253\u5F00\uFF0C\u8BF7\u5148\u5207\u6362\u5230\u5176\u4ED6\u4F1A\u8BDD\u3002","error.archive/not-archived":"\u8BE5\u4F1A\u8BDD\u5DF2\u4E0D\u5728\u5F52\u6863\u96C6\u5408\u4E2D\u3002","error.archive/busy":"\u8BE5\u4F1A\u8BDD\u6B63\u5728\u88AB\u53E6\u4E00\u4E2A\u64CD\u4F5C\u5904\u7406\u3002","error.archive/not-found":"\u627E\u4E0D\u5230\u4F1A\u8BDD\u76EE\u5F55\u3002","error.archive/restore-conflict":"\u6062\u590D\u76EE\u6807\u5DF2\u5B58\u5728\uFF0C\u65E0\u6CD5\u8986\u76D6\u3002","error.archive/trash-corrupt":"\u56DE\u6536\u7AD9\u6761\u76EE\u5DF2\u635F\u574F\uFF0C\u65E0\u6CD5\u6062\u590D\u3002","error.archive/unsupported":"\u5F53\u524D DSH \u7248\u672C\u7F3A\u5C11\u6240\u9700\u63A5\u53E3\u3002","error.archive/forbidden":"\u8BE5\u64CD\u4F5C\u88AB\u62D2\u7EDD\u3002","error.archive/bad-request":"\u8BF7\u6C42\u53C2\u6570\u4E0D\u5408\u6CD5\u3002","error.archive/cross-device":"\u4F1A\u8BDD\u4E0D\u5728\u540C\u4E00\u4E2A\u78C1\u76D8\u5377\u4E0A\uFF0C\u65E0\u6CD5\u79FB\u52A8\u3002","error.archive/internal":"\u5185\u90E8\u9519\u8BEF\uFF0C\u8BF7\u67E5\u770B\u542F\u52A8\u8BCA\u65AD\u3002","error.unknown":"\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002"},Pa={panel:"Archive Desk","page.title":"Archive Desk","page.summary":"{count} conversations \xB7 {size}","tab.archived":"Archived","tab.trash":"Recycle bin","search.placeholder":"Search title, preview, or project","search.clear":"Clear search","search.noResultsTitle":"No matching conversations","search.noResultsHint":"Try a shorter keyword, or clear the search.","sort.label":"Sort","sort.recent":"Recent activity","sort.size":"Largest first","sort.title":"Title","sort.archive":"Archive order","pageSize.label":"Per page","pageSize.unit":"rows","select.allPage":"Select page","select.selected":"{count} selected","select.selectAllMatching":"Select all {count}","select.clear":"Clear selection","select.truncated":"There are more than {limit} matches; select-all covers the first {limit}.","action.refresh":"Refresh","action.delete":"Delete","action.restore":"Restore","action.purge":"Delete permanently","action.emptyTrash":"Empty recycle bin","action.cancel":"Cancel","action.confirm":"Confirm","action.cleanDangling":"Clean up {count} dangling","action.retry":"Retry","action.removeReference":"Remove reference","action.close":"Close","table.session":"Conversation","table.project":"Project","table.activity":"Last activity","table.size":"Size","table.status":"Status","status.running":"Running","status.open":"Open","status.missing":"Missing","status.corrupt":"Corrupt","status.ok":"Ready","status.tooltip.running":"This conversation is running; delete it after it ends.","status.tooltip.open":"This conversation is still open in the main panel. Switch away first.","status.tooltip.missing":"The session log is gone; only the archive reference can be removed.","status.tooltip.corrupt":"This bin entry is corrupt and can only be deleted.","row.missingTitle":"Missing session \xB7 {id}","row.missingSnippet":"The session log is gone; only the archive reference remains","empty.archived.title":"No archived conversations yet","empty.archived.hint":"Archive a session from its \u201C\u2026\u201D menu, then it appears here.","empty.trash.title":"The recycle bin is empty","empty.trash.hint":"Deleted archived conversations land here first and can be restored.","empty.search.title":"No matching conversations","empty.search.hint":"Try a shorter keyword, or clear the search.","banner.missing":"{count} archive references point at sessions whose logs are gone.","banner.error":"Could not load: {message}",loading:"Loading\u2026",refreshing:"Refreshing\u2026","notice.deleted":"Deleted {count} conversations, freed {size}","notice.restored":"Restored {count} conversations","notice.purged":"Permanently deleted {count} entries, freed {size}","notice.cleaned":"Cleaned up {count} dangling references","notice.partial":"{count} conversations moved to the bin, but the archive state was not updated","notice.skipped":"Skipped {count} conversations that cannot be deleted","notice.failed":"{count} operations failed","notice.removedReference":"Removed {count} dangling references","confirm.deleteTitle":"Delete {count} archived conversations?","confirm.deleteBody":"They leave the archive list. The default is the recycle bin, so you can restore them later.","confirm.purgeTitle":"Permanently delete {count} entries?","confirm.purgeBody":"These entries are deleted forever and cannot be recovered.","confirm.emptyTitle":"Empty the recycle bin?","confirm.emptyBody":"The {count} entries in the recycle bin are deleted forever.","confirm.release":"Frees {size}","confirm.ack":"I understand this cannot be undone","confirm.option.trash":"Move to recycle bin","confirm.option.trashHint":"Recommended. Restore them from the bin later.","confirm.option.purge":"Delete permanently","confirm.option.purgeHint":"Deletes the files directly; no recovery.","confirm.checking":"Checking the selected conversations\u2026","confirm.skipped":"{running} running and {open} still-open conversations will be skipped.","confirm.notArchived":"{count} selected conversations are no longer archived and will be skipped.","confirm.others":"+{count} more","confirm.total":"Total","trash.movedAt":"Deleted {time}","trash.corruptHint":"This entry is missing metadata or its payload; it can only be deleted.","pagination.range":"{from}-{to} of {total}","pagination.prev":"Previous","pagination.next":"Next","menu.delete":"Delete","error.archive/live-session":"The conversation is running and cannot be deleted.","error.archive/open-session":"The conversation is still open. Switch away first.","error.archive/not-archived":"The conversation is no longer archived.","error.archive/busy":"Another operation is already handling this conversation.","error.archive/not-found":"The session directory could not be found.","error.archive/restore-conflict":"The restore target already exists.","error.archive/trash-corrupt":"The bin entry is corrupt and cannot be restored.","error.archive/unsupported":"This DSH version is missing a required interface.","error.archive/forbidden":"The operation was refused.","error.archive/bad-request":"The request is invalid.","error.archive/cross-device":"The session is on another volume and cannot be moved.","error.archive/internal":"Internal error; see the boot diagnostics.","error.unknown":"The operation failed. Please try again."},Qe={zh:Ca,en:Pa};var p=D("react"),s=D("@deepseek-ai/dsh-client-ui-primitives");var Ia="/archive-desk",G=class extends Error{code;status;constructor(n,i,d){super(i),this.name="ArchiveDeskClientError",this.code=n,this.status=d}};async function A(e,n={},i){let d=await fetch(`${Ia}/${e}`,{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify(n),signal:i}),g=await d.text(),u;try{u=JSON.parse(g)}catch{throw new G("archive/internal",`HTTP ${d.status}`,d.status)}if(u.ok===!0)return u.value;throw new G(u.error?.code??"archive/internal",u.error?.message??`HTTP ${d.status}`,d.status)}var ge=D("react"),N=D("@deepseek-ai/dsh-client-ui-primitives");var Da={"archive/live-session":"error.archive/live-session","archive/open-session":"error.archive/open-session","archive/not-archived":"error.archive/not-archived","archive/busy":"error.archive/busy","archive/not-found":"error.archive/not-found","archive/restore-conflict":"error.archive/restore-conflict","archive/trash-corrupt":"error.archive/trash-corrupt","archive/unsupported":"error.archive/unsupported","archive/forbidden":"error.archive/forbidden","archive/bad-request":"error.archive/bad-request","archive/cross-device":"error.archive/cross-device","archive/internal":"error.archive/internal"};function R(e){if(!Number.isFinite(e)||e<=0)return"0 B";if(e<1024)return`${Math.round(e)} B`;let n=["KB","MB","GB","TB"],i=e/1024,d=0;for(;i>=1024&&d<n.length-1;)i/=1024,d+=1;return`${i<10?i.toFixed(1):Math.round(i)} ${n[d]??"TB"}`}var Aa=[["year",365*24*60*60*1e3],["month",720*60*60*1e3],["week",10080*60*1e3],["day",1440*60*1e3],["hour",3600*1e3],["minute",60*1e3]];function Ce(e,n=Date.now()){if(e===void 0||e==="")return"\u2014";let i=typeof e=="string"?Date.parse(e):e;if(!Number.isFinite(i)||i<=0)return"\u2014";let d=i-n,g=Math.abs(d);if(g<60*1e3)return new Intl.RelativeTimeFormat(void 0,{numeric:"auto"}).format(0,"second");if(g>720*60*60*1e3)return new Date(i).toLocaleDateString(void 0,{year:"numeric",month:"2-digit",day:"2-digit"});let u=new Intl.RelativeTimeFormat(void 0,{numeric:"auto"});for(let[h,y]of Aa)if(g>=y)return u.format(Math.round(d/y),h);return u.format(Math.round(d/(60*1e3)),"minute")}function Pe(e){if(e===void 0||e==="")return"\u2014";let n=typeof e=="string"?Date.parse(e):e;return!Number.isFinite(n)||n<=0?"\u2014":new Date(n).toLocaleString(void 0,{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}function Ve(e){return e.startsWith("session-")?e.slice(8,16):e.slice(0,8)}function q(e,n){if(e instanceof G){let i=Da[e.code];return i!==void 0?n(i):e.message}return e instanceof Error&&e.name==="AbortError"?n("error.unknown"):e instanceof Error?e.message:n("error.unknown")}var c=D("react/jsx-runtime"),Ie=5;function Je(e){let{t:n,pending:i,preview:d,previewLoading:g,mode:u,busy:h,error:y,onMode:M,onCancel:k,onConfirm:_}=e,[B,m]=(0,ge.useState)(!1);(0,ge.useEffect)(()=>{m(!1)},[i,u]);let v=i.kind==="delete",C=!v||u==="purge",x=v?i.ids.length:i.count,me=v?d?.totalBytes??0:i.bytes,T=v?n("confirm.deleteTitle",{count:x}):i.kind==="empty"?n("confirm.emptyTitle"):n("confirm.purgeTitle",{count:x}),fe=v?n("confirm.deleteBody"):i.kind==="empty"?n("confirm.emptyBody",{count:x}):n("confirm.purgeBody"),O=v?d?.items??[]:[],se=v?(d?.running??0)+(d?.open??0):0,K=v?d?.notArchived.length??0:0,Q=v&&g,ie=!h&&!Q&&(!v||d!==null)&&(!v||(d?.deletable??0)>0)&&(!C||B),j=()=>{h||k()};return(0,c.jsxs)(N.Modal,{open:!0,title:T,closeLabel:n("action.close"),onClose:j,headless:!0,className:"adk-dialog",children:[(0,c.jsxs)("div",{className:"adk-dialog-header",children:[C&&(0,c.jsx)("span",{className:"adk-dialog-icon","aria-hidden":"true",children:(0,c.jsx)(N.IconWarningTriangleOutlineRegular,{size:20})}),(0,c.jsxs)("div",{className:"adk-dialog-heading",children:[(0,c.jsx)("h2",{className:"adk-dialog-title",children:T}),(0,c.jsx)("p",{className:"adk-dialog-desc",children:fe})]}),(0,c.jsx)("button",{type:"button",className:"adk-dialog-close","aria-label":n("action.close"),onClick:j,disabled:h,children:(0,c.jsx)(N.IconCloseOutlineRegular,{size:16})})]}),(0,c.jsxs)("div",{className:"adk-dialog-body",children:[Q?(0,c.jsxs)("div",{className:"adk-dialog-loading",role:"status",children:[(0,c.jsx)("span",{className:"adk-spinner","aria-hidden":"true",children:(0,c.jsx)(N.IconLoadingOutlineRegular,{size:15})}),n("confirm.checking")]}):(0,c.jsxs)(c.Fragment,{children:[O.length>0&&(0,c.jsxs)("ul",{className:"adk-dialog-list",children:[O.slice(0,Ie).map(P=>(0,c.jsxs)("li",{className:"adk-dialog-item",children:[(0,c.jsx)("span",{className:"adk-dialog-item-title",title:P.title,children:P.title}),(0,c.jsx)("span",{className:"adk-dialog-item-size",children:R(P.sizeBytes)})]},P.id)),O.length>Ie&&(0,c.jsx)("li",{className:"adk-dialog-item",children:(0,c.jsx)("span",{className:"adk-dialog-item-title",children:n("confirm.others",{count:O.length-Ie})})})]}),(0,c.jsxs)("div",{className:"adk-dialog-total",children:[(0,c.jsx)("span",{children:n("confirm.total")}),(0,c.jsx)("strong",{children:n("confirm.release",{size:R(me)})})]})]}),se>0&&(0,c.jsx)("div",{className:"adk-alert","data-tone":"warn",children:n("confirm.skipped",{running:d?.running??0,open:d?.open??0})}),K>0&&(0,c.jsx)("div",{className:"adk-alert","data-tone":"warn",children:n("confirm.notArchived",{count:K})}),v&&(0,c.jsxs)("div",{className:"adk-choices",role:"radiogroup","aria-label":n("action.delete"),children:[(0,c.jsxs)("label",{className:"adk-choice","data-selected":u==="trash",children:[(0,c.jsx)("input",{type:"radio",name:"archive-desk-delete-mode",checked:u==="trash",disabled:h,onChange:()=>M("trash")}),(0,c.jsxs)("span",{className:"adk-choice-body",children:[(0,c.jsx)("span",{className:"adk-choice-title",children:n("confirm.option.trash")}),(0,c.jsx)("span",{className:"adk-choice-desc",children:n("confirm.option.trashHint")})]})]}),(0,c.jsxs)("label",{className:"adk-choice","data-selected":u==="purge","data-danger":"true",children:[(0,c.jsx)("input",{type:"radio",name:"archive-desk-delete-mode",checked:u==="purge",disabled:h,onChange:()=>M("purge")}),(0,c.jsxs)("span",{className:"adk-choice-body",children:[(0,c.jsx)("span",{className:"adk-choice-title",children:n("confirm.option.purge")}),(0,c.jsx)("span",{className:"adk-choice-desc",children:n("confirm.option.purgeHint")})]})]})]}),C&&(0,c.jsxs)("label",{className:"adk-ack",children:[(0,c.jsx)("input",{type:"checkbox",checked:B,disabled:h,onChange:P=>m(P.currentTarget.checked)}),(0,c.jsx)("span",{children:n("confirm.ack")})]}),y!==null&&(0,c.jsx)("div",{className:"adk-alert",role:"alert",children:y})]}),(0,c.jsxs)("div",{className:"adk-dialog-footer",children:[(0,c.jsx)(N.Button,{variant:"outline",onClick:j,disabled:h,"data-modal-autofocus":!0,children:n("action.cancel")}),(0,c.jsxs)(N.Button,{variant:C?"outline":"primary",className:C?"adk-danger":void 0,onClick:_,disabled:!ie,children:[h&&(0,c.jsx)("span",{className:"adk-spinner","aria-hidden":"true",children:(0,c.jsx)(N.IconLoadingOutlineRegular,{size:14})}),n("action.confirm")]})]})]})}var De=null;function Xe(e,n){De={ids:e,...n===void 0?{}:{title:n}};for(let i of Ae)i()}function Ze(){let e=De;return De=null,e}var Ae=new Set;function ea(e){return Ae.add(e),()=>{Ae.delete(e)}}var a=D("react/jsx-runtime"),Ma=[10,20,50],Ba=7;function ja({size:e=14}){return(0,a.jsx)("span",{className:"adk-spinner","aria-hidden":"true",children:(0,a.jsx)(s.IconLoadingOutlineRegular,{size:e})})}function he(e){return e.status==="ok"||e.status==="missing"}function Ea({item:e,t:n}){return e.status==="running"?(0,a.jsx)(s.Tooltip,{label:n("status.tooltip.running"),side:"bottom",children:(0,a.jsxs)("span",{className:"adk-status","data-status":"running",children:[(0,a.jsx)(s.StateDot,{state:"ongoing"}),n("status.running")]})}):e.status==="open"?(0,a.jsx)(s.Tooltip,{label:n("status.tooltip.open"),side:"bottom",children:(0,a.jsxs)("span",{className:"adk-status","data-status":"open",children:[(0,a.jsx)(s.StateDot,{state:"idle"}),n("status.open")]})}):e.status==="missing"?(0,a.jsx)(s.Tooltip,{label:n("status.tooltip.missing"),side:"bottom",children:(0,a.jsx)(s.Tag,{tone:"danger",children:n("status.missing")})}):null}function aa({rows:e=6}){return(0,a.jsx)("div",{className:"adk-skeleton","aria-hidden":"true",children:Array.from({length:e},(n,i)=>(0,a.jsxs)("div",{className:"adk-skeleton-row",children:[(0,a.jsx)("span",{className:"adk-skeleton-bar","data-dot":"true"}),(0,a.jsx)("span",{className:"adk-skeleton-bar","data-wide":"true"}),(0,a.jsx)("span",{className:"adk-skeleton-bar"}),(0,a.jsx)("span",{className:"adk-skeleton-bar","data-short":"true"}),(0,a.jsx)("span",{className:"adk-skeleton-bar","data-short":"true"})]},i))})}function Me(e){return(0,a.jsxs)("div",{className:"adk-empty",children:[(0,a.jsx)("span",{className:"adk-empty-icon",children:e.icon}),(0,a.jsx)("span",{className:"adk-empty-title",children:e.title}),(0,a.jsx)("span",{className:"adk-empty-hint",children:e.hint}),e.action!==void 0&&(0,a.jsx)("span",{className:"adk-empty-action",children:e.action})]})}function La(e,n){if(n<=Ba)return Array.from({length:n},(u,h)=>h);let d=[...new Set([0,n-1,e-1,e,e+1])].filter(u=>u>=0&&u<n).sort((u,h)=>u-h),g=[];for(let u=0;u<d.length;u+=1){let h=d[u];h!==void 0&&(u>0&&h-(d[u-1]??h)>1&&g.push("gap"),g.push(h))}return g}function ta(e){let{t:n,page:i,pageSize:d,total:g,busy:u,onPage:h,onPageSize:y}=e,M=Math.max(1,Math.ceil(g/d)),k=g===0?0:i*d+1,_=Math.min(g,(i+1)*d),B=La(i,M);return(0,a.jsxs)("div",{className:"adk-footer",children:[(0,a.jsxs)("div",{className:"adk-footer-left",children:[(0,a.jsx)("span",{children:n("pagination.range",{from:k,to:_,total:g})}),(0,a.jsxs)("label",{className:"adk-selected",children:[n("pageSize.label"),(0,a.jsx)("select",{className:"adk-select",value:d,disabled:u,"aria-label":n("pageSize.label"),onChange:m=>y(Number(m.target.value)),children:Ma.map(m=>(0,a.jsx)("option",{value:m,children:m},m))})]})]}),(0,a.jsxs)("div",{className:"adk-footer-right",children:[(0,a.jsx)("button",{type:"button",className:"adk-page","aria-label":n("pagination.prev"),disabled:u||i<=0,onClick:()=>h(Math.max(0,i-1)),children:(0,a.jsx)(s.IconChevronLeftOutlineRegular,{size:15})}),B.map((m,v)=>m==="gap"?(0,a.jsx)("span",{className:"adk-page-gap",children:"\u2026"},`gap-${v}`):(0,a.jsx)("button",{type:"button",className:"adk-page","data-active":m===i,"aria-current":m===i?"page":void 0,disabled:u,onClick:()=>h(m),children:m+1},m)),(0,a.jsx)("button",{type:"button",className:"adk-page","aria-label":n("pagination.next"),disabled:u||i+1>=M,onClick:()=>h(Math.min(M-1,i+1)),children:(0,a.jsx)(s.IconChevronRightOutlineRegular,{size:15})})]})]})}function na({t:e}){let[n,i]=(0,p.useState)("archived"),[d,g]=(0,p.useState)(""),[u,h]=(0,p.useState)(""),[y,M]=(0,p.useState)("recent"),[k,_]=(0,p.useState)(20),[B,m]=(0,p.useState)(0),[v,C]=(0,p.useState)(0),[x,me]=(0,p.useState)(null),[T,fe]=(0,p.useState)(null),[O,se]=(0,p.useState)(0),[K,Q]=(0,p.useState)(0),[ie,j]=(0,p.useState)(!0),[P,oe]=(0,p.useState)(!1),[je,le]=(0,p.useState)(null),[be,sa]=(0,p.useState)(0),[z,F]=(0,p.useState)([]),[Ee,W]=(0,p.useState)({}),[S,V]=(0,p.useState)([]),[ia,J]=(0,p.useState)({}),[w,X]=(0,p.useState)(null),[ve,de]=(0,p.useState)("trash"),[ke,ce]=(0,p.useState)(null),[oa,Le]=(0,p.useState)(!1),[la,E]=(0,p.useState)(null),[f,U]=(0,p.useState)(!1),[Z,Oe]=(0,p.useState)(null),$e=(0,p.useRef)(!1),qe=(0,p.useRef)(!1),I=(0,p.useRef)(0),He=(0,p.useRef)(0),_e=(0,p.useRef)(null),$=(0,p.useCallback)((t,r="success")=>{He.current+=1,Oe({id:He.current,text:t,tone:r})},[]),ee=(0,p.useCallback)(()=>{sa(t=>t+1)},[]);(0,p.useEffect)(()=>{let t=setTimeout(()=>{h(d),m(0)},250);return()=>clearTimeout(t)},[d]),(0,p.useEffect)(()=>{m(0),C(0),F([]),W({}),V([]),J({})},[n,u,y,k]),(0,p.useEffect)(()=>{if(n!=="archived")return;let t=new AbortController,r=I.current+1;I.current=r;let l=!$e.current;return le(null),l?j(!0):oe(!0),A("list",{offset:B*k,limit:k,sort:y,...u===""?{}:{query:u}},t.signal).then(o=>{if(r!==I.current)return;let b=Math.max(0,Math.ceil(o.total/k)-1);$e.current=!0,me(o),B>b&&m(b)}).catch(o=>{t.signal.aborted||r!==I.current||le(q(o,e))}).finally(()=>{r===I.current&&(j(!1),oe(!1))}),()=>t.abort()},[n,B,k,u,y,be,e]),(0,p.useEffect)(()=>{let t=new AbortController;return A("listTrash",{offset:0,limit:1},t.signal).then(r=>{t.signal.aborted||(se(r.total),Q(r.totalBytes))}).catch(()=>{}),()=>t.abort()},[be]),(0,p.useEffect)(()=>{if(n!=="trash")return;let t=new AbortController,r=I.current+1;I.current=r;let l=!qe.current;return le(null),l?j(!0):oe(!0),A("listTrash",{offset:v*k,limit:k},t.signal).then(o=>{if(r!==I.current)return;let b=Math.max(0,Math.ceil(o.total/k)-1);qe.current=!0,fe(o),se(o.total),Q(o.totalBytes),v>b&&C(b)}).catch(o=>{t.signal.aborted||r!==I.current||le(q(o,e))}).finally(()=>{r===I.current&&(j(!1),oe(!1))}),()=>t.abort()},[n,v,k,be,e]);let pe=(0,p.useCallback)(async t=>{if(t.length!==0){i("archived"),de("trash"),ce(null),E(null),X({kind:"delete",ids:t}),Le(!0);try{let r=await A("inspect",{ids:t});ce(r)}catch(r){E(q(r,e))}finally{Le(!1)}}},[e]);(0,p.useEffect)(()=>{let t=()=>{let l=Ze();l!==null&&pe(l.ids)},r=ea(t);return t(),r},[pe]);let ae=x?.items??[],Y=ae.filter(he).map(t=>t.id),ue=(0,p.useMemo)(()=>new Set(z),[z]),Fe=Y.length>0&&Y.every(t=>ue.has(t)),We=Y.some(t=>ue.has(t))&&!Fe;(0,p.useEffect)(()=>{let t=_e.current?.querySelector("input");t!=null&&(t.indeterminate=We)},[We]);let da=z.reduce((t,r)=>t+(Ee[r]?.sizeBytes??0),0),ca=z.every(t=>Ee[t]!==void 0),te=x?.matchingIds??[],pa=te.length>z.length&&x!==null,Ue=t=>{if(!he(t))return;let r=ue.has(t.id);F(l=>r?l.filter(o=>o!==t.id):[...l,t.id]),W(l=>{let o={...l};return r?delete o[t.id]:o[t.id]=t,o})},ua=t=>{if(t){let r=new Set([...z,...Y]);F([...r]),W(l=>{let o={...l};for(let b of ae)he(b)&&(o[b.id]=b);return o})}else{let r=new Set(Y);F(l=>l.filter(o=>!r.has(o))),W(l=>{let o={...l};for(let b of r)delete o[b];return o})}},ga=()=>{F(te),W(t=>{let r={...t};for(let l of ae)te.includes(l.id)&&(r[l.id]=l);return r})},xe=()=>{F([]),W({})},ne=T?.items??[],ye=(0,p.useMemo)(()=>new Set(S),[S]),re=ne.map(t=>t.trashId),ha=re.length>0&&re.every(t=>ye.has(t)),Ye=t=>{let r=ye.has(t.trashId);V(l=>r?l.filter(o=>o!==t.trashId):[...l,t.trashId]),J(l=>{let o={...l};return r?delete o[t.trashId]:o[t.trashId]=t,o})},ma=t=>{if(t){let r=new Set([...S,...re]);V([...r]),J(l=>{let o={...l};for(let b of ne)o[b.trashId]=b;return o})}else{let r=new Set(re);V(l=>l.filter(o=>!r.has(o))),J(l=>{let o={...l};for(let b of r)delete o[b];return o})}},we=()=>{V([]),J({})},fa=()=>{de("purge"),E(null),X({kind:"empty",count:T?.total??O,bytes:T?.totalBytes??K})},Ge=t=>{if(t.length===0)return;let r=t.map(l=>ia[l]??ne.find(o=>o.trashId===l)).filter(l=>l!==void 0);de("purge"),E(null),X({kind:"purge",trashIds:t,count:t.length,bytes:r.reduce((l,o)=>l+o.sizeBytes,0),...t.length===1&&r[0]!==void 0?{label:r[0].title}:{}})},Ke=async t=>{if(!(t.length===0||f)){U(!0);try{let r=await A("restore",{trashIds:t}),l=r.failed.length,o=r.restored.length>0?e("notice.restored",{count:r.restored.length})+(l>0?` \xB7 ${e("notice.failed",{count:l})}`:""):e("notice.failed",{count:l});$(o,r.restored.length>0?"success":"error"),we(),ee()}catch(r){$(q(r,e),"error")}finally{U(!1)}}},ba=async()=>{if(!f){U(!0);try{let t=await A("cleanDangling",{});$(e("notice.cleaned",{count:t.removed.length}),t.failed.length>0?"error":"success"),xe(),ee()}catch(t){$(q(t,e),"error")}finally{U(!1)}}},va=()=>{w===null||f||w.kind==="delete"&&(ke===null||ke.deletable===0)||(U(!0),E(null),(async()=>{try{if(w.kind==="delete"){let t=await A("delete",{ids:w.ids,mode:ve}),r=[e("notice.deleted",{count:t.deleted.length,size:R(t.freedBytes)})];t.partial.length>0&&r.push(e("notice.partial",{count:t.partial.length})),t.skipped.length>0&&r.push(e("notice.skipped",{count:t.skipped.length})),$(r.join(" \xB7 "),t.deleted.length>0?"success":"error"),xe()}else if(w.kind==="empty"){let t=await A("emptyTrash",{}),r=e("notice.purged",{count:t.purged.length,size:R(t.freedBytes)})+(t.failed.length>0?` \xB7 ${e("notice.failed",{count:t.failed.length})}`:"");$(r,t.purged.length>0?"success":"error"),we()}else{let t=await A("purgeTrash",{trashIds:w.trashIds}),r=e("notice.purged",{count:t.purged.length,size:R(t.freedBytes)})+(t.failed.length>0?` \xB7 ${e("notice.failed",{count:t.failed.length})}`:"");$(r,t.purged.length>0?"success":"error"),we()}X(null),ce(null),ee()}catch(t){E(q(t,e))}finally{U(!1)}})())},Te=x?.total??0,Ne=T?.total??O,ka=n==="archived"?Te:Ne,xa=n==="archived"?x?.totalBytes??0:T?.totalBytes??K,ze=x?.missingTotal??0,ya=u.trim()!==""&&Te===0;return(0,a.jsxs)("div",{className:"adk-root",children:[(0,a.jsxs)("div",{className:"adk-shell",children:[(0,a.jsxs)("header",{className:"adk-header",children:[(0,a.jsxs)("div",{className:"adk-header-main",children:[(0,a.jsx)("h1",{className:"adk-title",children:e("page.title")}),(0,a.jsxs)("div",{className:"adk-subtitle",children:[e("page.summary",{count:ka,size:R(xa)}),P&&(0,a.jsxs)("span",{className:"adk-selected",style:{marginLeft:10},children:[(0,a.jsx)(ja,{size:12}),e("refreshing")]})]})]}),(0,a.jsx)("div",{className:"adk-header-actions",children:(0,a.jsx)(s.Tooltip,{label:e("action.refresh"),side:"bottom",align:"end",children:(0,a.jsx)(s.Button,{variant:"outline",size:"sm","aria-label":e("action.refresh"),disabled:f,onClick:ee,children:(0,a.jsx)(s.IconRefreshOutlineRegular,{size:14})})})})]}),(0,a.jsx)("div",{className:"adk-tabs",children:(0,a.jsx)(s.SegmentedTabs,{label:e("page.title"),value:n,onChange:t=>i(t),items:[{value:"archived",label:`${e("tab.archived")} (${Te})`,id:"adk-tab-archived",panelId:"adk-panel-archived"},{value:"trash",label:`${e("tab.trash")} (${Ne})`,id:"adk-tab-trash",panelId:"adk-panel-trash"}]})}),je!==null&&(0,a.jsxs)("div",{className:"adk-banner","data-tone":"error",role:"alert",children:[(0,a.jsx)(s.IconWarningTriangleOutlineRegular,{size:16}),(0,a.jsx)("span",{children:e("banner.error",{message:je})}),(0,a.jsx)("span",{className:"adk-banner-spacer"}),(0,a.jsx)(s.Button,{variant:"outline",size:"sm",onClick:ee,children:e("action.retry")})]}),n==="archived"&&ze>0&&(0,a.jsxs)("div",{className:"adk-banner","data-tone":"warn",children:[(0,a.jsx)(s.IconWarningTriangleOutlineRegular,{size:16}),(0,a.jsx)("span",{children:e("banner.missing",{count:ze})}),(0,a.jsx)("span",{className:"adk-banner-spacer"}),(0,a.jsx)(s.Button,{variant:"outline",size:"sm",disabled:f,onClick:()=>void ba(),children:e("action.cleanDangling",{count:ze})})]}),n==="archived"?(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)("div",{className:"adk-toolbar",children:[(0,a.jsxs)("div",{className:"adk-search",children:[(0,a.jsx)(s.Input,{className:"adk-search-input",value:d,icon:(0,a.jsx)(s.IconSearchOutlineRegular,{size:15}),placeholder:e("search.placeholder"),"aria-label":e("search.placeholder"),onChange:t=>g(t.target.value)}),d!==""&&(0,a.jsx)("button",{type:"button",className:"adk-search-clear","aria-label":e("search.clear"),onClick:()=>g(""),children:"\xD7"})]}),(0,a.jsxs)("select",{className:"adk-select",value:y,"aria-label":e("sort.label"),onChange:t=>M(t.target.value),children:[(0,a.jsx)("option",{value:"recent",children:e("sort.recent")}),(0,a.jsx)("option",{value:"size",children:e("sort.size")}),(0,a.jsx)("option",{value:"title",children:e("sort.title")}),(0,a.jsx)("option",{value:"archive",children:e("sort.archive")})]}),(0,a.jsx)("span",{className:"adk-toolbar-spacer"}),z.length>0&&(0,a.jsxs)("span",{className:"adk-selected",children:[e("select.selected",{count:z.length}),ca&&` \xB7 ${R(da)}`,pa&&(0,a.jsx)("button",{type:"button",className:"adk-linkish",onClick:ga,children:e("select.selectAllMatching",{count:te.length})}),(0,a.jsx)("button",{type:"button",className:"adk-linkish",onClick:xe,children:e("select.clear")})]}),(0,a.jsx)("div",{className:"adk-toolbar-actions",children:(0,a.jsxs)(s.Button,{variant:"outline",size:"sm",className:"adk-danger",disabled:f||z.length===0,onClick:()=>void pe(z),children:[(0,a.jsx)(s.IconTrashOutlineRegular,{size:14}),e("action.delete")," (",z.length,")"]})})]}),x?.matchingIdsTruncated===!0&&(0,a.jsx)("div",{className:"adk-banner","data-tone":"warn",children:e("select.truncated",{limit:te.length})}),(0,a.jsxs)("div",{className:"adk-table",children:[(0,a.jsxs)("div",{className:"adk-table-head",children:[(0,a.jsx)("span",{className:"adk-cell-check",ref:_e,children:(0,a.jsx)(s.Checkbox,{label:"",checked:Fe,disabled:Y.length===0||f,title:e("select.allPage"),onChange:ua})}),(0,a.jsx)("span",{children:e("table.session")}),(0,a.jsx)("span",{children:e("table.project")}),(0,a.jsx)("span",{children:e("table.activity")}),(0,a.jsx)("span",{children:e("table.size")}),(0,a.jsx)("span",{children:e("table.status")}),(0,a.jsx)("span",{})]}),(0,a.jsx)("div",{className:"adk-table-scroll","data-refreshing":P,children:ie&&x===null?(0,a.jsx)(aa,{}):ae.length===0?ya?(0,a.jsx)(Me,{icon:(0,a.jsx)(s.IconSearchOutlineRegular,{size:28}),title:e("empty.search.title"),hint:e("empty.search.hint"),action:(0,a.jsx)(s.Button,{variant:"outline",size:"sm",onClick:()=>g(""),children:e("search.clear")})}):(0,a.jsx)(Me,{icon:(0,a.jsx)(s.IconArchiveOutlineRegular,{size:28}),title:e("empty.archived.title"),hint:e("empty.archived.hint")}):ae.map(t=>{let r=ue.has(t.id),l=he(t),o=t.status==="missing"?e("row.missingTitle",{id:Ve(t.id)}):t.title,b=t.status==="missing"?e("row.missingSnippet"):t.snippet;return(0,a.jsxs)("div",{className:"adk-row","data-selected":r,"data-disabled":!l,onClick:()=>Ue(t),children:[(0,a.jsx)("span",{className:"adk-cell-check",onClick:Se=>Se.stopPropagation(),children:(0,a.jsx)(s.Checkbox,{label:"",checked:r,disabled:!l||f,title:t.status==="running"?e("status.tooltip.running"):t.status==="open"?e("status.tooltip.open"):e("select.allPage"),onChange:()=>Ue(t)})}),(0,a.jsxs)("div",{className:"adk-cell-main",children:[(0,a.jsx)("div",{className:"adk-row-title",title:o,children:o}),(0,a.jsx)("div",{className:"adk-row-snippet",title:b,children:b===""?"\u2014":b})]}),(0,a.jsx)("span",{className:"adk-cell-project",title:t.cwd??t.workspaceTitle,children:t.workspaceTitle??t.cwd??"\u2014"}),(0,a.jsx)("span",{className:"adk-cell-time",title:Pe(t.updatedAt),children:Ce(t.updatedAt)}),(0,a.jsx)("span",{className:"adk-cell-size",children:R(t.sizeBytes)}),(0,a.jsx)("span",{className:"adk-cell-status",children:(0,a.jsx)(Ea,{item:t,t:e})}),(0,a.jsx)("span",{className:"adk-cell-actions",onClick:Se=>Se.stopPropagation(),children:l&&(0,a.jsx)(s.Tooltip,{label:t.status==="missing"?e("action.removeReference"):e("action.delete"),side:"bottom",align:"end",children:(0,a.jsx)("button",{type:"button",className:"adk-icon-button","aria-label":e("action.delete"),disabled:f,onClick:()=>void pe([t.id]),children:(0,a.jsx)(s.IconTrashOutlineRegular,{size:15})})})})]},t.id)})}),x!==null&&x.total>0&&(0,a.jsx)(ta,{t:e,page:B,pageSize:k,total:x.total,busy:f,onPage:m,onPageSize:t=>{_(t),m(0)}})]})]}):(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)("div",{className:"adk-toolbar",children:[(0,a.jsx)("span",{className:"adk-selected",children:S.length>0?e("select.selected",{count:S.length}):e("tab.trash")}),(0,a.jsx)("span",{className:"adk-toolbar-spacer"}),(0,a.jsxs)("div",{className:"adk-toolbar-actions",children:[(0,a.jsxs)(s.Button,{variant:"outline",size:"sm",disabled:f||S.length===0,onClick:()=>void Ke(S),children:[(0,a.jsx)(s.IconUnarchiveOutlineRegular,{size:14}),e("action.restore")," (",S.length,")"]}),(0,a.jsxs)(s.Button,{variant:"outline",size:"sm",className:"adk-danger",disabled:f||S.length===0,onClick:()=>Ge(S),children:[(0,a.jsx)(s.IconTrashOutlineRegular,{size:14}),e("action.purge")," (",S.length,")"]}),(0,a.jsx)(s.Button,{variant:"outline",size:"sm",className:"adk-danger",disabled:f||Ne===0,onClick:fa,children:e("action.emptyTrash")})]})]}),(0,a.jsxs)("div",{className:"adk-table",children:[(0,a.jsxs)("div",{className:"adk-table-head adk-trash-head",children:[(0,a.jsx)("span",{className:"adk-cell-check",children:(0,a.jsx)(s.Checkbox,{label:"",checked:ha,disabled:re.length===0||f,title:e("select.allPage"),onChange:ma})}),(0,a.jsx)("span",{children:e("table.session")}),(0,a.jsx)("span",{children:e("table.project")}),(0,a.jsx)("span",{children:e("table.activity")}),(0,a.jsx)("span",{children:e("table.size")}),(0,a.jsx)("span",{children:e("table.status")}),(0,a.jsx)("span",{})]}),(0,a.jsx)("div",{className:"adk-table-scroll","data-refreshing":P,children:ie&&T===null?(0,a.jsx)(aa,{}):ne.length===0?(0,a.jsx)(Me,{icon:(0,a.jsx)(s.IconTrashOutlineRegular,{size:28}),title:e("empty.trash.title"),hint:e("empty.trash.hint")}):ne.map(t=>{let r=ye.has(t.trashId),l=t.status==="corrupt";return(0,a.jsxs)("div",{className:"adk-row adk-trash-row","data-selected":r,onClick:()=>Ye(t),children:[(0,a.jsx)("span",{className:"adk-cell-check",onClick:o=>o.stopPropagation(),children:(0,a.jsx)(s.Checkbox,{label:"",checked:r,disabled:f,title:e("select.allPage"),onChange:()=>Ye(t)})}),(0,a.jsxs)("div",{className:"adk-cell-main",children:[(0,a.jsx)("div",{className:"adk-row-title",title:t.title,children:t.title}),(0,a.jsx)("div",{className:"adk-row-snippet",title:t.snippet,children:l?e("trash.corruptHint"):t.snippet===""?"\u2014":t.snippet})]}),(0,a.jsx)("span",{className:"adk-cell-project",children:t.workspaceTitle??t.cwd??"\u2014"}),(0,a.jsx)("span",{className:"adk-cell-time",title:Pe(t.movedAt),children:t.movedAt===void 0?"\u2014":e("trash.movedAt",{time:Ce(t.movedAt)})}),(0,a.jsx)("span",{className:"adk-cell-size",children:R(t.sizeBytes)}),(0,a.jsx)("span",{className:"adk-cell-status",children:l?(0,a.jsx)(s.Tooltip,{label:e("status.tooltip.corrupt"),side:"bottom",children:(0,a.jsx)(s.Tag,{tone:"danger",children:e("status.corrupt")})}):(0,a.jsx)(s.Tag,{tone:"info",children:e("status.ok")})}),(0,a.jsxs)("span",{className:"adk-row-actions",onClick:o=>o.stopPropagation(),children:[(0,a.jsx)(s.Tooltip,{label:e("action.restore"),side:"bottom",align:"end",children:(0,a.jsx)("button",{type:"button",className:"adk-icon-button","aria-label":e("action.restore"),disabled:f||l,onClick:()=>void Ke([t.trashId]),children:(0,a.jsx)(s.IconUnarchiveOutlineRegular,{size:15})})}),(0,a.jsx)(s.Tooltip,{label:e("action.purge"),side:"bottom",align:"end",children:(0,a.jsx)("button",{type:"button",className:"adk-icon-button","aria-label":e("action.purge"),disabled:f,onClick:()=>Ge([t.trashId]),children:(0,a.jsx)(s.IconTrashOutlineRegular,{size:15})})})]})]},t.trashId)})}),T!==null&&T.total>0&&(0,a.jsx)(ta,{t:e,page:v,pageSize:k,total:T.total,busy:f,onPage:C,onPageSize:t=>{_(t),C(0)}})]})]})]}),w!==null&&(0,a.jsx)(Je,{t:e,pending:w,preview:ke,previewLoading:oa,mode:ve,busy:f,error:la,onMode:t=>{de(t),E(null)},onCancel:()=>{f||(X(null),ce(null),E(null))},onConfirm:va},`${w.kind}-${ve}-${w.kind==="delete"?w.ids.join(","):w.kind==="purge"?w.trashIds.join(","):"all"}`),Z!==null&&(0,a.jsx)(s.Toast,{text:Z.text,tone:Z.tone==="success"?"success":void 0,icon:Z.tone==="error"?(0,a.jsx)(s.IconWarningTriangleOutlineRegular,{size:15}):void 0,onDone:()=>Oe(null)},Z.id)]})}var ra=`
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
  gap: 10px;
  padding: 16px 32px 12px;
}
.adk-search { position: relative; flex: 1 1 260px; min-width: 180px; max-width: 380px; }
.adk-search-input { width: 100%; }
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
.adk-select {
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
  grid-template-columns: 26px minmax(0, 1fr) 150px 104px 78px 86px 30px;
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
.adk-status[data-status="open"] { color: var(--dsw-alias-label-tertiary); }
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
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 14px;
  background: var(--dsw-alias-bg-overlay);
  color: var(--dsw-alias-label-primary);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
}
.adk-dialog-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 20px 22px 0;
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
.adk-dialog-body { padding: 14px 22px 0; }
.adk-dialog-list {
  max-height: 178px;
  margin: 0 0 8px;
  padding: 2px 12px;
  overflow: auto;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1);
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
  padding: 4px 2px 8px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
.adk-dialog-total strong { color: var(--dsw-alias-label-primary); font-weight: 500; }
.adk-choices { display: flex; flex-direction: column; gap: 8px; margin: 8px 0 2px; }
.adk-choice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1);
  cursor: pointer;
  transition: border-color 140ms var(--ds-ease-in-out), background 140ms var(--ds-ease-in-out);
}
.adk-choice:hover { border-color: var(--dsw-alias-border-l4); }
.adk-choice[data-selected="true"] {
  border-color: var(--dsw-alias-brand-primary);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, var(--dsw-alias-bg-layer-1));
}
.adk-choice input { margin: 3px 0 0; accent-color: var(--dsw-alias-brand-primary); }
.adk-choice-body { min-width: 0; }
.adk-choice-title { font-size: 13px; line-height: 19px; font-weight: 500; }
.adk-choice-desc { margin-top: 1px; color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
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
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent);
  color: var(--dsw-alias-state-error-primary);
  font-size: 12px;
  line-height: 18px;
}
.adk-alert[data-tone="warn"] {
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 9%, transparent);
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
  margin-top: 16px;
  padding: 14px 22px 18px;
  border-top: 0.5px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
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
  .adk-row { grid-template-columns: 26px minmax(0, 1fr) 96px 78px 30px; }
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
  .adk-row { grid-template-columns: 26px minmax(0, 1fr) 78px 30px; }
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
`;var L=D("react/jsx-runtime"),Be="archive-desk",H="archive-desk";function Oa({size:e=18}){return(0,L.jsxs)("svg",{width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",style:{display:"block"},children:[(0,L.jsx)("rect",{x:"3",y:"4",width:"18",height:"4.5",rx:"1.5",fill:"currentColor",fillOpacity:"0.12"}),(0,L.jsx)("path",{d:"M4.75 8.5v9.75A1.75 1.75 0 0 0 6.5 20h11a1.75 1.75 0 0 0 1.75-1.75V8.5"}),(0,L.jsx)("path",{d:"M12 11.6v4.6"}),(0,L.jsx)("path",{d:"m9.9 14.3 2.1 2.1 2.1-2.1"})]})}function $a(e){let{sessionId:n,displayTitle:i,useWorkspaces:d,useMenuOpenState:g,t:u,openPanel:h}=e,[,y]=g();return d(k=>k.archivedSessionIds.includes(n))?(0,L.jsx)("button",{type:"button",role:"menuitem",className:"adk-menu-row",onClick:()=>{y(!1),Xe([n],i),h()},children:u("menu.delete")}):null}function qa(e){return{inject:["slots","locale","layout"],apply(n){n.effect(()=>n.locale.register(H,Qe),"archive-desk: dictionaries"),n.effect(()=>{if(typeof document>"u")return()=>{};let d=document.createElement("style");return d.dataset.plugin=H,d.dataset.pluginCss=`${H}/panel.css`,d.textContent=ra,document.head.appendChild(d),()=>d.remove()},"archive-desk: panel styles");let i=n.locale.bind(H);n.slots.inject("sidebar.panellist",()=>n.slots.register({name:"sidebar.panellist",id:Be,order:20,locale:H,label:()=>i("panel")},Oa)),n.slots.inject("main",()=>n.slots.register({name:"main",key:Be,locale:H,inject:()=>({t:i})},na)),n.slots.inject("sidebar.workspaces.session.menu.item",()=>n.slots.register({name:"sidebar.workspaces.session.menu.item",id:"archive-desk-delete",order:460,locale:H,inject:()=>({t:i,openPanel:()=>n.layout.selectPanel(Be)})},$a))}}}return Ra(Ha);})();
return __dshArchiveDesk.create(require);}});
