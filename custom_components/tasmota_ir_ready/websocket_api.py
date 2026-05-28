"""WebSocket API for the Tasmota IRHVAC panel."""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

import voluptuous as vol
from homeassistant.components import mqtt, websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _entry_to_dict(entry) -> dict[str, Any]:
    """Flatten a config entry into a single options dict."""
    return {
        "entry_id": entry.entry_id,
        "title": entry.title,
        "options": {**entry.data, **entry.options},
    }


# ---------------------------------------------------------------------------
# get_entries
# ---------------------------------------------------------------------------

@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/get_entries"})
@websocket_api.async_response
async def ws_get_entries(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Return all tasmota_irhvac config entries with their merged options."""
    entries = [
        _entry_to_dict(entry)
        for entry in hass.config_entries.async_entries(DOMAIN)
    ]
    connection.send_result(msg["id"], entries)


# ---------------------------------------------------------------------------
# save_options
# ---------------------------------------------------------------------------

@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/save_options",
    vol.Required("entry_id"): str,
    vol.Required("options"): dict,
})
@websocket_api.async_response
async def ws_save_options(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Persist updated options for a config entry and reload it."""
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if not entry:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return

    new_opts: dict[str, Any] = dict(msg["options"])

    # Coerce numeric fields that arrive as strings from the panel
    for key in ("media_bits",):
        if key in new_opts:
            try:
                new_opts[key] = int(new_opts[key])
            except (TypeError, ValueError):
                pass
    for key in ("media_source_cycle_delay", "mqtt_delay",
                "min_temp", "max_temp", "target_temp", "away_temp",
                "precision", "temp_step"):
        if key in new_opts:
            try:
                new_opts[key] = float(new_opts[key])
            except (TypeError, ValueError):
                pass
    for key in ("keep_mode", "ignore_off_temp"):
        if key in new_opts and isinstance(new_opts[key], str):
            new_opts[key] = new_opts[key].lower() in ("true", "1", "yes", "on")
    if "media_protocol" in new_opts and new_opts["media_protocol"]:
        new_opts["media_protocol"] = str(new_opts["media_protocol"]).upper()

    hass.config_entries.async_update_entry(entry, options=new_opts)
    await hass.config_entries.async_reload(msg["entry_id"])
    connection.send_result(msg["id"], {"success": True})


# ---------------------------------------------------------------------------
# learn_ir  — subscribe to MQTT and wait for an IrReceived message
# ---------------------------------------------------------------------------

@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/learn_ir",
    vol.Required("topic"): str,
})
@websocket_api.async_response
async def ws_learn_ir(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Subscribe to a Tasmota telemetry topic and return the first IrReceived hex."""
    topic: str = msg["topic"].strip()
    if not topic:
        connection.send_result(msg["id"], {"data": None, "error": "no_topic"})
        return

    future: asyncio.Future[str] = hass.loop.create_future()

    @callback
    def _on_message(mqtt_msg: mqtt.ReceiveMessage) -> None:
        try:
            payload = json.loads(mqtt_msg.payload)
            data = payload.get("IrReceived", {}).get("Data", "")
            if data and not future.done():
                future.set_result(data)
        except Exception:
            pass

    unsub = await mqtt.async_subscribe(hass, topic, _on_message)
    try:
        result = await asyncio.wait_for(future, timeout=30.0)
        connection.send_result(msg["id"], {"data": result})
    except asyncio.TimeoutError:
        connection.send_result(msg["id"], {"data": None, "timeout": True})
    finally:
        unsub()
        if not future.done():
            future.cancel()


# ---------------------------------------------------------------------------
# send_ir  — fire a single IR code for testing
# ---------------------------------------------------------------------------

@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/send_ir",
    vol.Required("topic"): str,
    vol.Required("protocol"): str,
    vol.Required("bits"): int,
    vol.Required("data"): str,
})
@websocket_api.async_response
async def ws_send_ir(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Publish a single IRSend command via MQTT (for live testing in the panel)."""
    data: str = msg["data"].strip()
    if not data:
        connection.send_error(msg["id"], "no_data", "No IR data provided")
        return
    if not data.lower().startswith("0x"):
        data = f"0x{data}"

    payload = json.dumps({
        "Protocol": msg["protocol"].upper(),
        "Bits": int(msg["bits"]),
        "Data": data,
    })
    await mqtt.async_publish(hass, msg["topic"], payload)
    connection.send_result(msg["id"], {"success": True})


# ---------------------------------------------------------------------------
# delete_entry  — remove a config entry (and its entity) from the panel
# ---------------------------------------------------------------------------

@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/delete_entry",
    vol.Required("entry_id"): str,
})
@websocket_api.async_response
async def ws_delete_entry(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Remove a tasmota_irhvac config entry and its associated entity."""
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if not entry:
        connection.send_error(msg["id"], "not_found", "Config entry not found")
        return
    await hass.config_entries.async_remove(msg["entry_id"])
    connection.send_result(msg["id"], {"success": True})


# ---------------------------------------------------------------------------
# create_entry  — spin up a new config entry from the panel
# ---------------------------------------------------------------------------

@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/create_entry",
    vol.Required("device_type"): str,
    vol.Required("name"): str,
    vol.Required("command_topic"): str,
    vol.Optional("vendor"): str,
    vol.Optional("state_topic"): str,
})
@websocket_api.async_response
async def ws_create_entry(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Create a new tasmota_irhvac config entry via the import flow."""
    init_data: dict[str, Any] = {
        "device_type": msg["device_type"],
        "name": msg["name"],
        "command_topic": msg["command_topic"],
    }
    if "vendor" in msg and msg["vendor"]:
        init_data["vendor"] = msg["vendor"]
    if "state_topic" in msg and msg["state_topic"]:
        init_data["state_topic"] = msg["state_topic"]

    try:
        result = await hass.config_entries.flow.async_init(
            DOMAIN,
            context={"source": "import"},
            data=init_data,
        )
    except Exception as exc:  # noqa: BLE001
        connection.send_error(msg["id"], "create_failed", str(exc))
        return

    flow_type = result.get("type") if isinstance(result, dict) else getattr(result, "type", None)
    if str(flow_type) == "create_entry":
        entry = result.get("result") if isinstance(result, dict) else getattr(result, "result", None)
        connection.send_result(msg["id"], {
            "success": True,
            "entry_id": entry.entry_id if entry else None,
        })
    else:
        reason = result.get("reason", "unknown") if isinstance(result, dict) else getattr(result, "reason", "unknown")
        connection.send_error(msg["id"], "create_failed", f"Flow ended with: {reason}")


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register all WebSocket commands used by the panel."""
    websocket_api.async_register_command(hass, ws_get_entries)
    websocket_api.async_register_command(hass, ws_save_options)
    websocket_api.async_register_command(hass, ws_learn_ir)
    websocket_api.async_register_command(hass, ws_send_ir)
    websocket_api.async_register_command(hass, ws_delete_entry)
    websocket_api.async_register_command(hass, ws_create_entry)
