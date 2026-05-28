/**
 * Tasmota IRHVAC – Custom Sidebar Panel
 * Vanilla JS Web Component, no build step required.
 * Registers as <tasmota-irhvac-panel>.
 */

// ---------------------------------------------------------------------------
// Field schema helpers
// ---------------------------------------------------------------------------

/** Plain text / topic field */
const f = (key, label, opts = {}) => ({ key, label, type: "text", ...opts });
/** Required plain text field */
const rf = (key, label, opts = {}) => f(key, label, { ...opts, required: true });
/** IR hex data field — shows Learn + Test buttons */
const ir = (key, label) => ({ key, label, type: "ir" });
/** Number field */
const n = (key, label, min, max, step, unit = "") => ({ key, label, type: "number", min, max, step, unit });
/** Required number field */
const rn = (key, label, min, max, step, unit = "") => ({ key, label, type: "number", min, max, step, unit, required: true });
/** Single-select custom dropdown */
const sel = (key, label, options) => ({ key, label, type: "select", options });
/** Required single-select */
const rsel = (key, label, options) => ({ key, label, type: "select", options, required: true });
/** Multi-select pill list */
const ms = (key, label, options) => ({ key, label, type: "multisel", options });
/** Required multi-select */
const rms = (key, label, options) => ({ key, label, type: "multisel", options, required: true });
/** Boolean toggle switch */
const bool = (key, label) => ({ key, label, type: "toggle" });
/** HA entity picker — shows a searchable list of entities filtered by domain */
const ent = (key, label, domain = "") => ({ key, label, type: "entity", domain });

// ---------------------------------------------------------------------------
// Option lists (climate)
// ---------------------------------------------------------------------------

const HVAC_MODE_OPTS = [
  { value: "heat",           label: "Heat" },
  { value: "cool",           label: "Cool" },
  { value: "heat_cool",      label: "Heat/Cool" },
  { value: "auto",           label: "Auto" },
  { value: "dry",            label: "Dry" },
  { value: "fan_only",       label: "Fan Only" },
  { value: "auto_fan_only",  label: "Fan Only / Auto (swapped)" },
  { value: "fan_only_auto",  label: "Auto / Fan Only (swapped)" },
];

const FAN_MODE_OPTS = [
  { value: "off",       label: "Off" },
  { value: "on",        label: "On" },
  { value: "min",       label: "Min" },
  { value: "low",       label: "Low" },
  { value: "middle",    label: "Middle" },
  { value: "medium",    label: "Medium" },
  { value: "high",      label: "High" },
  { value: "max",       label: "Max" },
  { value: "top",       label: "Top" },
  { value: "focus",     label: "Focus" },
  { value: "diffuse",   label: "Diffuse" },
  { value: "auto",      label: "Auto" },
  { value: "max_high",  label: "Max→High (Electra quirk)" },
  { value: "auto_max",  label: "Auto→Max (Electra quirk)" },
];

const SWING_MODE_OPTS = [
  { value: "off",                label: "Off" },
  { value: "both",               label: "Auto (all directions)" },
  { value: "vertical",           label: "Auto (vertical sweep)" },
  { value: "horizontal",         label: "Auto (horizontal sweep)" },
  { value: "highest",            label: "Vertical: Highest" },
  { value: "high",               label: "Vertical: High" },
  { value: "middle",             label: "Vertical: Middle" },
  { value: "low",                label: "Vertical: Low" },
  { value: "lowest",             label: "Vertical: Lowest" },
  { value: "left max",           label: "Horizontal: Left Max" },
  { value: "left",               label: "Horizontal: Left" },
  { value: "horizontal middle",  label: "Horizontal: Middle" },
  { value: "right",              label: "Horizontal: Right" },
  { value: "right max",          label: "Horizontal: Right Max" },
  { value: "wide",               label: "Horizontal: Wide" },
];

const INITIAL_MODE_OPTS = [
  { value: "off",           label: "Off" },
  { value: "heat",          label: "Heat" },
  { value: "cool",          label: "Cool" },
  { value: "heat_cool",     label: "Heat/Cool" },
  { value: "auto",          label: "Auto" },
  { value: "dry",           label: "Dry" },
  { value: "fan_only",      label: "Fan Only" },
  { value: "auto_fan_only", label: "Auto/Fan Only" },
  { value: "fan_only_auto", label: "Fan Only/Auto" },
];

const PRECISION_OPTS = [
  { value: "0.1", label: "0.1°" },
  { value: "0.5", label: "0.5°" },
  { value: "1",   label: "1°" },
];

const TEMP_STEP_OPTS = [
  { value: "0.5", label: "0.5°" },
  { value: "1",   label: "1°" },
];

const CELSIUS_OPTS = [
  { value: "on",  label: "Celsius (°C)" },
  { value: "off", label: "Fahrenheit (°F)" },
];

const TOGGLE_OPTS = [
  { value: "SwingV",  label: "Swing V" },
  { value: "SwingH",  label: "Swing H" },
  { value: "Quiet",   label: "Quiet" },
  { value: "Turbo",   label: "Turbo" },
  { value: "Econo",   label: "Econo" },
  { value: "Light",   label: "Light" },
  { value: "Filter",  label: "Filter" },
  { value: "Clean",   label: "Clean" },
  { value: "Beep",    label: "Beep" },
  { value: "Sleep",   label: "Sleep" },
];

const SWINGV_OPTS = [
  { value: "",         label: "— Not set —" },
  { value: "off",      label: "Off" },
  { value: "auto",     label: "Auto" },
  { value: "highest",  label: "Highest" },
  { value: "high",     label: "High" },
  { value: "middle",   label: "Middle" },
  { value: "low",      label: "Low" },
  { value: "lowest",   label: "Lowest" },
];

const SWINGH_OPTS = [
  { value: "",           label: "— Not set —" },
  { value: "off",        label: "Off" },
  { value: "auto",       label: "Auto" },
  { value: "left max",   label: "Left Max" },
  { value: "left",       label: "Left" },
  { value: "middle",     label: "Middle" },
  { value: "right",      label: "Right" },
  { value: "right max",  label: "Right Max" },
  { value: "wide",       label: "Wide" },
];

// ---------------------------------------------------------------------------
// Panel field definitions per device type
// ---------------------------------------------------------------------------

