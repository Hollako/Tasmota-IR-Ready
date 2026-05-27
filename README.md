[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://github.com/custom-components/hacs)

# Tasmota-IRHVAC

Home Assistant integration for controlling IR air conditioners with the Tasmota `IRHVAC` command and compatible IR transceiver hardware.

This integration can control many air conditioners through a Tasmota IR transmitter/receiver. It uses the vendor, model, mode, fan, swing, temperature, and feature values reported by Tasmota's IRHVAC decoder.

## Hardware

Use a Tasmota-compatible IR transmitter/receiver device that supports the `IRHVAC` command.

<p align="center">
  <img src="/images/tasmota_homeassistant_irhub.png" alt="Tasmota IRHVAC with Home Assistant" width="480">
</p>

Tasmota configuration looks like this:

<p align="center">
  <img src="/images/tasmota_config.jpeg" alt="Tasmota configuration" width="360">
</p>

After configuring Tasmota, open the Tasmota console, point your AC remote at the IR receiver, and press the button for turning the AC on.

If everything is configured correctly, you should see a line like this:

```javascript
{'IrReceived': {'Protocol': 'FUJITSU_AC', 'Bits': 128, 'Data': '0x0x1463001010FE09304013003008002025', 'Repeat': 0, 'IRHVAC': {'Vendor': 'FUJITSU_AC', 'Model': 1, 'Power': 'On', 'Mode': 'fan_only', 'Celsius': 'On', 'Temp': 20, 'FanSpeed': 'Auto', 'SwingV': 'Off', 'SwingH': 'Off', 'Quiet': 'Off', 'Turbo': 'Off', 'Econo': 'Off', 'Light': 'Off', 'Filter': 'Off', 'Clean': 'Off', 'Beep': 'Off', 'Sleep': -1}}}
```

If `Vendor` is not `Unknown` and you see the `IRHVAC` key, the integration should be able to control your AC.

## Installation

### HACS

1. Add this repository as a custom HACS integration repository.
2. Install `Tasmota-IRHVAC` from HACS.
3. Restart Home Assistant.

### Manual

1. Download this repository.
2. Copy `custom_components/tasmota_irhvac` into your Home Assistant `custom_components` folder.
3. Restart Home Assistant.

## Setup From The UI

1. Go to **Settings -> Devices & services**.
2. Select **Add integration**.
3. Search for **Tasmota IRHVAC**.
4. Enter the required connection fields:
   - **Name**
   - **AC Vendor / Protocol**
   - **MQTT Command Topic**
   - **MQTT State Topic**

After the integration is created, open **Configure** on the integration entry to set the rest of the options.

### Connection & Sensors

Use this page to edit MQTT topics, MQTT delay, and optional sensors:

- `state_topic_2`: optional second MQTT state topic, useful if you want to subscribe to both `tele/.../RESULT` and `stat/.../RESULT`.
- `availability_topic`: optional Tasmota LWT topic. If left blank, the integration tries to derive `tele/<device>/LWT` from the command topic.
- `temperature_sensor`: optional current-temperature sensor.
- `humidity_sensor`: optional current-humidity sensor.
- `power_sensor`: optional entity that reflects the AC physical power state.

### AC Capabilities

Use your original AC remote and the Tasmota console to discover the values your AC supports. Cycle through all modes, fan speeds, swing modes, and feature buttons, then select only the values your AC actually reports.

Supported HVAC modes include:

- `heat`
- `cool`
- `heat_cool`
- `auto`
- `dry`
- `fan_only`
- `auto_fan_only`
- `fan_only_auto`

Supported fan speeds include Home Assistant standard values and Tasmota IRHVAC values. If your AC reports `min`, `medium`, and `max`, select those values. Home Assistant displays `min` as `low` and `max` as `high` so the built-in climate card icons work correctly, while the integration still sends `min` and `max` to Tasmota.

Supported swing options include:

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

`vertical`, `horizontal`, and `both` are automatic swing modes. Fixed vane positions send exact `SwingV` or `SwingH` values to Tasmota. `horizontal middle` is displayed separately in Home Assistant to avoid conflicting with vertical `middle`, but it sends `SwingH: middle` to Tasmota.

### Behavior

Use this page to configure default behavior and optional feature switches.

Feature switches can create separate Home Assistant switch entities for AC functions such as:

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

## Dashboard

After setup, add the climate entity to a Home Assistant dashboard using a thermostat card, tile card, or any climate-compatible card.

When the original AC remote is used, a Tasmota IR receiver can also update the state in Home Assistant.