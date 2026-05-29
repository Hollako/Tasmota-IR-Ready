/**
 * Tasmota IR Ready — Remote Card v2.0
 *
 * Enhanced remote-control Lovelace card with a visual UI editor,
 * configurable button groups, extra user-defined buttons, and
 * hold-to-repeat for volume & channel buttons.
 *
 * Card config schema:
 *   type:          custom:tasmota-ir-remote-card
 *   entity:        remote.my_tasmota_remote   # required
 *   title:         Living Room TV             # optional — overrides entity name
 *   hidden_groups: [keypad, colors]           # optional — group IDs to hide
 *   extra_buttons:                            # optional — card-level custom buttons
 *     - label:   Netflix
 *       command: netflix
 *       color:   "#e50914"
 */

const CARD_VERSION = "2.0.0";

// ── Button group definitions ──────────────────────────────────────────────────

const GROUP_DEFS = [
  {
    id: "power",
    label: "Power",
    layout: "power",
    buttons: [
      { cmd: "power",     label: "⏻ POWER" },
      { cmd: "power_on",  label: "⏻ ON"    },
      { cmd: "power_off", label: "⏻ OFF"   },
    ],
  },
  {
    id: "volume",
    label: "Volume",
    layout: "row",
    buttons: [
      { cmd: "volume_up",   icon: "🔊", label: "VOL +" },
      { cmd: "mute",        icon: "🔇", label: "MUTE", cls: "btn-mute" },
      { cmd: "volume_down", icon: "🔉", label: "VOL −" },
    ],
  },
  {
    id: "channels",
    label: "Channels",
    layout: "row",
    buttons: [
      { cmd: "channel_up",   icon: "▲", label: "CH ▲" },
      { cmd: "channel_down", icon: "▼", label: "CH ▼" },
    ],
  },
  {
    id: "nav_aux",
    label: "Navigation Aux",
    layout: "row",
    buttons: [
      { cmd: "home",     icon: "⌂", label: "Home"  },
      { cmd: "menu",     icon: "☰", label: "Menu"  },
      { cmd: "back",     icon: "↩", label: "Back"  },
      { cmd: "exit",     icon: "✕", label: "Exit"  },
      { cmd: "info",     icon: "ℹ", label: "Info"  },
      { cmd: "settings", icon: "⚙", label: "Setup" },
    ],
  },
  {
    id: "dpad",
    label: "D-Pad",
    layout: "dpad",
    buttons: [
      { cmd: "up",    icon: "▲", pos: "top"    },
      { cmd: "left",  icon: "◀", pos: "left"   },
      { cmd: "ok",    label: "OK", pos: "center" },
      { cmd: "right", icon: "▶", pos: "right"  },
      { cmd: "down",  icon: "▼", pos: "bottom" },
    ],
  },
  {
    id: "colors",
    label: "Color Buttons",
    layout: "row",
    buttons: [
      { cmd: "red",    icon: "⬤", cls: "btn-color btn-red",    title: "Red"    },
      { cmd: "green",  icon: "⬤", cls: "btn-color btn-green",  title: "Green"  },
      { cmd: "yellow", icon: "⬤", cls: "btn-color btn-yellow", title: "Yellow" },
      { cmd: "blue",   icon: "⬤", cls: "btn-color btn-blue",   title: "Blue"   },
    ],
  },
  {
    id: "keypad",
    label: "Number Keypad",
    layout: "keypad",
    buttons: [
      { cmd: "digit_1", label: "1" }, { cmd: "digit_2", label: "2" }, { cmd: "digit_3", label: "3" },
      { cmd: "digit_4", label: "4" }, { cmd: "digit_5", label: "5" }, { cmd: "digit_6", label: "6" },
      { cmd: "digit_7", label: "7" }, { cmd: "digit_8", label: "8" }, { cmd: "digit_9", label: "9" },
      null,                           { cmd: "digit_0", label: "0" }, null,
    ],
  },
];

// Commands that belong to the fixed groups (not shown in "Custom" section)
const KNOWN_CMDS = new Set([
  "power", "power_on", "power_off",
  "volume_up", "volume_down", "mute",
  "channel_up", "channel_down",
  "up", "down", "left", "right", "ok",
  "back", "home", "menu", "info", "exit", "settings",
  "red", "green", "yellow", "blue",
  "digit_0","digit_1","digit_2","digit_3","digit_4",
  "digit_5","digit_6","digit_7","digit_8","digit_9",
  "source_cycle",
]);

