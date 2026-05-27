"""Config flow for Tasmota IRHVAC."""
from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components.climate.const import (
    FAN_AUTO,
    FAN_DIFFUSE,
    FAN_FOCUS,
    FAN_HIGH,
    FAN_LOW,
    FAN_MEDIUM,
    FAN_MIDDLE,
    FAN_OFF,
    FAN_ON,
    FAN_TOP,
    SWING_BOTH,
    SWING_HORIZONTAL,
    SWING_OFF,
    SWING_VERTICAL,
    HVACMode,
)
from homeassistant.config_entries import ConfigEntry, ConfigFlow, OptionsFlow
from homeassistant.const import (
    CONF_NAME,
    PRECISION_HALVES,
    PRECISION_TENTHS,
    PRECISION_WHOLE,
)
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    BooleanSelector,
    EntitySelector,
    EntitySelectorConfig,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
)

from .const import (
    CONF_AVAILABILITY_TOPIC,
    CONF_AWAY_TEMP,
    CONF_CELSIUS,
    CONF_COMMAND_TOPIC,
    CONF_FAN_LIST,
    CONF_HUMIDITY_SENSOR,
    CONF_IGNORE_OFF_TEMP,
    CONF_INITIAL_OPERATION_MODE,
    CONF_KEEP_MODE,
    CONF_MAX_TEMP,
    CONF_MIN_TEMP,
    CONF_MODEL,
    CONF_MODES_LIST,
    CONF_MQTT_DELAY,
    CONF_POWER_SENSOR,
    CONF_PRECISION,
    CONF_SLEEP,
    CONF_SPECIAL_MODE,
    CONF_STATE_TOPIC,
    CONF_SWING_LIST,
    CONF_SWINGH,
    CONF_SWINGV,
    CONF_TARGET_TEMP,
    CONF_TEMP_SENSOR,
    CONF_TEMP_STEP,
    CONF_TOGGLE_LIST,
    CONF_VENDOR,
    DEFAULT_COMMAND_TOPIC,
    DEFAULT_CONF_CELSIUS,
    DEFAULT_CONF_KEEP_MODE,
    DEFAULT_CONF_MODEL,
    DEFAULT_CONF_SLEEP,
    DEFAULT_FAN_LIST,
    DEFAULT_IGNORE_OFF_TEMP,
    DEFAULT_MAX_TEMP,
    DEFAULT_MIN_TEMP,
    DEFAULT_MODES_LIST,
    DEFAULT_MQTT_DELAY,
    DEFAULT_NAME,
    DEFAULT_PRECISION,
    DEFAULT_STATE_TOPIC,
    DEFAULT_SWING_LIST,
    DEFAULT_TARGET_TEMP,
    DOMAIN,
    HVAC_FAN_AUTO_MAX,
    HVAC_FAN_MAX,
    HVAC_FAN_MAX_HIGH,
    HVAC_FAN_MIN,
    HVAC_MODE_AUTO_FAN,
    HVAC_MODE_FAN_AUTO,
    TOGGLE_ALL_LIST,
)

_CONF_STATE_TOPIC_2 = CONF_STATE_TOPIC + "_2"

# ---------------------------------------------------------------------------
# Selector option lists
# ---------------------------------------------------------------------------

HVAC_MODE_OPTIONS = [
    {"value": HVACMode.HEAT, "label": "Heat"},
    {"value": HVACMode.COOL, "label": "Cool"},
    {"value": HVACMode.HEAT_COOL, "label": "Heat/Cool"},
    {"value": HVACMode.AUTO, "label": "Auto"},
    {"value": HVACMode.DRY, "label": "Dry"},
    {"value": HVACMode.FAN_ONLY, "label": "Fan Only"},
    {"value": HVAC_MODE_AUTO_FAN, "label": "Fan Only / Auto (swapped — tasmota says auto)"},
    {"value": HVAC_MODE_FAN_AUTO, "label": "Auto / Fan Only (swapped — tasmota says fan)"},
]

FAN_MODE_OPTIONS = [
    # Speed ladder — slowest to fastest
    {"value": FAN_OFF,         "label": "Off"},
    {"value": FAN_ON,          "label": "On"},
    {"value": HVAC_FAN_MIN,    "label": "Min (shown as Low in HA)"},
    {"value": FAN_LOW,         "label": "Low"},
    {"value": FAN_MIDDLE,      "label": "Middle"},
    {"value": FAN_MEDIUM,      "label": "Medium"},
    {"value": FAN_HIGH,        "label": "High"},
    {"value": HVAC_FAN_MAX,    "label": "Max (shown as High in HA)"},
    {"value": FAN_TOP,         "label": "Top"},
    {"value": FAN_FOCUS,       "label": "Focus"},
    {"value": FAN_DIFFUSE,     "label": "Diffuse"},
    # Automatic
    {"value": FAN_AUTO,        "label": "Auto"},
    # Electra-specific quirks
    {"value": HVAC_FAN_MAX_HIGH,  "label": "Max→High (Electra quirk)"},
    {"value": HVAC_FAN_AUTO_MAX,  "label": "Auto→Max (Electra quirk)"},
]

