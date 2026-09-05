"""Remote sensor temperature control for iFeel-capable air conditioners."""

from homeassistant.components.number import NumberDeviceClass, NumberEntity, NumberMode
from homeassistant.const import UnitOfTemperature
from homeassistant.helpers.entity import DeviceInfo

from .const import CONF_TEMP_SENSOR, CONF_TOGGLE_LIST, DATA_KEY, DEFAULT_STATE_MODE, DOMAIN


async def async_setup_entry(hass, config_entry, async_add_entities):
    """Add a temperature control when the user selects the iFeel feature."""
    config = {**config_entry.data, **config_entry.options}
    if "iFeel" not in config.get(CONF_TOGGLE_LIST, []) or config.get(CONF_TEMP_SENSOR):
        return
    climate = hass.data.get(DATA_KEY, {}).get(config_entry.entry_id)
    if climate is not None:
        async_add_entities([TasmotaSensorTemperature(climate, config_entry.entry_id)])


class TasmotaSensorTemperature(NumberEntity):
    """Temperature supplied to the AC, separate from its target temperature."""

    _attr_should_poll = False
    _attr_has_entity_name = True
    _attr_name = "iFeel Sensor Temperature"
    _attr_device_class = NumberDeviceClass.TEMPERATURE
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
    _attr_native_min_value = 0
    _attr_native_max_value = 50
    _attr_native_step = 1
    _attr_mode = NumberMode.BOX

    def __init__(self, climate, entry_id):
        self._climate = climate
        self._attr_unique_id = f"{entry_id}_SensorTemp"
        self._attr_device_info = DeviceInfo(identifiers={(DOMAIN, entry_id)})

    @property
    def native_value(self):
        return self._climate._sensor_temp

    @property
    def available(self):
        return self._climate.available

    async def async_added_to_hass(self):
        await super().async_added_to_hass()
        self._climate.register_linked_entity(self)

    async def async_set_native_value(self, value):
        await self._climate.async_set_sensor_temp(value, DEFAULT_STATE_MODE)
