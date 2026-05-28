[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://github.com/custom-components/hacs)

# Tasmota IR Ready

Home Assistant integration for controlling IR devices via Tasmota-compatible IR transceiver hardware. Supports **air conditioners** (climate), **media players** (TVs, AV receivers), and **generic IR remotes**.

## Supported Device Types

- **Climate** - Full AC control using Tasmota's `IRHVAC` command with bidirectional state sync
- **Media Player** - TV and AV receiver control via Tasmota's `IRSend` command
- **Remote** - Generic IR remote with named button commands via `IRSend`

## Hardware

Use a Tasmota-compatible IR transmitter/receiver device that supports the `IRHVAC` and `IRSend` commands.

<p align="center">
  <img src="/images/tasmota_homeassistant_irhub.png" alt="Tasmota IR with Home Assistant" width="480">
</p>

Tasmota configuration looks like this:

<p align="center">
  <img src="/images/tasmota_config.jpeg" alt="Tasmota configuration" width="360">
</p>

After configuring Tasmota, open the Tasmota console, point your AC remote at the IR receiver, and press a button.

If everything is configured correctly, you should see a line like this:

```javascript
{'IrReceived': {'Protocol': 'FUJITSU_AC', 'Bits': 128, 'Data': '0x0x1463001010FE09304013003008002025', 'Repeat': 0, 'IRHVAC': {'Vendor': 'FUJITSU_AC', 'Model': 1, 'Power': 'On', 'Mode': 'fan_only', 'Celsius': 'On', 'Temp': 20, 'FanSpeed': 'Auto', 'SwingV': 'Off', 'SwingH': 'Off', 'Quiet': 'Off', 'Turbo': 'Off', 'Econo': 'Off', 'Light': 'Off', 'Filter': 'Off', 'Clean': 'Off', 'Beep': 'Off', 'Sleep': -1}}}
```

If `Vendor` is not `Unknown` and you see the `IRHVAC` key, the integration can control your AC.

## Installation

### HACS

1. Add this repository as a custom HACS integration repository.
2. Install `Tasmota-IR-Ready` from HACS.
3. Restart Home Assistant.

### Manual

1. Download this repository.
2. Copy `custom_components/tasmota_ir_ready` into your Home Assistant `custom_components` folder.
3. Restart Home Assistant.

## Setup

1. Go to **Settings → Devices & services**.
2. Select **Add integration**.
3. Search for **Tasmota IR Ready**.
4. Choose your **Device Type**: Climate, Media Player, or Remote.
5. Fill in the required fields for your chosen device type.

After the integration is created, open **Configure** on the integration entry to adjust options.

---

## Climate (Air Conditioner)

Controls air conditioners using Tasmota's `IRHVAC` command. Supports full bidirectional state sync - when you use the original AC remote, Tasmota's IR receiver reports the change back to Home Assistant.

### Connection & Sensors

- **MQTT Command Topic** - topic to publish IRHVAC commands
- **MQTT State Topic** - topic to receive state updates from Tasmota
- `state_topic_2`: optional second state topic (useful to subscribe to both `tele/.../RESULT` and `stat/.../RESULT`)
- `availability_topic`: optional Tasmota LWT topic (auto-derived from the command topic if left blank)
- `temperature_sensor`: optional current-temperature sensor
- `humidity_sensor`: optional current-humidity sensor
- `power_sensor`: optional entity reflecting the AC physical power state

### AC Capabilities

Use your original AC remote and the Tasmota console to discover the values your AC supports. Cycle through all modes, fan speeds, swing positions, and feature buttons, then select only the values your AC actually reports.

**HVAC modes:**

- `heat`
- `cool`
- `heat_cool`
- `auto`
- `dry`
- `fan_only`
- `auto_fan_only`
- `fan_only_auto`

**Fan speeds:** Home Assistant standard values and Tasmota IRHVAC values. If your AC reports `min`, `medium`, and `max`, select those. Home Assistant displays `min` as `low` and `max` as `high` so climate card icons work correctly, while the integration still sends `min` and `max` to Tasmota.

**Swing options:**

- `off`
- `both`
- `vertical`
- `horizontal`
- `highest`
- `high`
- `middle`
- `low`
- `lowest`
- `left max`
- `left`
- `horizontal middle`
- `right`
- `right max`
- `wide`

`vertical`, `horizontal`, and `both` are automatic swing modes. Fixed vane positions send exact `SwingV` or `SwingH` values to Tasmota. `horizontal middle` is displayed separately to avoid conflicting with vertical `middle`, but sends `SwingH: middle` to Tasmota.

### Feature Switches

Optional switch entities for AC-specific functions:

- `SwingV`
- `SwingH`
- `Quiet`
- `Turbo`
- `Econo`
- `Light`
- `Filter`
- `Clean`
- `Beep`
- `Sleep`

Only enable switches for features your AC and Tasmota protocol support.

---

## Media Player

Controls TVs and AV receivers using Tasmota's `IRSend` command. You configure hex IR codes for each button - learned directly from your remote using the IR Manager panel.

**Supported controls:**

- Power on / off / toggle
- Volume up / down / mute
- Play / pause / play-pause toggle / stop
- Next track / previous track
- Source selection (up to 6 sources)

**Source selection modes:**

- **Direct** - each source has its own unique IR code; selecting a source sends that code immediately
- **Cycle** - a single IR code cycles through inputs; the integration tracks the current position and presses the button the right number of times to reach the target source

---

## Remote

Generic IR remote entity for use with automations, scripts, or the [Universal Remote Card](https://github.com/iablon/homeassistant-universal-remote-card). Sends named commands via the `remote.send_command` service.

**Built-in command names:**

`power`, `power_on`, `power_off`, `volume_up`, `volume_down`, `mute`, `digit_0`–`digit_9`, `up`, `down`, `left`, `right`, `ok`, `back`, `home`, `menu`, `info`, `exit`, `channel_up`, `channel_down`, `red`, `green`, `yellow`, `blue`

**Aliases:** `center` / `enter` / `select` / `dpad_center` → `ok`, `return` → `back`, `ch_up` / `ch_down`, `vol_up` / `vol_down`

Source navigation works identically to the media player - both direct and cycle modes are supported.

---

## Dashboard

Add your entities to a Home Assistant dashboard:

- **Climate** - thermostat card, tile card, or any climate-compatible card
- **Media Player** - media control card or mini media player card
- **Remote** - Universal Remote Card or button cards calling `remote.send_command`

When the original AC remote is used, a Tasmota IR receiver updates the climate state in Home Assistant automatically.