SWING_MODE_OPTIONS = [
    {"value": SWING_OFF, "label": "Off"},
    {"value": SWING_BOTH, "label": "Auto (all directions)"},
    {"value": SWING_VERTICAL, "label": "Auto (vertical sweep)"},
    {"value": SWING_HORIZONTAL, "label": "Auto (horizontal sweep)"},
    {"value": "highest", "label": "Vertical: Highest"},
    {"value": "high", "label": "Vertical: High"},
    {"value": "middle", "label": "Vertical: Middle"},
    {"value": "low", "label": "Vertical: Low"},
    {"value": "lowest", "label": "Vertical: Lowest"},
    {"value": "left max", "label": "Horizontal: Left Max"},
    {"value": "left", "label": "Horizontal: Left"},
    {"value": "horizontal middle", "label": "Horizontal: Middle"},
    {"value": "right", "label": "Horizontal: Right"},
    {"value": "right max", "label": "Horizontal: Right Max"},
    {"value": "wide", "label": "Horizontal: Wide"},
]

INITIAL_MODE_OPTIONS = [
    {"value": HVACMode.OFF, "label": "Off"},
    {"value": HVACMode.HEAT, "label": "Heat"},
    {"value": HVACMode.COOL, "label": "Cool"},
    {"value": HVACMode.HEAT_COOL, "label": "Heat/Cool"},
    {"value": HVACMode.AUTO, "label": "Auto"},
    {"value": HVACMode.DRY, "label": "Dry"},
    {"value": HVACMode.FAN_ONLY, "label": "Fan Only"},
    {"value": HVAC_MODE_AUTO_FAN, "label": "Auto/Fan Only"},
    {"value": HVAC_MODE_FAN_AUTO, "label": "Fan Only/Auto"},
]

PRECISION_OPTIONS = [
    {"value": str(PRECISION_TENTHS), "label": "0.1°"},
    {"value": str(PRECISION_HALVES), "label": "0.5°"},
    {"value": str(PRECISION_WHOLE), "label": "1°"},
]

TEMP_STEP_OPTIONS = [
    {"value": str(PRECISION_HALVES), "label": "0.5°"},
    {"value": str(PRECISION_WHOLE), "label": "1°"},
]

CELSIUS_OPTIONS = [
    {"value": "on", "label": "Celsius (°C)"},
    {"value": "off", "label": "Fahrenheit (°F)"},
]

SWINGV_OPTIONS = [
    {"value": "", "label": "— Not set —"},
    {"value": "off", "label": "Off"},
    {"value": "auto", "label": "Auto"},
    {"value": "highest", "label": "Highest"},
    {"value": "high", "label": "High"},
    {"value": "middle", "label": "Middle"},
    {"value": "low", "label": "Low"},
    {"value": "lowest", "label": "Lowest"},
]

TOGGLE_OPTIONS = [{"value": item, "label": item} for item in TOGGLE_ALL_LIST]

SWINGH_OPTIONS = [
    {"value": "", "label": "— Not set —"},
    {"value": "off", "label": "Off"},
    {"value": "auto", "label": "Auto"},
    {"value": "left max", "label": "Left Max"},
    {"value": "left", "label": "Left"},
    {"value": "middle", "label": "Middle"},
    {"value": "right", "label": "Right"},
    {"value": "right max", "label": "Right Max"},
    {"value": "wide", "label": "Wide"},
]

# ---------------------------------------------------------------------------
# Config flow
# ---------------------------------------------------------------------------


class TasmotaIrhvacConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Tasmota IRHVAC."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> dict:
        """Initial setup step — collect the minimum required to connect."""
        errors: dict[str, str] = {}

        if user_input is not None:
            await self.async_set_unique_id(user_input[CONF_COMMAND_TOPIC])
            self._abort_if_unique_id_configured()
            return self.async_create_entry(
                title=user_input[CONF_NAME],
                data=user_input,
            )

        schema = vol.Schema(
            {
                vol.Required(CONF_NAME, default=DEFAULT_NAME): TextSelector(),
                vol.Required(CONF_VENDOR): TextSelector(),
                vol.Required(CONF_COMMAND_TOPIC, default=DEFAULT_COMMAND_TOPIC): TextSelector(),
                vol.Required(CONF_STATE_TOPIC, default=DEFAULT_STATE_TOPIC): TextSelector(),
            }
        )

        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return TasmotaIrhvacOptionsFlow(config_entry)