const SECTIONS = {
  climate: [
    {
      id: "cl_connection",
      label: "Connection",
      fields: [
        rf("name", "Device Name"),
        rf("vendor", "AC Vendor / Brand"),
        rf("command_topic", "MQTT Command Topic"),
        rf("state_topic", "MQTT State Topic"),
        f("state_topic_2", "MQTT State Topic 2 (optional)"),
        f("availability_topic", "Availability Topic (optional)"),
        n("mqtt_delay", "MQTT Delay (s)", 0, 10, 0.1, "s"),
        ent("temp_sensor", "Temperature Sensor", "sensor"),
        ent("humidity_sensor", "Humidity Sensor", "sensor"),
        ent("power_sensor", "Power Sensor", "binary_sensor"),
      ],
    },
    {
      id: "cl_capabilities",
      label: "Capabilities",
      fields: [
        rms("supported_modes", "HVAC Modes", HVAC_MODE_OPTS),
        rms("supported_fan_speeds", "Fan Speeds", FAN_MODE_OPTS),
        rms("supported_swing_list", "Swing Positions", SWING_MODE_OPTS),
        rsel("initial_operation_mode", "Initial Operation Mode", INITIAL_MODE_OPTS),
        rn("min_temp", "Min Temperature", 0, 35, 0.5, "°"),
        rn("max_temp", "Max Temperature", 15, 50, 0.5, "°"),
        rn("target_temp", "Default Target Temp", 0, 50, 0.5, "°"),
        rsel("precision", "Precision", PRECISION_OPTS),
        rsel("temp_step", "Temperature Step", TEMP_STEP_OPTS),
        rsel("celsius", "Temperature Unit", CELSIUS_OPTS),
        f("model", "AC Model Override (optional, -1 = auto)"),
        n("away_temp", "Away Temp (0 = Disabled)", 0, 35, 0.5, "°"),
      ],
    },
    {
      id: "cl_behavior",
      label: "Behavior",
      fields: [
        ms("toggle_list", "Toggle Features", TOGGLE_OPTS),
        f("sleep", "Sleep Value"),
        rsel("default_swingv", "Default Vertical Swing", SWINGV_OPTS),
        rsel("default_swingh", "Default Horizontal Swing", SWINGH_OPTS),
        bool("keep_mode", "Keep Mode on Power On"),
        bool("ignore_off_temp", "Ignore Off Temperature"),
        f("special_mode", "Special Mode (optional)"),
      ],
    },
  ],

  media_player: [
    {
      id: "mp_connection",
      label: "Connection",
      fields: [
        rf("name", "Device Name"),
        rf("command_topic", "MQTT Command Topic"),
        f("availability_topic", "Availability Topic (optional)"),
        ent("power_sensor", "State Sensor (optional)", "binary_sensor"),
        f("learn_topic", "IR Learn Topic (for learning)"),
        rf("media_protocol", "IR Protocol (e.g. NEC)"),
        rn("media_bits", "IR Bits", 1, 128, 1),
        n("mqtt_delay", "MQTT Delay (s)", 0, 5, 0.05, "s"),
      ],
    },
    {
      id: "mp_commands",
      label: "Commands",
      fields: [
        ir("media_power_data", "Power Toggle"),
        ir("media_power_on_data", "Power On"),
        ir("media_power_off_data", "Power Off"),
        ir("media_volume_up_data", "Volume Up"),
        ir("media_volume_down_data", "Volume Down"),
        ir("media_mute_data", "Mute"),
        ir("media_next_data", "Next / Channel Up"),
        ir("media_prev_data", "Previous / Channel Down"),
        ir("media_play_data", "Play"),
        ir("media_pause_data", "Pause"),
        ir("media_stop_data", "Stop"),
        ir("media_ff_data", "Fast Forward"),
        ir("media_rw_data", "Rewind"),
      ],
    },
    {
      id: "mp_sources",
      label: "Sources",
      fields: [
        { type: "section-header", label: "Cycle Source" },
        ir("media_source_cycle_data", "Cycle Button IR Code"),
        n("media_source_cycle_delay", "Cycle Delay (s)", 0, 10, 0.05, "s"),
        { type: "divider" },
        { type: "section-header", label: "Direct Sources" },
        f("media_source_1_name", "Source 1 Name", { paired: true }),
        ir("media_source_1_data", "Source 1 IR Code"),
        f("media_source_2_name", "Source 2 Name", { paired: true }),
        ir("media_source_2_data", "Source 2 IR Code"),
        f("media_source_3_name", "Source 3 Name", { paired: true }),
        ir("media_source_3_data", "Source 3 IR Code"),
        f("media_source_4_name", "Source 4 Name", { paired: true }),
        ir("media_source_4_data", "Source 4 IR Code"),
        f("media_source_5_name", "Source 5 Name", { paired: true }),
        ir("media_source_5_data", "Source 5 IR Code"),
        f("media_source_6_name", "Source 6 Name", { paired: true }),
        ir("media_source_6_data", "Source 6 IR Code"),
      ],
    },
  ],

  remote: [
    {
      id: "rm_connection",
      label: "Connection",
      fields: [
        rf("name", "Device Name"),
        rf("command_topic", "MQTT Command Topic"),
        f("availability_topic", "Availability Topic (optional)"),
        ent("power_sensor", "State Sensor (optional)", "binary_sensor"),
        f("learn_topic", "IR Learn Topic (for learning)"),
        rf("media_protocol", "IR Protocol (e.g. NEC)"),
        rn("media_bits", "IR Bits", 1, 128, 1),
        n("mqtt_delay", "MQTT Delay (s)", 0, 5, 0.05, "s"),
      ],
    },
    {
      id: "rm_power",
      label: "Power & Volume",
      fields: [
        ir("media_power_data", "Power Toggle"),
        ir("media_power_on_data", "Power On"),
        ir("media_power_off_data", "Power Off"),
        ir("media_volume_up_data", "Volume Up"),
        ir("media_volume_down_data", "Volume Down"),
        ir("media_mute_data", "Mute"),
      ],
    },
    {
      id: "rm_nav",
      label: "Navigation",
      fields: [
        ir("remote_up_data", "Up"),
        ir("remote_down_data", "Down"),
        ir("remote_left_data", "Left"),
        ir("remote_right_data", "Right"),
        ir("remote_ok_data", "OK / Center"),
        ir("remote_back_data", "Back"),
        ir("remote_home_data", "Home"),
        ir("remote_menu_data", "Menu"),
        ir("remote_info_data", "Info"),
        ir("remote_exit_data", "Exit"),
      ],
    },
    {
      id: "rm_channels",
      label: "Channels & Colors",
      fields: [
        ir("remote_channel_up_data", "Channel Up"),
        ir("remote_channel_down_data", "Channel Down"),
        ir("remote_red_data", "Red"),
        ir("remote_green_data", "Green"),
        ir("remote_yellow_data", "Yellow"),
        ir("remote_blue_data", "Blue"),
      ],
    },
    {
      id: "rm_digits",
      label: "Keypad",
      fields: [
        ir("remote_digit_0_data", "0"),
        ir("remote_digit_1_data", "1"),
        ir("remote_digit_2_data", "2"),
        ir("remote_digit_3_data", "3"),
        ir("remote_digit_4_data", "4"),
        ir("remote_digit_5_data", "5"),
        ir("remote_digit_6_data", "6"),
        ir("remote_digit_7_data", "7"),
        ir("remote_digit_8_data", "8"),
        ir("remote_digit_9_data", "9"),
      ],
    },
    {
      id: "rm_sources",
      label: "Sources",
      fields: [
        { type: "section-header", label: "Cycle Source" },
        ir("media_source_cycle_data", "Cycle Button IR Code"),
        n("media_source_cycle_delay", "Cycle Delay (s)", 0, 10, 0.05, "s"),
        { type: "divider" },
        { type: "section-header", label: "Direct Sources" },
        f("media_source_1_name", "Source 1 Name", { paired: true }),
        ir("media_source_1_data", "Source 1 IR Code"),
        f("media_source_2_name", "Source 2 Name", { paired: true }),
        ir("media_source_2_data", "Source 2 IR Code"),
        f("media_source_3_name", "Source 3 Name", { paired: true }),
        ir("media_source_3_data", "Source 3 IR Code"),
        f("media_source_4_name", "Source 4 Name", { paired: true }),
        ir("media_source_4_data", "Source 4 IR Code"),
        f("media_source_5_name", "Source 5 Name", { paired: true }),
        ir("media_source_5_data", "Source 5 IR Code"),
        f("media_source_6_name", "Source 6 Name", { paired: true }),
        ir("media_source_6_data", "Source 6 IR Code"),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Default field values — applied when an entry is first selected so newly
// created entries are immediately save-able without manual input.
// Saved entry values always override these.
// ---------------------------------------------------------------------------

const FIELD_DEFAULTS = {
  // Climate — capabilities
  supported_modes:         ["heat", "cool", "auto"],
  supported_fan_speeds:    ["auto_max", "max_high", "medium", "min"],
  supported_swing_list:    ["off", "vertical"],
  initial_operation_mode:  "off",
  min_temp:                16,
  max_temp:                30,
  target_temp:             24,
  precision:               "0.1",
  temp_step:               "0.5",
  celsius:                 "on",
  // Climate — behavior
  model:                   "-1",
  sleep:                   "-1",
  away_temp:               0,
  default_swingv:          "off",
  default_swingh:          "off",
  keep_mode:               false,
  ignore_off_temp:         false,
  toggle_list:             [],
  // Shared
  mqtt_delay:              0,
  // Media player / Remote
  media_protocol:          "NEC",
  media_bits:              32,
  media_source_cycle_delay: 0.5,
  media_source_mode:       "direct",
};

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

const CSS = `
:host {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
  background: var(--primary-background-color, #fafafa);
  color: var(--primary-text-color, #212121);
  box-sizing: border-box;
}

/* ---- top bar ---- */
.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 56px;
  background: var(--app-header-background-color, var(--primary-color, #03a9f4));
  color: var(--app-header-text-color, #fff);
  box-shadow: 0 2px 4px rgba(0,0,0,.2);
  flex-shrink: 0;
}
.topbar h1 { margin: 0; font-size: 1.1rem; font-weight: 500; flex: 1; }
.topbar button {
  background: rgba(255,255,255,.15);
  border: none; border-radius: 4px;
  color: inherit; cursor: pointer;
  padding: 6px 12px; font-size: .85rem;
}
.topbar button:hover { background: rgba(255,255,255,.28); }

/* ---- layout ---- */
.layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* ---- sidebar ---- */
.sidebar {
  width: 240px;
  min-width: 200px;
  background: var(--sidebar-background-color, var(--card-background-color, #fff));
  border-right: 1px solid var(--divider-color, #e0e0e0);
  overflow-y: auto;
  flex-shrink: 0;
}
.sidebar-section { padding: 0; }
.sidebar-section + .sidebar-section {
  border-top: 2px solid var(--divider-color, #e0e0e0);
  margin-top: 4px;
}
.sidebar-section-title {
  padding: 10px 16px 6px;
  font-size: .7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--primary-color, #03a9f4);
  background: color-mix(in srgb, var(--primary-color, #03a9f4) 8%, var(--sidebar-background-color, var(--card-background-color, #fff)));
  border-left: 3px solid var(--primary-color, #03a9f4);
}
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px 9px 22px;
  cursor: pointer;
  border-radius: 0;
  transition: background .15s;
  font-size: .9rem;
  border-left: 3px solid transparent;
}
.sidebar-item:hover { background: var(--secondary-background-color, #f5f5f5); }
.sidebar-item.active {
  background: var(--primary-color, #03a9f4);
  color: #fff;
  font-weight: 600;
  border-left-color: rgba(255,255,255,.5);
}
.sidebar-item.active:hover { background: var(--primary-color, #03a9f4); }
.sidebar-badge {
  font-size: .7rem;
  background: var(--accent-color, #ff9800);
  color: #fff;
  border-radius: 10px;
  padding: 1px 6px;
  margin-left: auto;
}

/* ---- main content ---- */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* ---- entry toolbar ---- */
.entry-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--divider-color, #e0e0e0);
  background: var(--card-background-color, #fff);
  flex-shrink: 0;
}
.entry-toolbar h2 { margin: 0; font-size: 1rem; flex: 1; }
.btn {
  border: none; border-radius: 4px; cursor: pointer;
  padding: 6px 14px; font-size: .84rem; transition: opacity .15s;
}
.btn:hover { opacity: .85; }
.btn-primary { background: var(--primary-color, #03a9f4); color: #fff; }
.btn-secondary {
  background: var(--secondary-background-color, #f0f0f0);
  color: var(--primary-text-color, #212121);
  border: 1px solid var(--divider-color, #ddd);
}
.btn-danger { background: var(--error-color, #db4437); color: #fff; }

/* ---- tabs ---- */
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--divider-color, #e0e0e0);
  background: var(--card-background-color, #fff);
  padding: 0 16px;
  overflow-x: auto;
  flex-shrink: 0;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }
.tab {
  padding: 10px 16px;
  cursor: pointer;
  font-size: .88rem;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  white-space: nowrap;
  transition: color .15s;
  color: var(--secondary-text-color, #727272);
}
.tab:hover { color: var(--primary-text-color, #212121); }
.tab.active {
  color: var(--primary-color, #03a9f4);
  border-bottom-color: var(--primary-color, #03a9f4);
  font-weight: 500;
}

/* ---- fields area ---- */
.fields-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.required-legend {
  font-size: .78rem;
  color: var(--secondary-text-color, #888);
  margin-bottom: 12px;
}
.required-star { color: var(--error-color, #db4437); font-weight: bold; margin-left: 2px; }
.field-input.field-error,
.custom-select.field-error .custom-select-trigger,
.multi-select-wrap.field-error {
  border-color: var(--error-color, #db4437) !important;
  background: color-mix(in srgb, var(--error-color, #db4437) 8%, var(--input-fill-color, #fafafa));
}
.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.field-label {
  width: 200px;
  min-width: 160px;
  font-size: .88rem;
  color: var(--secondary-text-color, #555);
  flex-shrink: 0;
}
.field-input {
  flex: 1;
  padding: 7px 10px;
  border: 1px solid var(--input-ink-color, #ccc);
  border-radius: 4px;
  background: var(--input-fill-color, #fafafa);
  color: var(--primary-text-color, #212121);
  font-size: .9rem;
  font-family: inherit;
  min-width: 0;
}
.field-input:focus {
  outline: none;
  border-color: var(--primary-color, #03a9f4);
}
.field-input.ir-field {
  font-family: monospace;
  font-size: .88rem;
  text-transform: uppercase;
}
/* ---- custom themed dropdown (replaces native select) ---- */
.custom-select {
  position: relative;
  flex: 1;
  min-width: 0;
}
.custom-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border: 1px solid var(--input-ink-color, #555);
  border-radius: 4px;
  background: var(--input-fill-color, var(--secondary-background-color, #2d2d2d));
  color: var(--primary-text-color, #e0e0e0);
  font-size: .9rem;
  cursor: pointer;
  user-select: none;
}
.custom-select-trigger:hover {
  border-color: var(--primary-color, #03a9f4);
}
.custom-select-arrow { font-size: .75rem; margin-left: 8px; flex-shrink: 0; }
.custom-select-dropdown {
  position: absolute;
  top: calc(100% + 2px);
  left: 0; right: 0;
  z-index: 200;
  background: var(--card-background-color, #2d2d2d);
  border: 1px solid var(--divider-color, #444);
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0,0,0,.4);
  overflow: hidden;
}
.custom-select-option {
  padding: 9px 12px;
  cursor: pointer;
  font-size: .9rem;
  color: var(--primary-text-color, #e0e0e0);
}
.custom-select-option:hover {
  background: var(--secondary-background-color, #3a3a3a);
}
.custom-select-option.selected {
  background: var(--primary-color, #03a9f4);
  color: #fff;
}
.field-number {
  width: 100px;
  flex: none;
}
.field-unit {
  font-size: .8rem;
  color: var(--secondary-text-color, #888);
  width: 24px;
}
.btn-icon {
  border: none; border-radius: 4px; cursor: pointer;
  padding: 6px 8px; font-size: .78rem;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-learn {
  background: var(--warning-color, #ff9800);
  color: #fff;
}
.btn-test {
  background: var(--success-color, #4caf50);
  color: #fff;
}
.btn-icon:disabled { opacity: .5; cursor: default; }

/* ---- multi-select pills ---- */
.multi-select-wrap {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  align-content: flex-start;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--input-ink-color, #555);
  border-radius: 4px;
  background: var(--input-fill-color, var(--secondary-background-color, #2a2a2a));
}
.multi-select-item {
  padding: 4px 12px;
  border-radius: 16px;
  cursor: pointer;
  font-size: .82rem;
  border: 1px solid var(--divider-color, #555);
  color: var(--secondary-text-color, #aaa);
  user-select: none;
  transition: background .12s, color .12s;
}
.multi-select-item:hover { border-color: var(--primary-color, #03a9f4); color: var(--primary-text-color, #eee); }
.multi-select-item.selected {
  background: var(--primary-color, #03a9f4);
  color: #fff;
  border-color: var(--primary-color, #03a9f4);
}

/* ---- toggle switch ---- */
.toggle-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toggle-switch {
  position: relative;
  width: 42px;
  height: 24px;
  flex-shrink: 0;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle-slider {
  position: absolute; inset: 0;
  background: var(--divider-color, #555);
  border-radius: 24px;
  cursor: pointer;
  transition: background .2s;
}
.toggle-slider:before {
  content: "";
  position: absolute;
  width: 18px; height: 18px;
  bottom: 3px; left: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform .2s;
}
.toggle-switch input:checked + .toggle-slider { background: var(--primary-color, #03a9f4); }
.toggle-switch input:checked + .toggle-slider:before { transform: translateX(18px); }
.toggle-state { font-size: .85rem; color: var(--secondary-text-color, #aaa); min-width: 28px; }

/* ---- section headers & dividers inside field list ---- */
.section-header {
  font-size: .74rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--secondary-text-color, #888);
  padding: 14px 0 6px;
  border-bottom: 1px solid var(--divider-color, #e0e0e0);
  margin-bottom: 4px;
}
.field-divider {
  border: none;
  border-top: 2px solid var(--divider-color, #e0e0e0);
  margin: 20px 0 8px;
}

/* ---- entity picker ---- */
.entity-picker {
  position: relative;
  flex: 1;
  min-width: 0;
}
.entity-picker .custom-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border: 1px solid var(--input-ink-color, #555);
  border-radius: 4px;
  background: var(--input-fill-color, var(--secondary-background-color, #2d2d2d));
  color: var(--primary-text-color, #e0e0e0);
  font-size: .9rem;
  cursor: pointer;
  user-select: none;
}
.entity-picker .custom-select-trigger:hover { border-color: var(--primary-color, #03a9f4); }
.entity-dropdown {
  position: absolute;
  top: calc(100% + 2px);
  left: 0; right: 0;
  z-index: 300;
  background: var(--card-background-color, #2d2d2d);
  border: 1px solid var(--divider-color, #444);
  border-radius: 4px;
  box-shadow: 0 4px 20px rgba(0,0,0,.45);
  flex-direction: column;
  max-height: 260px;
}
.entity-dropdown:not([hidden]) { display: flex; }
.entity-search-wrap {
  padding: 6px 8px;
  border-bottom: 1px solid var(--divider-color, #444);
  flex-shrink: 0;
}
.entity-search {
  width: 100%;
  box-sizing: border-box;
  padding: 5px 8px;
  border: 1px solid var(--input-ink-color, #555);
  border-radius: 4px;
  background: var(--input-fill-color, #1a1a1a);
  color: var(--primary-text-color, #e0e0e0);
  font-size: .85rem;
  font-family: inherit;
}
.entity-search:focus { outline: none; border-color: var(--primary-color, #03a9f4); }
.entity-list { overflow-y: auto; flex: 1; }
.entity-option {
  padding: 7px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.entity-option:hover { background: var(--secondary-background-color, #3a3a3a); }
.entity-option.selected {
  background: var(--primary-color, #03a9f4);
  color: #fff;
}
.entity-opt-name { font-size: .88rem; }
.entity-opt-id {
  font-size: .74rem;
  color: var(--secondary-text-color, #aaa);
  font-family: monospace;
}
.entity-option.selected .entity-opt-id { color: rgba(255,255,255,.75); }
.entity-option.none-opt { font-style: italic; color: var(--secondary-text-color, #888); }

/* ---- placeholder / empty ---- */
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--secondary-text-color, #888);
  gap: 12px;
  font-size: 1rem;
}
.placeholder svg { width: 64px; height: 64px; opacity: .3; }

/* ---- status bar ---- */
.statusbar {
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: .82rem;
  flex-shrink: 0;
  border-top: 1px solid var(--divider-color, #e0e0e0);
  background: var(--card-background-color, #fff);
}
.status-ok { color: var(--success-color, #4caf50); }
.status-err { color: var(--error-color, #db4437); }
.status-info { color: var(--secondary-text-color, #555); }

/* ---- modal overlay ---- */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--card-background-color, #fff);
  border-radius: 8px;
  padding: 24px;
  width: min(520px, 92vw);
  box-shadow: 0 8px 32px rgba(0,0,0,.25);
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 80vh;
}
.modal h3 { margin: 0; font-size: 1rem; }
.modal textarea {
  flex: 1;
  min-height: 200px;
  resize: vertical;
  padding: 8px;
  font-family: monospace;
  font-size: .85rem;
  border: 1px solid var(--divider-color, #ccc);
  border-radius: 4px;
  background: var(--input-fill-color, #fafafa);
  color: var(--primary-text-color, #212121);
}
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }

/* ---- learning overlay ---- */
.learn-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
}
.learn-card {
  background: var(--card-background-color, #fff);
  border-radius: 12px;
  padding: 32px;
  width: min(380px, 90vw);
  text-align: center;
  box-shadow: 0 8px 40px rgba(0,0,0,.3);
}
.learn-card h3 { margin: 0 0 8px; font-size: 1.1rem; }
.learn-card p { margin: 0 0 20px; color: var(--secondary-text-color, #666); font-size: .9rem; }
.learn-spinner {
  width: 48px; height: 48px;
  border: 4px solid var(--divider-color, #eee);
  border-top-color: var(--primary-color, #03a9f4);
  border-radius: 50%;
  animation: spin .8s linear infinite;
  margin: 0 auto 20px;
}
@keyframes spin { to { transform: rotate(360deg); } }
`;

// ---------------------------------------------------------------------------
// Web Component
// ---------------------------------------------------------------------------

class TasmotaIrhvacPanel extends HTMLElement {
  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: "open" });
    this._hass = null;
    this._entries = [];
    this._selected = null; // { entry_id, title, options }
    this._editValues = {}; // live-edited field values
    this._activeTab = null;
    this._statusTimer = null;
    this._learning = false; // currently showing learn overlay?
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._booted) {
      this._booted = true;
      this._boot();
    }
  }

  // -----------------------------------------------------------------------
  // Boot
  // -----------------------------------------------------------------------

  async _boot() {
    this._shadow.innerHTML = `<style>${CSS}</style><div class="loading" style="padding:32px">Loading…</div>`;
    await this._loadEntries();
    this._render();
  }

  async _loadEntries() {
    try {
      this._entries = await this._hass.callWS({ type: "tasmota_ir_ready/get_entries" });
    } catch (e) {
      this._entries = [];
      console.error("tasmota_ir_ready panel: failed to load entries", e);
    }
  }

  // -----------------------------------------------------------------------
  // Entry selection
  // -----------------------------------------------------------------------

  _selectEntry(entry) {
    this._selected = entry;
    // Merge defaults first so new entries are immediately save-able,
    // then override with any values the entry already has saved.
    this._editValues = { ...FIELD_DEFAULTS, ...(entry.options || {}) };
    const sections = this._getSections();
    this._activeTab = sections.length ? sections[0].id : null;
    this._render();
  }

  _getSections() {
    if (!this._selected) return [];
    const dt = this._selected.options?.device_type || "climate";
    return SECTIONS[dt] || SECTIONS.climate;
  }

  _getFieldValue(key) {
    if (key in this._editValues) return this._editValues[key] ?? "";
    return this._selected?.options?.[key] ?? "";
  }

  _setFieldValue(key, value) {
    this._editValues[key] = value;
  }

  // -----------------------------------------------------------------------
  // Save
  // -----------------------------------------------------------------------

  async _saveEntry() {
    if (!this._selected) return;
    // --- Validate required fields across ALL sections ---
    const sections = this._getSections();
    const missingFields = [];
    let firstMissingTab = null;
    for (const section of sections) {
      for (const fld of section.fields) {
        if (!fld.required) continue;
        const val = this._editValues[fld.key] ?? this._selected?.options?.[fld.key] ?? "";
        const isEmpty = val === "" || val === null || val === undefined ||
                        (typeof val === "string" && !val.trim()) ||
                        (Array.isArray(val) && val.length === 0);
        if (isEmpty) {
          missingFields.push(fld.label);
          if (!firstMissingTab) firstMissingTab = section.id;
        }
      }
    }
    if (missingFields.length) {
      // Switch to the tab containing the first missing field
      if (firstMissingTab && firstMissingTab !== this._activeTab) {
        this._activeTab = firstMissingTab;
        this._render();
      }
      // Highlight missing inputs
      missingFields.forEach(label => {
        const section = sections.find(s => s.fields.some(f => f.label === label && f.required));
        const fld = section?.fields.find(f => f.label === label && f.required);
        if (fld) {
          const row = this._shadow.querySelector(`[data-field-key="${fld.key}"]`);
          const input = row?.querySelector("[data-key]");
          if (input) input.classList.add("field-error");
          const trigger = row?.querySelector(".custom-select-trigger");
          if (trigger) trigger.closest(".custom-select")?.classList.add("field-error");
          const multisel = row?.querySelector(".multi-select-wrap");
          if (multisel) multisel.classList.add("field-error");
        }
      });
      this._showStatus("err", `Required fields missing: ${missingFields.join(", ")}`);
      return;
    }

    const btn = this._shadow.querySelector("#btn-save");
    if (btn) btn.disabled = true;
    try {
      // Auto-detect source mode: cycle if cycle data is set, otherwise direct
      const cycleData = (this._editValues["media_source_cycle_data"] || "").trim();
      this._editValues["media_source_mode"] = cycleData ? "cycle" : "direct";

      await this._hass.callWS({
        type: "tasmota_ir_ready/save_options",
        entry_id: this._selected.entry_id,
        options: { ...this._editValues },
      });
      // Reload entries to get fresh data after HA reloads the entry
      await this._loadEntries();
      const updated = this._entries.find(e => e.entry_id === this._selected.entry_id);
      if (updated) {
        this._selected = updated;
        this._editValues = { ...FIELD_DEFAULTS, ...(updated.options || {}) };
      }
      this._render();
      this._showStatus("ok", "Saved and reloaded.");
    } catch (e) {
      this._showStatus("err", `Save failed: ${e.message || e}`);
      if (btn) btn.disabled = false;
    }
  }

  // -----------------------------------------------------------------------
  // Delete
  // -----------------------------------------------------------------------

  _deleteEntry() {
    if (!this._selected) return;
    const entry = this._selected;

    // Confirmation dialog
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal" style="max-width:420px">
        <h3>Delete Device</h3>
        <p style="margin:0;font-size:.9rem;color:var(--secondary-text-color,#666)">
          Are you sure you want to delete <strong>${this._escHtml(entry.title)}</strong>?<br>
          This will remove the HA entity permanently.
        </p>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="del-cancel">Cancel</button>
          <button class="btn btn-danger" id="del-confirm">Delete</button>
        </div>
      </div>`;
    this._shadow.appendChild(overlay);

    overlay.querySelector("#del-cancel").addEventListener("click", () => overlay.remove());
    overlay.querySelector("#del-confirm").addEventListener("click", async () => {
      const btn = overlay.querySelector("#del-confirm");
      btn.disabled = true;
      btn.textContent = "Deleting…";
      try {
        await this._hass.callWS({
          type: "tasmota_ir_ready/delete_entry",
          entry_id: entry.entry_id,
        });
        overlay.remove();
        this._selected = null;
        this._editValues = {};
        this._activeTab = null;
        await this._loadEntries();
        this._render();
        this._showStatus("ok", `"${entry.title}" deleted.`);
      } catch (e) {
        overlay.remove();
        this._showStatus("err", `Delete failed: ${e.message || e}`);
      }
    });
  }

  // -----------------------------------------------------------------------
  // Export / Import
  // -----------------------------------------------------------------------

  _exportEntry() {
    if (!this._selected) return;
    const data = JSON.stringify(
      { title: this._selected.title, options: this._editValues },
      null, 2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${this._selected.title.replace(/\s+/g, "_")}_ir.json`;
    a.click();
    URL.revokeObjectURL(url);
    this._showStatus("ok", "Exported.");
  }

  _openAddDialog() {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <h3>Add New IR Device</h3>
        <div class="field-row">
          <span class="field-label">Device Type</span>
          <div class="custom-select" style="flex:1" id="add-type-wrap">
            <input type="hidden" id="add-type" value="climate">
            <div class="custom-select-trigger" tabindex="0" id="add-type-trigger">
              <span class="custom-select-label">Climate (HVAC)</span>
              <span class="custom-select-arrow">▾</span>
            </div>
            <div class="custom-select-dropdown" hidden id="add-type-dropdown">
              <div class="custom-select-option" data-value="media_player">Media Player</div>
              <div class="custom-select-option" data-value="remote">Remote</div>
              <div class="custom-select-option selected" data-value="climate">Climate (HVAC)</div>
            </div>
          </div>
        </div>
        <div class="field-row">
          <span class="field-label">Name <span class="required-star">*</span></span>
          <input type="text" class="field-input" id="add-name" placeholder="Living Room AC" autocomplete="off">
        </div>
        <div class="field-row">
          <span class="field-label">Command Topic <span class="required-star">*</span></span>
          <input type="text" class="field-input" id="add-topic" placeholder="cmnd/tasmota_ir/IRHVAC" autocomplete="off">
        </div>
        <div id="add-climate-fields">
          <div class="field-row">
            <span class="field-label">AC Brand <span class="required-star">*</span></span>
            <input type="text" class="field-input" id="add-vendor" placeholder="e.g. DAIKIN" autocomplete="off">
          </div>
          <div class="field-row">
            <span class="field-label">MQTT State Topic <span class="required-star">*</span></span>
            <input type="text" class="field-input" id="add-state-topic" placeholder="stat/tasmota_ir/RESULT" autocomplete="off">
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="add-cancel">Cancel</button>
          <button class="btn btn-primary" id="add-ok">Create</button>
        </div>
      </div>`;
    this._shadow.appendChild(overlay);

    const nameInput = overlay.querySelector("#add-name");
    const climateFields = overlay.querySelector("#add-climate-fields");
    nameInput.focus();

    const _toggleClimateFields = (type) => {
      climateFields.style.display = type === "climate" ? "" : "none";
    };

    // Wire up the Add dialog's custom device-type dropdown
    const addTrigger = overlay.querySelector("#add-type-trigger");
    const addDropdown = overlay.querySelector("#add-type-dropdown");
    const addHidden = overlay.querySelector("#add-type");
    addTrigger.addEventListener("click", e => {
      e.stopPropagation();
      addDropdown.hidden = !addDropdown.hidden;
    });
    addDropdown.querySelectorAll(".custom-select-option").forEach(opt => {
      opt.addEventListener("click", e => {
        e.stopPropagation();
        addHidden.value = opt.dataset.value;
        addTrigger.querySelector(".custom-select-label").textContent = opt.textContent;
        addDropdown.querySelectorAll(".custom-select-option").forEach(o => o.classList.remove("selected"));
        opt.classList.add("selected");
        addDropdown.hidden = true;
        _toggleClimateFields(opt.dataset.value);
      });
    });
    overlay.addEventListener("click", () => { addDropdown.hidden = true; });

    overlay.querySelector("#add-cancel").addEventListener("click", () => overlay.remove());
    overlay.querySelector("#add-ok").addEventListener("click", async () => {
      const deviceType = overlay.querySelector("#add-type").value;
      const name = overlay.querySelector("#add-name").value.trim();
      const topic = overlay.querySelector("#add-topic").value.trim();
      const vendor = overlay.querySelector("#add-vendor").value.trim();
      const stateTopic = overlay.querySelector("#add-state-topic").value.trim();

      if (!name) { nameInput.focus(); return; }
      if (deviceType === "climate" && !vendor) {
        overlay.querySelector("#add-vendor").focus(); return;
      }
      if (deviceType === "climate" && !stateTopic) {
        overlay.querySelector("#add-state-topic").focus(); return;
      }

      const btn = overlay.querySelector("#add-ok");
      btn.disabled = true;
      btn.textContent = "Creating…";
      try {
        const wsMsg = {
          type: "tasmota_ir_ready/create_entry",
          device_type: deviceType,
          name,
          command_topic: topic,
        };
        if (deviceType === "climate") {
          wsMsg.vendor = vendor;
          wsMsg.state_topic = stateTopic;
        }
        const res = await this._hass.callWS(wsMsg);
        overlay.remove();

        // Immediately persist all FIELD_DEFAULTS so the HA entity is fully
        // configured without requiring a manual Save.
        btn.textContent = "Applying defaults…";
        const initialOptions = {
          ...FIELD_DEFAULTS,
          device_type: deviceType,
          name,
          command_topic: topic,
        };
        if (deviceType === "climate") {
          initialOptions.vendor = vendor;
          initialOptions.state_topic = stateTopic;
        }
        await this._hass.callWS({
          type: "tasmota_ir_ready/save_options",
          entry_id: res.entry_id,
          options: initialOptions,
        });

        await this._loadEntries();
        const newEntry = this._entries.find(e => e.entry_id === res.entry_id);
        if (newEntry) this._selectEntry(newEntry);
        else this._render();
        this._showStatus("ok", `"${name}" created with all defaults applied.`);
      } catch (e) {
        btn.disabled = false;
        btn.textContent = "Create";
        this._showStatus("err", `Create failed: ${e.message || e}`);
        overlay.remove();
      }
    });
  }

  _openImportDialog() {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <h3>Import IR Config</h3>
        <p style="margin:0;font-size:.85rem;color:var(--secondary-text-color,#666)">
          Paste JSON exported from another entry, or load a file.
        </p>
        <textarea id="import-ta" placeholder='{"title":"...","options":{...}}'></textarea>
        <input type="file" id="import-file" accept=".json" style="font-size:.85rem">
        <div class="modal-actions">
          <button class="btn btn-secondary" id="import-cancel">Cancel</button>
          <button class="btn btn-primary" id="import-ok">Apply</button>
        </div>
      </div>`;
    this._shadow.appendChild(overlay);

    overlay.querySelector("#import-file").addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => { overlay.querySelector("#import-ta").value = ev.target.result; };
      reader.readAsText(file);
    });
    overlay.querySelector("#import-cancel").addEventListener("click", () => overlay.remove());
    overlay.querySelector("#import-ok").addEventListener("click", () => {
      this._doImport(overlay.querySelector("#import-ta").value);
      overlay.remove();
    });
  }

  _doImport(raw) {
    try {
      const parsed = JSON.parse(raw);
      const opts = parsed.options || parsed;
      // Merge into current edit values, skip entry-level keys
      const SKIP = ["entry_id", "title"];
      for (const [k, v] of Object.entries(opts)) {
        if (!SKIP.includes(k)) this._editValues[k] = v;
      }
      this._render();
      this._showStatus("ok", "Imported — review and Save to apply.");
    } catch (e) {
      this._showStatus("err", `Import failed: invalid JSON (${e.message})`);
    }
  }

  // -----------------------------------------------------------------------
  // IR Learning
  // -----------------------------------------------------------------------

  async _learnIr(fieldKey) {
    const topic = (this._getFieldValue("learn_topic") || "").trim();
    if (!topic) {
      this._showStatus("err", 'Set "IR Learn Topic" in the Connection tab first.');
      return;
    }
    const fieldLabel = this._findFieldLabel(fieldKey);
    this._showLearnOverlay(fieldLabel);
    try {
      const result = await this._hass.callWS({
        type: "tasmota_ir_ready/learn_ir",
        topic,
      });
      this._hideLearnOverlay();
      if (result.timeout) {
        this._showStatus("err", "No IR signal received (30 s timeout).");
      } else if (result.data) {
        this._setFieldValue(fieldKey, result.data);
        // Update the input in DOM directly for immediate feedback
        const input = this._shadow.querySelector(`[data-key="${fieldKey}"]`);
        if (input) input.value = result.data;
        this._showStatus("ok", `Learned: ${result.data}`);
      } else {
        this._showStatus("err", `Learn error: ${result.error || "unknown"}`);
      }
    } catch (e) {
      this._hideLearnOverlay();
      this._showStatus("err", `Learn failed: ${e.message || e}`);
    }
  }

  _findFieldLabel(key) {
    for (const sections of Object.values(SECTIONS)) {
      for (const sec of sections) {
        const field = sec.fields.find(f => f.key === key);
        if (field) return field.label;
      }
    }
    return key;
  }

  _showLearnOverlay(label) {
    this._learning = true;
    const ov = document.createElement("div");
    ov.id = "learn-overlay";
    ov.className = "learn-overlay";
    ov.innerHTML = `
      <div class="learn-card">
        <div class="learn-spinner"></div>
        <h3>Learning IR Code</h3>
        <p>Point your remote at the receiver and press<br><strong>${label}</strong></p>
        <p style="font-size:.8rem">Waiting up to 30 seconds…</p>
        <button class="btn btn-secondary" id="learn-cancel">Cancel</button>
      </div>`;
    this._shadow.appendChild(ov);
    ov.querySelector("#learn-cancel").addEventListener("click", () => {
      // We can't cancel the WS call mid-flight, but we can close the overlay
      this._hideLearnOverlay();
      this._showStatus("info", "Learn cancelled (result will be discarded).");
    });
  }

  _hideLearnOverlay() {
    this._learning = false;
    const ov = this._shadow.getElementById("learn-overlay");
    if (ov) ov.remove();
  }

  // -----------------------------------------------------------------------
  // IR Test
  // -----------------------------------------------------------------------

  async _testIr(fieldKey) {
    const data = (this._getFieldValue(fieldKey) || "").trim();
    if (!data) {
      this._showStatus("err", "No IR code to test. Enter a hex value first.");
      return;
    }
    const topic = (this._getFieldValue("command_topic") || "").trim();
    if (!topic) {
      this._showStatus("err", 'Set "MQTT Command Topic" in Connection tab first.');
      return;
    }
    const protocol = (this._getFieldValue("media_protocol") || "NEC").toUpperCase();
    const bits = parseInt(this._getFieldValue("media_bits") || "32", 10);
    try {
      await this._hass.callWS({
        type: "tasmota_ir_ready/send_ir",
        topic,
        protocol,
        bits,
        data,
      });
      this._showStatus("ok", `Sent ${data} (${protocol}/${bits})`);
    } catch (e) {
      this._showStatus("err", `Send failed: ${e.message || e}`);
    }
  }

  // -----------------------------------------------------------------------
  // Status bar
  // -----------------------------------------------------------------------

  _showStatus(type, text) {
    const bar = this._shadow.querySelector(".statusbar");
    if (!bar) return;
    bar.className = `statusbar status-${type}`;
    bar.textContent = text;
    clearTimeout(this._statusTimer);
    this._statusTimer = setTimeout(() => {
      if (bar) { bar.className = "statusbar status-info"; bar.textContent = ""; }
    }, 6000);
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  _render() {
    const root = this._shadow;
    root.innerHTML = `<style>${CSS}</style>${this._buildHTML()}`;
    this._attachListeners();
  }

  _buildHTML() {
    return `
      <div class="topbar">
        <h1>Tasmota IR Ready</h1>
        <button id="btn-add" title="Add new IR device">➕ Add</button>
        <button id="btn-refresh" title="Refresh entry list">⟳ Refresh</button>
      </div>
      <div class="layout">
        ${this._buildSidebar()}
        <div class="main">
          ${this._selected ? this._buildEditor() : this._buildPlaceholder()}
        </div>
      </div>
      <div class="statusbar status-info"></div>
    `;
  }

  _buildSidebar() {
    const groups = { climate: [], media_player: [], remote: [] };
    for (const entry of this._entries) {
      const dt = entry.options?.device_type || "climate";
      (groups[dt] || groups.climate).push(entry);
    }
    const labels = { climate: "Climate", media_player: "Media Player", remote: "Remote" };
    let html = '<div class="sidebar">';
    for (const [dt, entries] of Object.entries(groups)) {
      if (!entries.length) continue;
      html += `<div class="sidebar-section">
        <div class="sidebar-section-title">${labels[dt]}</div>`;
      for (const entry of entries) {
        const active = this._selected?.entry_id === entry.entry_id ? " active" : "";
        html += `<div class="sidebar-item${active}" data-entry-id="${entry.entry_id}">
          <span>${entry.title}</span>
        </div>`;
      }
      html += `</div>`;
    }
    if (!this._entries.length) {
      html += `<div style="padding:16px;font-size:.85rem;color:var(--secondary-text-color,#888)">
        No IRHVAC entries found.<br>Add one via Settings → Integrations.
      </div>`;
    }
    html += `</div>`;
    return html;
  }

  _buildPlaceholder() {
    return `<div class="placeholder">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 5h10v2H7zm0 4h10v2H7zm0 4h7v2H7zm10 5.5L20 16l-3-2.5V17h-6v2h6v2.5z"/>
      </svg>
      <span>Select an entry from the sidebar</span>
    </div>`;
  }

  _buildEditor() {
    const sections = this._getSections();
    if (!sections.length) return "<div style='padding:16px'>No sections.</div>";
    const activeTab = this._activeTab || sections[0].id;

    const tabs = sections.map(s =>
      `<div class="tab${s.id === activeTab ? " active" : ""}" data-tab="${s.id}">${s.label}</div>`
    ).join("");

    const activeSection = sections.find(s => s.id === activeTab) || sections[0];
    const hasRequired = activeSection.fields.some(fld => fld.required);
    const legend = hasRequired
      ? `<div class="required-legend"><span class="required-star">*</span> Required field</div>`
      : "";
    const fields = activeSection.fields.map(fld => this._buildField(fld)).join("");

    return `
      <div class="entry-toolbar">
        <h2>${this._selected.title}</h2>
        <button class="btn btn-secondary" id="btn-import">⬆ Import</button>
        <button class="btn btn-secondary" id="btn-export">⬇ Export</button>
        <button class="btn btn-danger" id="btn-delete" title="Delete this device">🗑 Delete</button>
        <button class="btn btn-primary" id="btn-save">💾 Save</button>
      </div>
      <div class="tabs">${tabs}</div>
      <div class="fields-area">${legend}${fields}</div>
    `;
  }

  _buildField(field) {
    // Non-input structural elements
    if (field.type === "section-header") {
      return `<div class="section-header">${field.label}</div>`;
    }
    if (field.type === "divider") {
      return `<hr class="field-divider">`;
    }

    const value = this._getFieldValue(field.key);
    const star = field.required ? `<span class="required-star" title="Required">*</span>` : "";
    let inputHtml;

    if (field.type === "multisel") {
      const current = Array.isArray(value) ? value : [];
      const star = field.required ? `<span class="required-star" title="Required">*</span>` : "";
      const pills = field.options.map(o =>
        `<div class="multi-select-item${current.includes(o.value) ? " selected" : ""}" data-value="${o.value}">${o.label}</div>`
      ).join("");
      return `
        <div class="field-row" style="align-items:flex-start" data-field-key="${field.key}">
          <span class="field-label" style="padding-top:8px">${field.label}${star}</span>
          <div class="multi-select-wrap" data-multisel="${field.key}">${pills}</div>
        </div>`;
    }

    if (field.type === "toggle") {
      const isOn = value === true || value === "true";
      return `
        <div class="field-row">
          <span class="field-label">${field.label}</span>
          <div class="toggle-wrap" data-toggle="${field.key}">
            <label class="toggle-switch">
              <input type="checkbox" ${isOn ? "checked" : ""}>
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-state">${isOn ? "Yes" : "No"}</span>
          </div>
        </div>`;
    }

    if (field.type === "select") {
      const selectedOpt = field.options.find(o => o.value === value) || field.options[0];
      const optionsHtml = field.options.map(o =>
        `<div class="custom-select-option${o.value === value ? " selected" : ""}" data-value="${o.value}">${o.label}</div>`
      ).join("");
      inputHtml = `
        <div class="custom-select" data-select-key="${field.key}">
          <input type="hidden" data-key="${field.key}" value="${this._escHtml(value)}">
          <div class="custom-select-trigger" tabindex="0">
            <span class="custom-select-label">${selectedOpt ? selectedOpt.label : ""}</span>
            <span class="custom-select-arrow">▾</span>
          </div>
          <div class="custom-select-dropdown" hidden>${optionsHtml}</div>
        </div>`;
    } else if (field.type === "number") {
      inputHtml = `
        <input type="number" class="field-input field-number" data-key="${field.key}"
          value="${value}" min="${field.min}" max="${field.max}" step="${field.step}">
        <span class="field-unit">${field.unit}</span>`;
    } else if (field.type === "ir") {
      const hasValue = (value || "").trim().length > 0;
      inputHtml = `
        <input type="text" class="field-input ir-field" data-key="${field.key}"
          value="${this._escHtml(value)}" placeholder="0x…" autocomplete="off" spellcheck="false">
        <button class="btn-icon btn-learn" data-learn="${field.key}" title="Learn from physical remote">📡 Learn</button>
        <button class="btn-icon btn-test" data-test="${field.key}" title="Send this code now"${hasValue ? "" : " disabled"}>▶ Test</button>`;
    } else if (field.type === "entity") {
      const states = this._hass?.states || {};
      const entities = Object.values(states)
        .filter(s => !field.domain || s.entity_id.startsWith(field.domain + "."))
        .sort((a, b) => {
          const na = (a.attributes?.friendly_name || a.entity_id).toLowerCase();
          const nb = (b.attributes?.friendly_name || b.entity_id).toLowerCase();
          return na.localeCompare(nb);
        });
      const currentEntity = states[value];
      const displayLabel = currentEntity
        ? (currentEntity.attributes?.friendly_name || value)
        : (value || "— None —");
      const optionsHtml = [
        `<div class="entity-option none-opt" data-value="">— None —</div>`,
        ...entities.map(s => {
          const name = s.attributes?.friendly_name || s.entity_id;
          return `<div class="entity-option${s.entity_id === value ? " selected" : ""}" data-value="${this._escHtml(s.entity_id)}">
            <span class="entity-opt-name">${this._escHtml(name)}</span>
            <span class="entity-opt-id">${this._escHtml(s.entity_id)}</span>
          </div>`;
        }),
      ].join("");
      inputHtml = `
        <div class="entity-picker" data-entity-key="${field.key}">
          <input type="hidden" data-key="${field.key}" value="${this._escHtml(value)}">
          <div class="custom-select-trigger" tabindex="0">
            <span class="custom-select-label">${this._escHtml(displayLabel)}</span>
            <span class="custom-select-arrow">▾</span>
          </div>
          <div class="entity-dropdown" hidden>
            <div class="entity-search-wrap">
              <input type="text" class="entity-search" placeholder="Search sensors…" autocomplete="off">
            </div>
            <div class="entity-list">${optionsHtml}</div>
          </div>
        </div>`;
    } else if (field.paired) {
      // Name field paired with an IR field below — ghost buttons keep widths aligned
      inputHtml = `
        <input type="text" class="field-input" data-key="${field.key}"
          value="${this._escHtml(value)}" autocomplete="off">
        <button class="btn-icon btn-learn" style="visibility:hidden" aria-hidden="true" tabindex="-1">📡 Learn</button>
        <button class="btn-icon btn-test" style="visibility:hidden" aria-hidden="true" tabindex="-1">▶ Test</button>`;
    } else {
      inputHtml = `
        <input type="text" class="field-input" data-key="${field.key}"
          value="${this._escHtml(value)}" autocomplete="off">`;
    }

    return `
      <div class="field-row" data-field-key="${field.key}">
        <span class="field-label">${field.label}${star}</span>
        ${inputHtml}
      </div>`;
  }

  _escHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // -----------------------------------------------------------------------
  // Listeners
  // -----------------------------------------------------------------------

  _attachListeners() {
    const root = this._shadow;

    // Add
    root.getElementById("btn-add")?.addEventListener("click", () => this._openAddDialog());

    // Refresh
    root.getElementById("btn-refresh")?.addEventListener("click", async () => {
      this._showStatus("info", "Refreshing…");
      await this._loadEntries();
      this._selected = this._entries.find(e => e.entry_id === this._selected?.entry_id) || null;
      if (this._selected) this._editValues = { ...FIELD_DEFAULTS, ...(this._selected.options || {}) };
      this._render();
      this._showStatus("ok", "Refreshed.");
    });

    // Sidebar entry selection
    root.querySelectorAll(".sidebar-item[data-entry-id]").forEach(el => {
      el.addEventListener("click", () => {
        const entry = this._entries.find(e => e.entry_id === el.dataset.entryId);
        if (entry) this._selectEntry(entry);
      });
    });

    // Tabs
    root.querySelectorAll(".tab[data-tab]").forEach(el => {
      el.addEventListener("click", () => {
        // Snapshot current field values before switching tab
        this._snapshotFields();
        this._activeTab = el.dataset.tab;
        this._render();
      });
    });

    // Save
    root.getElementById("btn-save")?.addEventListener("click", () => {
      this._snapshotFields();
      this._saveEntry();
    });

    // Delete
    root.getElementById("btn-delete")?.addEventListener("click", () => this._deleteEntry());

    // Export
    root.getElementById("btn-export")?.addEventListener("click", () => {
      this._snapshotFields();
      this._exportEntry();
    });

    // Import
    root.getElementById("btn-import")?.addEventListener("click", () => this._openImportDialog());

    // Field changes (live snapshot for text/number fields)
    root.querySelectorAll("[data-key]").forEach(el => {
      el.addEventListener("change", e => {
        this._setFieldValue(e.target.dataset.key, e.target.value);
      });
      el.addEventListener("input", e => {
        this._setFieldValue(e.target.dataset.key, e.target.value);
        // Enable/disable test button when IR field changes
        if (el.classList.contains("ir-field")) {
          const testBtn = el.parentElement.querySelector(`[data-test="${e.target.dataset.key}"]`);
          if (testBtn) testBtn.disabled = !e.target.value.trim();
        }
      });
    });

    // Multi-select pills
    root.querySelectorAll(".multi-select-wrap[data-multisel]").forEach(wrap => {
      const key = wrap.dataset.multisel;
      wrap.querySelectorAll(".multi-select-item").forEach(item => {
        item.addEventListener("click", () => {
          item.classList.toggle("selected");
          const selected = [...wrap.querySelectorAll(".multi-select-item.selected")].map(i => i.dataset.value);
          this._setFieldValue(key, selected);
        });
      });
    });

    // Toggle switches
    root.querySelectorAll(".toggle-wrap[data-toggle]").forEach(wrap => {
      const key = wrap.dataset.toggle;
      const cb = wrap.querySelector("input[type=checkbox]");
      const stateLabel = wrap.querySelector(".toggle-state");
      cb.addEventListener("change", () => {
        this._setFieldValue(key, cb.checked);
        stateLabel.textContent = cb.checked ? "Yes" : "No";
      });
    });

    // Custom selects
    root.querySelectorAll(".custom-select").forEach(wrap => {
      const trigger = wrap.querySelector(".custom-select-trigger");
      const dropdown = wrap.querySelector(".custom-select-dropdown");
      const hidden = wrap.querySelector("input[type=hidden]");
      const labelEl = wrap.querySelector(".custom-select-label");

      trigger.addEventListener("click", e => {
        e.stopPropagation();
        const isOpen = !dropdown.hidden;
        // Close all others
        root.querySelectorAll(".custom-select-dropdown").forEach(d => { d.hidden = true; });
        dropdown.hidden = isOpen;
      });

      dropdown.querySelectorAll(".custom-select-option").forEach(opt => {
        opt.addEventListener("click", e => {
          e.stopPropagation();
          const val = opt.dataset.value;
          hidden.value = val;
          labelEl.textContent = opt.textContent;
          dropdown.querySelectorAll(".custom-select-option").forEach(o => o.classList.remove("selected"));
          opt.classList.add("selected");
          dropdown.hidden = true;
          this._setFieldValue(hidden.dataset.key, val);
        });
      });
    });

    // Close any open dropdown on click outside
    root.addEventListener("click", () => {
      root.querySelectorAll(".custom-select-dropdown").forEach(d => { d.hidden = true; });
      root.querySelectorAll(".entity-dropdown").forEach(d => { d.hidden = true; });
    });

    // Entity pickers
    root.querySelectorAll(".entity-picker[data-entity-key]").forEach(picker => {
      const key = picker.dataset.entityKey;
      const trigger = picker.querySelector(".custom-select-trigger");
      const dropdown = picker.querySelector(".entity-dropdown");
      const hidden = picker.querySelector("input[type=hidden]");
      const labelEl = picker.querySelector(".custom-select-label");
      const search = picker.querySelector(".entity-search");
      const list = picker.querySelector(".entity-list");

      trigger.addEventListener("click", e => {
        e.stopPropagation();
        const isOpen = !dropdown.hidden;
        // Close all other dropdowns
        root.querySelectorAll(".custom-select-dropdown").forEach(d => { d.hidden = true; });
        root.querySelectorAll(".entity-dropdown").forEach(d => { d.hidden = true; });
        if (!isOpen) {
          dropdown.hidden = false;
          search.value = "";
          // Show all options
          list.querySelectorAll(".entity-option").forEach(o => { o.style.display = ""; });
          search.focus();
        }
      });

      search.addEventListener("click", e => e.stopPropagation());
      search.addEventListener("input", () => {
        const q = search.value.toLowerCase();
        list.querySelectorAll(".entity-option").forEach(opt => {
          const text = opt.textContent.toLowerCase();
          opt.style.display = text.includes(q) ? "" : "none";
        });
      });

      list.addEventListener("click", e => {
        e.stopPropagation();
        const opt = e.target.closest(".entity-option");
        if (!opt) return;
        const val = opt.dataset.value;
        hidden.value = val;
        // Update label: show friendly name if available, else entity_id, else "— None —"
        if (val) {
          const state = this._hass?.states?.[val];
          labelEl.textContent = state?.attributes?.friendly_name || val;
        } else {
          labelEl.textContent = "— None —";
        }
        list.querySelectorAll(".entity-option").forEach(o => o.classList.remove("selected"));
        opt.classList.add("selected");
        dropdown.hidden = true;
        this._setFieldValue(key, val);
      });
    });

    // Learn buttons
    root.querySelectorAll("[data-learn]").forEach(btn => {
      btn.addEventListener("click", e => {
        this._snapshotFields();
        this._learnIr(e.currentTarget.dataset.learn);
      });
    });

    // Test buttons
    root.querySelectorAll("[data-test]").forEach(btn => {
      btn.addEventListener("click", e => {
        this._snapshotFields();
        this._testIr(e.currentTarget.dataset.test);
      });
    });
  }

  /** Read all currently rendered field inputs into _editValues. */
  _snapshotFields() {
    this._shadow.querySelectorAll("[data-key]").forEach(el => {
      this._editValues[el.dataset.key] = el.value;
    });
  }
}

customElements.define("tasmota-irhvac-panel", TasmotaIrhvacPanel);
