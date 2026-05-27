"""The Tasmota IRHVAC climate component."""
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DATA_KEY

PLATFORMS = ["climate", "switch"]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Tasmota IRHVAC from a config entry.

    Climate is set up first so the entity is stored in hass.data before the
    switch platform tries to look it up.
    """
    await hass.config_entries.async_forward_entry_setups(entry, ["climate"])
    await hass.config_entries.async_forward_entry_setups(entry, ["switch"])
    entry.async_on_unload(entry.add_update_listener(_async_update_options))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data.get(DATA_KEY, {}).pop(entry.entry_id, None)
    return unload_ok


async def _async_update_options(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload entry when options change."""
    await hass.config_entries.async_reload(entry.entry_id)