# ---------------------------------------------------------------------------
# Options flow  (3 steps: connection → capabilities → behavior)
# ---------------------------------------------------------------------------


class TasmotaIrhvacOptionsFlow(OptionsFlow):
    """Handle options flow for all settings."""

    def __init__(self, config_entry: ConfigEntry) -> None:
        self._entry = config_entry
        self._options: dict[str, Any] = {}

    def _current(self) -> dict[str, Any]:
        return {**self._entry.data, **self._entry.options}

    # ------------------------------------------------------------------
    # Step 1 — Connection
    # ------------------------------------------------------------------

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> dict:
        """Connection settings: topics, sensors, MQTT delay."""
        if user_input is not None:
            self._options.update(user_input)
            return await self.async_step_capabilities()

        current = self._current()

        base_schema = vol.Schema(
            {
                vol.Required(CONF_NAME, default=current.get(CONF_NAME, DEFAULT_NAME)): TextSelector(),
                vol.Required(CONF_VENDOR, default=current.get(CONF_VENDOR, "")): TextSelector(),
                vol.Required(CONF_COMMAND_TOPIC, default=current.get(CONF_COMMAND_TOPIC, DEFAULT_COMMAND_TOPIC)): TextSelector(),
                vol.Required(CONF_STATE_TOPIC, default=current.get(CONF_STATE_TOPIC, DEFAULT_STATE_TOPIC)): TextSelector(),
                vol.Optional(_CONF_STATE_TOPIC_2): TextSelector(),
                vol.Optional(CONF_AVAILABILITY_TOPIC): TextSelector(),
                vol.Optional(
                    CONF_MQTT_DELAY,
                    default=float(current.get(CONF_MQTT_DELAY, DEFAULT_MQTT_DELAY)),
                ): NumberSelector(NumberSelectorConfig(min=0, max=10, step=0.1, mode=NumberSelectorMode.BOX)),
                vol.Optional(CONF_TEMP_SENSOR): EntitySelector(
                    EntitySelectorConfig(domain="sensor")
                ),
                vol.Optional(CONF_HUMIDITY_SENSOR): EntitySelector(
                    EntitySelectorConfig(domain="sensor")
                ),
                vol.Optional(CONF_POWER_SENSOR): EntitySelector(
                    EntitySelectorConfig(domain=["binary_sensor", "sensor", "switch"])
                ),
            }
        )

        suggested = {
            _CONF_STATE_TOPIC_2: current.get(_CONF_STATE_TOPIC_2),
            CONF_AVAILABILITY_TOPIC: current.get(CONF_AVAILABILITY_TOPIC),
            CONF_TEMP_SENSOR: current.get(CONF_TEMP_SENSOR),
            CONF_HUMIDITY_SENSOR: current.get(CONF_HUMIDITY_SENSOR),
            CONF_POWER_SENSOR: current.get(CONF_POWER_SENSOR),
        }

        return self.async_show_form(
            step_id="init",
            data_schema=self.add_suggested_values_to_schema(base_schema, suggested),
        )

    # ------------------------------------------------------------------
    # Step 2 — Capabilities
    # ------------------------------------------------------------------

    async def async_step_capabilities(
        self, user_input: dict[str, Any] | None = None
    ) -> dict:
        """AC capability settings: modes, fan, swing, temperature range."""
        if user_input is not None:
            self._options.update(user_input)
            return await self.async_step_behavior()

        current = self._current()

        schema = vol.Schema(
            {
                vol.Required(
                    CONF_MODES_LIST,
                    default=current.get(CONF_MODES_LIST, DEFAULT_MODES_LIST),
                ): SelectSelector(SelectSelectorConfig(
                    options=HVAC_MODE_OPTIONS,
                    multiple=True,
                    mode=SelectSelectorMode.DROPDOWN,
                )),
                vol.Required(
                    CONF_FAN_LIST,
                    default=current.get(CONF_FAN_LIST, DEFAULT_FAN_LIST),
                ): SelectSelector(SelectSelectorConfig(
                    options=FAN_MODE_OPTIONS,
                    multiple=True,
                    mode=SelectSelectorMode.DROPDOWN,
                )),
                vol.Required(
                    CONF_SWING_LIST,
                    default=current.get(CONF_SWING_LIST, DEFAULT_SWING_LIST),
                ): SelectSelector(SelectSelectorConfig(
                    options=SWING_MODE_OPTIONS,
                    multiple=True,
                    mode=SelectSelectorMode.DROPDOWN,
                )),
                vol.Required(
                    CONF_INITIAL_OPERATION_MODE,
                    default=current.get(CONF_INITIAL_OPERATION_MODE, HVACMode.OFF),
                ): SelectSelector(SelectSelectorConfig(options=INITIAL_MODE_OPTIONS)),
                vol.Required(
                    CONF_MIN_TEMP,
                    default=float(current.get(CONF_MIN_TEMP, DEFAULT_MIN_TEMP)),
                ): NumberSelector(NumberSelectorConfig(min=0, max=35, step=0.5, mode=NumberSelectorMode.BOX)),
                vol.Required(
                    CONF_MAX_TEMP,
                    default=float(current.get(CONF_MAX_TEMP, DEFAULT_MAX_TEMP)),
                ): NumberSelector(NumberSelectorConfig(min=15, max=50, step=0.5, mode=NumberSelectorMode.BOX)),
                vol.Required(
                    CONF_TARGET_TEMP,
                    default=float(current.get(CONF_TARGET_TEMP, DEFAULT_TARGET_TEMP)),
                ): NumberSelector(NumberSelectorConfig(min=0, max=50, step=0.5, mode=NumberSelectorMode.BOX)),
                vol.Required(
                    CONF_PRECISION,
                    default=str(current.get(CONF_PRECISION, DEFAULT_PRECISION)),
                ): SelectSelector(SelectSelectorConfig(
                    options=PRECISION_OPTIONS,
                    mode=SelectSelectorMode.DROPDOWN,
                )),
                vol.Required(
                    CONF_TEMP_STEP,
                    default=str(current.get(CONF_TEMP_STEP, PRECISION_WHOLE)),
                ): SelectSelector(SelectSelectorConfig(
                    options=TEMP_STEP_OPTIONS,
                    mode=SelectSelectorMode.DROPDOWN,
                )),
                vol.Required(
                    CONF_CELSIUS,
                    default=current.get(CONF_CELSIUS, DEFAULT_CONF_CELSIUS),
                ): SelectSelector(SelectSelectorConfig(
                    options=CELSIUS_OPTIONS,
                    mode=SelectSelectorMode.DROPDOWN,
                )),
                vol.Optional(
                    CONF_MODEL,
                    default=current.get(CONF_MODEL, DEFAULT_CONF_MODEL),
                ): TextSelector(),
                vol.Optional(
                    CONF_AWAY_TEMP,
                    default=float(current.get(CONF_AWAY_TEMP) or 0),
                ): NumberSelector(NumberSelectorConfig(min=0, max=35, step=0.5, mode=NumberSelectorMode.BOX)),
            }
        )

        return self.async_show_form(step_id="capabilities", data_schema=schema)

    # ------------------------------------------------------------------
    # Step 3 — Behavior / defaults
    # ------------------------------------------------------------------

    async def async_step_behavior(
        self, user_input: dict[str, Any] | None = None
    ) -> dict:
        """Behavioral options."""
        if user_input is not None:
            self._options.update(user_input)
            return self.async_create_entry(title="", data=self._options)

        current = self._current()

        schema = vol.Schema(
            {
                vol.Optional(
                    CONF_TOGGLE_LIST,
                    default=current.get(CONF_TOGGLE_LIST, []),
                ): SelectSelector(SelectSelectorConfig(
                    options=TOGGLE_OPTIONS,
                    multiple=True,
                    mode=SelectSelectorMode.DROPDOWN,
                )),
                vol.Required(CONF_SLEEP, default=current.get(CONF_SLEEP, DEFAULT_CONF_SLEEP)): TextSelector(),
                vol.Required(
                    CONF_SWINGV,
                    default=current.get(CONF_SWINGV) or "",
                ): SelectSelector(SelectSelectorConfig(options=SWINGV_OPTIONS)),
                vol.Required(
                    CONF_SWINGH,
                    default=current.get(CONF_SWINGH) or "",
                ): SelectSelector(SelectSelectorConfig(options=SWINGH_OPTIONS)),
                vol.Required(CONF_KEEP_MODE, default=current.get(CONF_KEEP_MODE, DEFAULT_CONF_KEEP_MODE)): BooleanSelector(),
                vol.Required(CONF_IGNORE_OFF_TEMP, default=current.get(CONF_IGNORE_OFF_TEMP, DEFAULT_IGNORE_OFF_TEMP)): BooleanSelector(),
                vol.Optional(CONF_SPECIAL_MODE, default=current.get(CONF_SPECIAL_MODE, "")): TextSelector(),
            }
        )

        return self.async_show_form(step_id="behavior", data_schema=schema)