// Commands that support hold-to-repeat when button is held
const HOLD_CMDS = new Set(["volume_up", "volume_down", "channel_up", "channel_down"]);

// ── Visual card editor ────────────────────────────────────────────────────────

class TasmotaIrRemoteCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass   = null;
    this._ready  = false;
  }

  setConfig(config) {
    this._config = { ...config };
    if (this._ready) this._syncValues();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._ready) this._build();
    if (this._entityPicker) this._entityPicker.hass = hass;
    // Fallback input: keep datalist fresh
    this._refreshDatalist();
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  _build() {
    this._ready = true;
    const hidden = this._config.hidden_groups || [];
    const extra  = this._config.extra_buttons || [];

    this.innerHTML = `
<style>
  .ed { font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif); }
  .ed-section { margin-bottom: 20px; }
  .ed-lbl {
    display: block;
    font-size: 0.78em;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--secondary-text-color);
    margin-bottom: 6px;
  }
  .ed-input {
    width: 100%;
    box-sizing: border-box;
    padding: 9px 11px;
    border: 1px solid var(--divider-color, #ccc);
    border-radius: 8px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font-size: 0.92em;
    outline: none;
    transition: border-color 0.15s;
  }
  .ed-input:focus { border-color: var(--primary-color, #03a9f4); }
  .ed-divider { border: none; border-top: 1px solid var(--divider-color, rgba(0,0,0,0.1)); margin: 18px 0; }
  .ed-check-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 0;
    font-size: 0.9em;
    cursor: pointer;
  }
  .ed-check-row input[type=checkbox] { width: 16px; height: 16px; accent-color: var(--primary-color, #03a9f4); cursor: pointer; }
  .ed-extra-item {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    background: var(--secondary-background-color, rgba(0,0,0,0.03));
    border-radius: 8px;
    padding: 6px 8px;
  }
  .ed-extra-item input {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid var(--divider-color, #ccc);
    border-radius: 6px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font-size: 0.85em;
    min-width: 0;
    outline: none;
  }
  .ed-extra-item input[data-f="color"] {
    flex: 0 0 36px;
    padding: 2px;
    height: 32px;
    cursor: pointer;
    border-radius: 4px;
  }
  .ed-btn-rm {
    flex: 0 0 auto;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--error-color, #f44336);
    font-size: 1.1em;
    padding: 2px 6px;
    border-radius: 4px;
    line-height: 1;
  }
  .ed-btn-rm:hover { background: rgba(244,67,54,0.1); }
  .ed-btn-add {
    width: 100%;
    margin-top: 4px;
    padding: 8px 14px;
    border: 1.5px dashed var(--primary-color, #03a9f4);
    border-radius: 8px;
    background: none;
    color: var(--primary-color, #03a9f4);
    cursor: pointer;
    font-size: 0.88em;
    font-family: inherit;
    transition: background 0.15s;
  }
  .ed-btn-add:hover { background: rgba(3,169,244,0.08); }
  .ed-extra-header {
    display: grid;
    grid-template-columns: 1fr 1fr 36px 28px;
    gap: 6px;
    padding: 0 8px 4px;
    font-size: 0.75em;
    color: var(--secondary-text-color);
    font-weight: 500;
  }
  /* Fallback outlined text field (mirrors MDC outlined style) */
  .mdc-field {
    position: relative;
    width: 100%;
    margin-top: 4px;
  }
  .mdc-field input {
    width: 100%;
    box-sizing: border-box;
    height: 56px;
    padding: 20px 16px 6px;
    border: 1px solid var(--outline-color, rgba(128,128,128,0.5));
    border-radius: 4px;
    background: transparent;
    color: var(--primary-text-color);
    font-size: 1rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
    caret-color: var(--primary-color, #03a9f4);
  }
  .mdc-field input:focus {
    border: 2px solid var(--primary-color, #03a9f4);
    padding: 20px 15px 6px;
  }
  .mdc-field label {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1rem;
    color: var(--secondary-text-color);
    pointer-events: none;
    transition: top 0.15s, font-size 0.15s, color 0.15s, transform 0.15s;
    padding: 0 2px;
    background: var(--card-background-color, #fff);
  }
  .mdc-field input:focus ~ label,
  .mdc-field input:not(:placeholder-shown) ~ label {
    top: 0;
    transform: translateY(-50%);
    font-size: 0.75rem;
    color: var(--primary-color, #03a9f4);
  }
</style>
<div class="ed">
  <div class="ed-section">
    <label class="ed-lbl">Entity</label>
    <div id="entity-slot"></div>
  </div>

  <div class="ed-section">
    <label class="ed-lbl">Card Title (optional)</label>
    <input id="title-inp" class="ed-input" type="text" placeholder="e.g. Living Room TV" value="${this._esc(this._config.title || "")}">
  </div>

  <hr class="ed-divider">

  <div class="ed-section">
    <label class="ed-lbl">Hidden Button Groups</label>
    ${GROUP_DEFS.map(g => `
      <label class="ed-check-row">
        <input type="checkbox" data-grp="${g.id}" ${hidden.includes(g.id) ? "checked" : ""}>
        <span>${g.label}</span>
      </label>`).join("")}
  </div>

  <hr class="ed-divider">

  <div class="ed-section">
    <label class="ed-lbl">Extra Buttons</label>
    <div class="ed-extra-header">
      <span>Label</span><span>Command</span><span>Color</span><span></span>
    </div>
    <div id="extra-list">${extra.map((b, i) => this._extraHtml(b, i)).join("")}</div>
    <button class="ed-btn-add" id="btn-add">＋ Add Button</button>
  </div>
</div>`;

    // Native entity picker — must be appended to DOM before setting properties
    this._entityPicker = document.createElement("ha-entity-picker");
    this.querySelector("#entity-slot").appendChild(this._entityPicker);
    this._entityPicker.hass = this._hass;
    this._entityPicker.value = this._config.entity || "";
    this._entityPicker.includeDomains = ["remote"];
    this._entityPicker.allowCustomEntity = true;
    this._entityPicker.addEventListener("value-changed", e => {
      this._emit({ ...this._config, entity: e.detail.value });
    });

    // Title
    this.querySelector("#title-inp").addEventListener("change", e => {
      const val = e.target.value.trim();
      const c = { ...this._config };
      if (val) c.title = val; else delete c.title;
      this._emit(c);
    });

    // Group checkboxes
    this.querySelectorAll("[data-grp]").forEach(cb => {
      cb.addEventListener("change", () => {
        const hidden = [...this.querySelectorAll("[data-grp]:checked")].map(el => el.dataset.grp);
        this._emit({ ...this._config, hidden_groups: hidden.length ? hidden : [] });
      });
    });

    // Add button
    this.querySelector("#btn-add").addEventListener("click", () => {
      const extra = [...(this._config.extra_buttons || []), { label: "", command: "", color: "#607d8b" }];
      this._config = { ...this._config, extra_buttons: extra };
      this._rebuildExtra();
      this._emit(this._config);
    });

    this._bindExtra();
  }

  _extraHtml(b, i) {
    return `<div class="ed-extra-item" data-i="${i}">
      <input data-f="label"   placeholder="Label"   value="${this._esc(b.label   || "")}" title="Text shown on the button">
      <input data-f="command" placeholder="Command" value="${this._esc(b.command || "")}" title="Command sent to remote.send_command">
      <input data-f="color"   type="color"          value="${b.color || "#607d8b"}"        title="Button background colour">
      <button class="ed-btn-rm" title="Remove">✕</button>
    </div>`;
  }

  _rebuildExtra() {
    const list = this.querySelector("#extra-list");
    if (!list) return;
    list.innerHTML = (this._config.extra_buttons || []).map((b, i) => this._extraHtml(b, i)).join("");
    this._bindExtra();
  }

  _bindExtra() {
    this.querySelectorAll(".ed-extra-item").forEach(row => {
      const i = parseInt(row.dataset.i);
      const update = () => {
        const extra = [...(this._config.extra_buttons || [])];
        extra[i] = {
          label:   row.querySelector("[data-f=label]").value.trim(),
          command: row.querySelector("[data-f=command]").value.trim(),
          color:   row.querySelector("[data-f=color]").value,
        };
        this._config = { ...this._config, extra_buttons: extra };
        this._emit(this._config);
      };
      row.querySelectorAll("input").forEach(inp => inp.addEventListener("change", update));
      row.querySelector(".ed-btn-rm").addEventListener("click", () => {
        const extra = [...(this._config.extra_buttons || [])];
        extra.splice(i, 1);
        this._config = { ...this._config, extra_buttons: extra };
        this._rebuildExtra();
        this._emit(this._config);
      });
    });
  }

  _syncValues() {
    if (this._entityPicker) this._entityPicker.value = this._config.entity || "";
    const titleEl = this.querySelector("#title-inp");
    if (titleEl) titleEl.value = this._config.title || "";
    const hidden = this._config.hidden_groups || [];
    this.querySelectorAll("[data-grp]").forEach(cb => {
      cb.checked = hidden.includes(cb.dataset.grp);
    });
    this._rebuildExtra();
  }

  _emit(config) {
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true,
    }));
  }

  _esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}

