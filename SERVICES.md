# Services in Tasmota IRHVAC
Support for setting econo, turbo, quiet, light, filters, clean, beep and sleep via services.

Tasmota IRHVAC adds services for controlling Air Conditioner functions like the ones mentioned above. This does not mean that your AC supports every function, or that the Tasmota IRHVAC library supports every function for your AC. Use only the services supported by your device.
Newly added services are:

***tasmota_irhvac.set_econo***
with payload of:
```javascript
{econo: "on", entity_id: climate.your_climate_entity_id}
```
where *econo* can be "on" or "off" and entity_id can be your climate entity_id, like, for example, *climate.kitchen_ac*

***tasmota_irhvac.set_turbo***
with payload of:
```javascript
{turbo: "on", entity_id: climate.your_climate_entity_id}
```
where *turbo* can be "on" or "off" and entity_id can be your climate entity_id, like, for example, *climate.kitchen_ac*
***tasmota_irhvac.set_quiet***
with payload of:
```javascript
{quiet: "on", entity_id: climate.your_climate_entity_id}
```
where *quiet* can be "on" or "off" and entity_id can be your climate entity_id, like, for example, *climate.kitchen_ac*

***tasmota_irhvac.set_light***
with payload of:
```javascript
{light: "on", entity_id: climate.your_climate_entity_id}
```
where *light:* can be "on" or "off" and *entity_id:* can be your climate entity_id, like, for example, *climate.kitchen_ac*

***tasmota_irhvac.set_filters***
with payload of:
```javascript
{filters: "on", entity_id: climate.your_climate_entity_id}
```
where *filters:* can be "on" or "off" and *entity_id:* can be your climate entity_id, like, for example, *climate.kitchen_ac*
* Note that it is **filters** instead of **filter**, because "filter" is reserved word and we cannot use it.*

***tasmota_irhvac.set_clean***
with payload of:
```javascript
{clean: "on", entity_id: climate.your_climate_entity_id}
```
where *clean:* can be "on" or "off" and *entity_id:* can be your climate entity_id, like, for example, *climate.kitchen_ac*

***tasmota_irhvac.set_beep***
with payload of:
```javascript
{beep: "on", entity_id: climate.your_climate_entity_id}
```
where *beep:* can be "on" or "off" and *entity_id:* can be your climate entity_id, like, for example, *climate.kitchen_ac*

***tasmota_irhvac.set_sleep***
with payload of:
```javascript
{sleep: "-1", entity_id: climate.your_climate_entity_id}
```
where *sleep:* can be any string, that your AC supports, and *entity_id:* can be your climate entity_id, like, for example, *climate.kitchen_ac*

# Example with Template Switch
Example from **configuration.yaml**. Please, use only these services, that are supported from your AC!

```yaml
switch:
  - platform: template
    switches:
      kitchen_climate_econo:
        friendly_name: "Econo"
        value_template: "{{ is_state_attr('climate.kitchen_ac', 'econo', 'on') }}"
        turn_on:
          service: tasmota_irhvac.set_econo
          data:
            entity_id: climate.kitchen_ac
            econo: 'on'
        turn_off:
          service: tasmota_irhvac.set_econo
          data:
            entity_id: climate.kitchen_ac
            econo: 'off'
  - platform: template
    switches:
      kitchen_climate_turbo:
        friendly_name: "Turbo"
        value_template: "{{ is_state_attr('climate.kitchen_ac', 'turbo', 'on') }}"
        turn_on:
          service: tasmota_irhvac.set_turbo
          data:
            entity_id: climate.kitchen_ac
            turbo: 'on'
        turn_off:
          service: tasmota_irhvac.set_turbo
          data:
            entity_id: climate.kitchen_ac
            turbo: 'off'
  - platform: template
    switches:
      kitchen_climate_quiet:
        friendly_name: "Quiet"
        value_template: "{{ is_state_attr('climate.kitchen_ac', 'quiet', 'on') }}"
        turn_on:
          service: tasmota_irhvac.set_quiet
          data:
            entity_id: climate.kitchen_ac
            quiet: 'on'
        turn_off:
          service: tasmota_irhvac.set_quiet
          data:
            entity_id: climate.kitchen_ac
            quiet: 'off'
  - platform: template
    switches:
      kitchen_climate_light:
        friendly_name: "Light"
        value_template: "{{ is_state_attr('climate.kitchen_ac', 'light', 'on') }}"
        turn_on:
          service: tasmota_irhvac.set_light
          data:
            entity_id: climate.kitchen_ac
            light: 'on'
        turn_off:
          service: tasmota_irhvac.set_light
          data:
            entity_id: climate.kitchen_ac
            light: 'off'
  - platform: template
    switches:
      kitchen_climate_filter:
        friendly_name: "Filter"
        value_template: "{{ is_state_attr('climate.kitchen_ac', 'filters', 'on') }}"
        turn_on:
          service: tasmota_irhvac.set_filters
          data:
            entity_id: climate.kitchen_ac
            filters: 'on'
        turn_off:
          service: tasmota_irhvac.set_filters
          data:
            entity_id: climate.kitchen_ac
            filters: 'off'
  - platform: template
    switches:
      kitchen_climate_clean:
        friendly_name: "Clean"
        value_template: "{{ is_state_attr('climate.kitchen_ac', 'clean', 'on') }}"
        turn_on:
          service: tasmota_irhvac.set_clean
          data:
            entity_id: climate.kitchen_ac
            clean: 'on'
        turn_off:
          service: tasmota_irhvac.set_clean
          data:
            entity_id: climate.kitchen_ac
            clean: 'off'
  - platform: template
    switches:
      kitchen_climate_beep:
        friendly_name: "Beep"
        value_template: "{{ is_state_attr('climate.kitchen_ac', 'beep', 'on') }}"
        turn_on:
          service: tasmota_irhvac.set_beep
          data:
            entity_id: climate.kitchen_ac
            beep: 'on'
        turn_off:
          service: tasmota_irhvac.set_beep
          data:
            entity_id: climate.kitchen_ac
            beep: 'off'
  - platform: template
    switches:
      kitchen_climate_sleep:
        friendly_name: "Sleep"
        value_template: "{{ is_state_attr('climate.kitchen_ac', 'sleep', '0') }}"
        turn_on:
          service: tasmota_irhvac.set_sleep
          data:
            entity_id: climate.kitchen_ac
            sleep: '1'
        turn_off:
          service: tasmota_irhvac.set_sleep
          data:
            entity_id: climate.kitchen_ac
            sleep: '0'
```
