# Services in Tasmota IRHVAC

The integration exposes services for AC features that are not part of Home Assistant's standard climate controls.

Most users can enable feature switch entities from the integration's **Configure -> Behavior** page instead of calling these services directly. Use direct services when you need advanced automations or scripts.

Only call services for features supported by your AC and Tasmota IRHVAC protocol.

## Feature Services

### `tasmota_irhvac.set_econo`

```yaml
service: tasmota_irhvac.set_econo
data:
  entity_id: climate.your_ac
  econo: "on"
```

### `tasmota_irhvac.set_turbo`

```yaml
service: tasmota_irhvac.set_turbo
data:
  entity_id: climate.your_ac
  turbo: "on"
```

### `tasmota_irhvac.set_quiet`

```yaml
service: tasmota_irhvac.set_quiet
data:
  entity_id: climate.your_ac
  quiet: "on"
```

### `tasmota_irhvac.set_light`

```yaml
service: tasmota_irhvac.set_light
data:
  entity_id: climate.your_ac
  light: "on"
```

### `tasmota_irhvac.set_filters`

```yaml
service: tasmota_irhvac.set_filters
data:
  entity_id: climate.your_ac
  filters: "on"
```

The service uses `filters` because `filter` is reserved in Python.

### `tasmota_irhvac.set_clean`

```yaml
service: tasmota_irhvac.set_clean
data:
  entity_id: climate.your_ac
  clean: "on"
```

### `tasmota_irhvac.set_beep`

```yaml
service: tasmota_irhvac.set_beep
data:
  entity_id: climate.your_ac
  beep: "on"
```

### `tasmota_irhvac.set_sleep`

```yaml
service: tasmota_irhvac.set_sleep
data:
  entity_id: climate.your_ac
  sleep: "0"
```

`sleep` accepts the value supported by your AC protocol. `-1` is commonly used for off.

## Vane Services

### `tasmota_irhvac.set_swingv`

```yaml
service: tasmota_irhvac.set_swingv
data:
  entity_id: climate.your_ac
  swingv: "auto"
```

Supported values:

- `off`
- `auto`
- `highest`
- `high`
- `middle`
- `low`
- `lowest`

### `tasmota_irhvac.set_swingh`

```yaml
service: tasmota_irhvac.set_swingh
data:
  entity_id: climate.your_ac
  swingh: "auto"
```

Supported values:

- `off`
- `auto`
- `left max`
- `left`
- `middle`
- `right`
- `right max`
- `wide`

## State Mode

All services accept an optional `state_mode` field:

```yaml
state_mode: "SendStore"
```

Supported values:

- `SendStore`
- `StoreOnly`

`SendStore` sends the IR command and stores state. `StoreOnly` stores state without sending the IR command.