customElements.define("tasmota-ir-remote-card-editor", TasmotaIrRemoteCardEditor);

// ── Card element ──────────────────────────────────────────────────────────────

class TasmotaIrRemoteCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass        = null;
    this._config      = null;
    this._lastKey     = null;
    this._holdTimer   = null;
    this._holdInterval= null;
  }

  // ── Lovelace API ──────────────────────────────────────────────────────────

  static getConfigElement() {
    return document.createElement("tasmota-ir-remote-card-editor");
  }

  static getStubConfig() {
    return { entity: "", hidden_groups: [], extra_buttons: [] };
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Please set 'entity' in the card config.");
    this._config = { hidden_groups: [], extra_buttons: [], ...config };
    if (this._hass) this._render(this._hass.states[this._config.entity]);
  }

  set hass(hass) {
    this._hass = hass;
    const st  = hass.states[this._config?.entity];
    const key = [
      st?.state,
      JSON.stringify(st?.attributes.configured_commands),
      JSON.stringify(st?.attributes.source_list),
      st?.attributes.source_index,
      JSON.stringify(this._config?.hidden_groups),
      JSON.stringify(this._config?.extra_buttons),
    ].join("|");
    if (key !== this._lastKey) {
      this._lastKey = key;
      this._render(st);
    }
  }

  getCardSize() { return 9; }

  // ── Command sending ───────────────────────────────────────────────────────

  _send(command) {
    if (!this._hass || !this._config) return;
    this._hass.callService("remote", "send_command", {
      entity_id: this._config.entity,
      command: String(command),
    });
  }

  // ── Hold-to-repeat ────────────────────────────────────────────────────────

  _startHold(cmd) {
    this._cancelHold();
    this._holdTimer = setTimeout(() => {
      this._holdInterval = setInterval(() => this._send(cmd), 300);
    }, 450);
  }

  _cancelHold() {
    clearTimeout(this._holdTimer);
    clearInterval(this._holdInterval);
    this._holdTimer   = null;
    this._holdInterval = null;
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  _render(entity) {
    if (!entity) {
      this.shadowRoot.innerHTML = `${this._css()}
        <ha-card>
          <div class="card-err">
            Entity not found: <code>${this._esc(this._config?.entity)}</code>
          </div>
        </ha-card>`;
      return;
    }

    const cmds        = entity.attributes.configured_commands || [];
    const sourceList  = entity.attributes.source_list        || [];
    const sourceMode  = entity.attributes.source_mode;
    const sourceIdx   = entity.attributes.source_index ?? null;
    const offline     = entity.state === "unavailable";
    const name        = this._config.title
                        || entity.attributes.friendly_name
                        || this._config.entity;

    const hidden      = new Set(this._config.hidden_groups || []);
    const extraBtns   = this._config.extra_buttons || [];

    // Commands that go in custom section: not in built-in groups, not sources, not extra_btn commands
    const extraCmds   = new Set(extraBtns.map(b => b.command).filter(Boolean));
    const customCmds  = cmds.filter(c => !KNOWN_CMDS.has(c) && !sourceList.includes(c) && !extraCmds.has(c));

    // Build body
    let body = "";
    for (const g of GROUP_DEFS) {
      if (hidden.has(g.id)) continue;
      body += this._groupHtml(g, cmds);
    }

    // Sources
    if (sourceList.length) {
      body += this._sectionLabel("Sources");
      body += `<div class="rmt-row src-row">${
        sourceList.map((s, i) => {
          const active = (sourceMode === "cycle" && i === sourceIdx) ? " src-active" : "";
          return `<button class="rmt-btn btn-src${active}" data-cmd="${this._esc(s)}" title="${this._esc(s)}">${this._esc(s)}</button>`;
        }).join("")
      }</div>`;
    }

    // Extra buttons from card config
    if (extraBtns.filter(b => b.label && b.command).length) {
      body += this._sectionLabel("My Buttons");
      body += `<div class="rmt-row">${
        extraBtns
          .filter(b => b.label && b.command)
          .map(b => {
            const style = b.color ? ` style="--btn-extra-bg:${this._esc(b.color)}"` : "";
            return `<button class="rmt-btn btn-extra" data-cmd="${this._esc(b.command)}"${style} title="${this._esc(b.command)}">${this._esc(b.label)}</button>`;
          }).join("")
      }</div>`;
    }

    // Custom commands (auto-discovered from entity, not in any other section)
    if (customCmds.length) {
      body += this._sectionLabel("Custom");
      body += `<div class="rmt-row">${
        customCmds.map(c =>
          `<button class="rmt-btn btn-src" data-cmd="${this._esc(c)}" title="${this._esc(c)}">${this._esc(c)}</button>`
        ).join("")
      }</div>`;
    }

    this.shadowRoot.innerHTML = `${this._css()}
      <ha-card>
        <div class="card-hdr">
          <div class="hdr-left">
            <span class="card-icon">📺</span>
            <span class="card-name">${this._esc(name)}</span>
          </div>
          ${offline
            ? `<span class="badge offline">Unavailable</span>`
            : `<span class="badge online">Online</span>`}
        </div>
        <div class="remote-body${offline ? " is-offline" : ""}">${body}</div>
      </ha-card>`;

    // Wire click (+ hold-to-repeat) handlers
    this.shadowRoot.querySelectorAll("[data-cmd]").forEach(el => {
      const cmd = el.dataset.cmd;

      el.addEventListener("click", () => this._send(cmd));

      if (HOLD_CMDS.has(cmd)) {
        el.addEventListener("pointerdown",   () => this._startHold(cmd));
        el.addEventListener("pointerup",     () => this._cancelHold());
        el.addEventListener("pointercancel", () => this._cancelHold());
        el.addEventListener("pointerleave",  () => this._cancelHold());
      }
    });
  }

  // ── Group renderers ───────────────────────────────────────────────────────

  _groupHtml(group, cmds) {
    const vis = group.layout === "dpad" || group.layout === "keypad"
      ? group.buttons
      : group.buttons.filter(b => b && cmds.includes(b.cmd));

    const hasAny = group.buttons.some(b => b && cmds.includes(b.cmd));
    if (!hasAny) return "";

    switch (group.layout) {
      case "power":  return this._renderPower(vis.filter(b => b && cmds.includes(b.cmd)));
      case "dpad":   return this._renderDpad(group.buttons, cmds);
      case "keypad": return this._renderKeypad(group.buttons, cmds);
      default:       return this._renderRow(vis.filter(b => b && cmds.includes(b.cmd)));
    }
  }

  _renderPower(vis) {
    if (!vis.length) return "";
    if (vis.length === 1 && vis[0].cmd === "power") {
      return `<div class="rmt-row">
        <button class="rmt-btn btn-power btn-power-pill" data-cmd="power">⏻ POWER</button>
      </div>`;
    }
    return `<div class="rmt-row">${
      vis.map(b => `<button class="rmt-btn btn-power" data-cmd="${b.cmd}">${b.label}</button>`).join("")
    }</div>`;
  }

  _renderRow(vis) {
    if (!vis.length) return "";
    return `<div class="rmt-row">${
      vis.map(b => {
        const inner = b.icon
          ? `<span class="b-icon">${b.icon}</span><span class="b-lbl">${b.label || ""}</span>`
          : `<span class="b-lbl">${b.label || b.cmd}</span>`;
        const cls   = "rmt-btn" + (b.cls ? " " + b.cls : "") + (HOLD_CMDS.has(b.cmd) ? " hold-capable" : "");
        const title = b.title || b.label || b.cmd;
        return `<button class="${cls}" data-cmd="${b.cmd}" title="${title}">${inner}</button>`;
      }).join("")
    }</div>`;
  }

  _renderDpad(allBtns, cmds) {
    const m = {};
    allBtns.forEach(b => { if (b) m[b.pos] = b; });
    const cell = pos => {
      const b = m[pos];
      if (!b || !cmds.includes(b.cmd)) return `<div class="dpad-void"></div>`;
      const extra = b.cmd === "ok" ? " dpad-ok" : " dpad-arrow";
      return `<button class="rmt-btn${extra}" data-cmd="${b.cmd}">${b.icon || b.label}</button>`;
    };
    return `<div class="dpad-wrap">
      <div class="dpad-row">${cell("top")}</div>
      <div class="dpad-row">${cell("left")}${cell("center")}${cell("right")}</div>
      <div class="dpad-row">${cell("bottom")}</div>
    </div>`;
  }

  _renderKeypad(allBtns, cmds) {
    if (!allBtns.some(b => b && cmds.includes(b.cmd))) return "";
    return `<div class="keypad-grid">${
      allBtns.map(b => {
        if (!b || !cmds.includes(b.cmd)) return `<div></div>`;
        return `<button class="rmt-btn kp-btn" data-cmd="${b.cmd}">${b.label}</button>`;
      }).join("")
    }</div>`;
  }

  _sectionLabel(text) {
    return `<div class="section-lbl"><span>${text}</span></div>`;
  }

  _esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  _css() {
    return `<style>
:host { display: block; }
ha-card { overflow: hidden; border-radius: 12px; }

/* ── Error ─────────────────────────────────────────────────── */
.card-err {
  padding: 20px 16px;
  color: var(--error-color, #f44336);
  font-size: 0.9em;
}
.card-err code {
  background: rgba(0,0,0,0.06);
  padding: 1px 5px;
  border-radius: 4px;
}

/* ── Header ────────────────────────────────────────────────── */
.card-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  background: linear-gradient(135deg,
    var(--primary-color, #03a9f4) 0%,
    color-mix(in srgb, var(--primary-color, #03a9f4) 80%, #000) 100%);
  color: #fff;
}
.hdr-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.card-icon { font-size: 1.3em; flex-shrink: 0; }
.card-name {
  font-size: 1.05em;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.badge {
  font-size: 0.68em;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 3px 9px;
  border-radius: 10px;
  flex-shrink: 0;
  text-transform: uppercase;
}
.badge.online  { background: rgba(255,255,255,0.2); }
.badge.offline { background: rgba(244,67,54,0.85); }

/* ── Body ──────────────────────────────────────────────────── */
.remote-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 14px 20px;
}
.remote-body.is-offline {
  pointer-events: none;
  opacity: 0.4;
}

/* ── Generic button ────────────────────────────────────────── */
.rmt-btn {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 56px;
  min-height: 46px;
  padding: 7px 13px;
  border: none;
  border-radius: 10px;
  background: var(--secondary-background-color, rgba(120,120,120,0.08));
  color: var(--primary-text-color);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85em;
  line-height: 1.2;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
  transition: background 0.12s, box-shadow 0.12s, transform 0.08s;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  overflow: hidden;
}
.rmt-btn:hover {
  background: var(--secondary-background-color, rgba(120,120,120,0.14));
  box-shadow: 0 2px 6px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
}
.rmt-btn:active {
  background: var(--primary-color, #03a9f4) !important;
  color: #fff !important;
  transform: scale(0.87);
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
/* Hold-capable buttons get a subtle indicator */
.hold-capable::after {
  content: "";
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 2px;
  border-radius: 1px;
  background: var(--primary-color, #03a9f4);
  opacity: 0.4;
}

.b-icon { font-size: 1.2em; line-height: 1; }
.b-lbl  { font-size: 0.76em; letter-spacing: 0.01em; opacity: 0.85; }

/* ── Row ───────────────────────────────────────────────────── */
.rmt-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

/* ── Power ─────────────────────────────────────────────────── */
.btn-power {
  background: var(--error-color, #e53935) !important;
  color: #fff !important;
  font-weight: 700;
  font-size: 0.92em;
  box-shadow: 0 2px 6px rgba(229,57,53,0.35);
}
.btn-power:hover  { filter: brightness(1.1); }
.btn-power:active { background: #b71c1c !important; transform: scale(0.87); }
.btn-power-pill {
  min-width: 150px;
  min-height: 50px;
  border-radius: 25px;
  font-size: 1em;
  letter-spacing: 0.06em;
}

/* ── Mute ──────────────────────────────────────────────────── */
.btn-mute {
  background: var(--warning-color, #ff8f00) !important;
  color: #fff !important;
  box-shadow: 0 2px 6px rgba(255,143,0,0.35);
}
.btn-mute:active { background: #e65100 !important; }

/* ── Color circles ─────────────────────────────────────────── */
.btn-color {
  border-radius: 50% !important;
  min-width: 44px  !important;
  min-height: 44px !important;
  width: 44px;
  height: 44px;
  padding: 0 !important;
  font-size: 1.4em;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.btn-red    { background: #e53935 !important; color: #fff !important; }
.btn-green  { background: #43a047 !important; color: #fff !important; }
.btn-yellow { background: #fdd835 !important; color: #333 !important; }
.btn-blue   { background: #1e88e5 !important; color: #fff !important; }

/* ── D-pad ─────────────────────────────────────────────────── */
.dpad-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.dpad-row  { display: flex; align-items: center; justify-content: center; gap: 6px; }
.dpad-void { width: 56px; height: 48px; }
.dpad-arrow {
  min-width: 56px !important;
  min-height: 48px !important;
  font-size: 1.15em;
  border-radius: 10px !important;
}
.dpad-ok {
  min-width: 62px !important;
  min-height: 62px !important;
  border-radius: 50% !important;
  background: var(--primary-color, #03a9f4) !important;
  color: #fff !important;
  font-weight: 700;
  font-size: 0.95em;
  box-shadow: 0 3px 8px rgba(3,169,244,0.4);
}
.dpad-ok:active { background: color-mix(in srgb, var(--primary-color, #03a9f4) 80%, #000) !important; }

/* ── Keypad ────────────────────────────────────────────────── */
.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 56px);
  gap: 7px;
}
.kp-btn {
  min-width: 56px  !important;
  min-height: 50px !important;
  font-size: 1.2em;
  font-weight: 600;
  border-radius: 8px !important;
}

/* ── Section label ─────────────────────────────────────────── */
.section-lbl {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.section-lbl::before,
.section-lbl::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--divider-color, rgba(0,0,0,0.1));
}
.section-lbl span {
  font-size: 0.68em;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  color: var(--secondary-text-color);
  white-space: nowrap;
}

/* ── Source / Custom buttons ───────────────────────────────── */
.btn-src {
  flex: 1 1 auto;
  min-width: 66px;
  max-width: 160px;
  font-size: 0.83em;
  border-radius: 8px !important;
}
.src-row { flex-wrap: wrap; }
.src-active {
  background: var(--primary-color, #03a9f4) !important;
  color: #fff !important;
  box-shadow: 0 2px 8px rgba(3,169,244,0.4);
}

/* ── Card-config extra buttons ─────────────────────────────── */
.btn-extra {
  flex: 1 1 auto;
  min-width: 66px;
  max-width: 160px;
  font-size: 0.83em;
  border-radius: 8px !important;
  background: var(--btn-extra-bg, var(--secondary-background-color, rgba(120,120,120,0.08))) !important;
  color: #fff !important;
  font-weight: 500;
}
</style>`;
  }
}

// ── Register ──────────────────────────────────────────────────────────────────

customElements.define("tasmota-ir-remote-card", TasmotaIrRemoteCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type:        "tasmota-ir-remote-card",
  name:        "Tasmota IR Remote",
  description: "Remote-control card for Tasmota IR Ready — configurable groups, extra buttons, hold-to-repeat.",
  preview:     false,
  documentationURL: "https://github.com/your-repo/tasmota-ir-ready",
});

console.info(
  `%c TASMOTA-IR-REMOTE-CARD %c v${CARD_VERSION} `,
  "background:#03a9f4;color:#fff;padding:2px 5px;border-radius:3px 0 0 3px;font-weight:700",
  "background:#e0e0e0;color:#333;padding:2px 5px;border-radius:0 3px 3px 0"
);
