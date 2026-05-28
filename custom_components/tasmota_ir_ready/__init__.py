"""The Tasmota IRHVAC climate component."""
from pathlib import Path

from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import (
    CONF_DEVICE_TYPE,
    DATA_KEY,
    DATA_MEDIA_KEY,
    DATA_REMOTE_KEY,
    DEVICE_TYPE_CLIMATE,
    DEVICE_TYPE_MEDIA_PLAYER,
    DEVICE_TYPE_REMOTE,
    DOMAIN,
)
from .websocket_api import async_register_websocket_commands


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Register static path, sidebar panel, and WebSocket commands."""
    www_dir = Path(__file__).parent / "www"
    await hass.http.async_register_static_paths([
        StaticPathConfig(f"/{DOMAIN}_panel", str(www_dir), cache_headers=False)
    ])
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name="tasmota-irhvac-panel",
        sidebar_title="IR Manager",
        sidebar_icon="mdi:remote",
        frontend_url_path="tasmota-irhvac",
        module_url=f"/{DOMAIN}_panel/panel.js",
        embed_iframe=False,
        require_admin=False,
    )
    async_register_websocket_commands(hass)
    return True


def _entry_platforms(entry: ConfigEntry) -> list[str]:
    """Return the Home Assistant platforms needed for this entry."""
    device_type = entry.data.get(CONF_DEVICE_TYPE, DEVICE_TYPE_CLIMATE)
    if device_type == DEVICE_TYPE_MEDIA_PLAYER:
        return ["media_player"]
    if device_type == DEVICE_TYPE_REMOTE:
        return ["remote"]
    return ["climate", "switch"]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Tasmota IRHVAC from a config entry.

    Climate is set up first so the entity is stored in hass.data before the
    switch platform tries to look it up.
    """
    for platform in _entry_platforms(entry):
        await hass.config_entries.async_forward_entry_setups(entry, [platform])
    entry.async_on_unload(entry.add_update_listener(_async_update_options))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(
        entry, _entry_platforms(entry)
    )
    if unload_ok:
        hass.data.get(DATA_KEY, {}).pop(entry.entry_id, None)
        hass.data.get(DATA_MEDIA_KEY, {}).pop(entry.entry_id, None)
        hass.data.get(DATA_REMOTE_KEY, {}).pop(entry.entry_id, None)
    return unload_ok


async def _async_update_options(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload entry when options change."""
    await hass.config_entries.async_reload(entry.entry_id)
