"""Protocol helpers for the Teknopoint/IFB GZ055BE1 AC remote."""

GZ055BE1_VENDOR_NAMES = {"TCL112AC", "TEKNOPOINT"}
GZ055BE1_MODEL_NAMES = {"2", "GZ055BE1"}

_AUTO_TEMP_BYTES = {
    22: 0xA9,
    23: 0x28,
    24: 0x07,
    25: 0x16,
    26: 0x95,
}

_FAN_BYTES = {
    "auto": 0x00,
    "low": 0x02,
    "medium": 0x03,
    "high": 0x05,
    "max": 0x05,
}

_SWINGV_BYTES = {
    "off": 0x00,
    "highest": 0x08,
    "high": 0x10,
    "middle": 0x18,
    "low": 0x20,
    "lowest": 0x28,
    "auto": 0x38,
}

_AUTO_BASE = bytes.fromhex("23CB26010064089500000000081E")
_FRAME_HEADER = bytes.fromhex("23CB26")


def is_gz055be1(vendor: object, model: object) -> bool:
    """Return whether a vendor/model pair identifies a GZ055BE1 remote."""
    return (
        str(vendor).upper() in GZ055BE1_VENDOR_NAMES
        and str(model).upper() in GZ055BE1_MODEL_NAMES
    )


def is_gz055be1_frame(protocol: object, data: bytes) -> bool:
    """Return whether decoded raw data is a GZ055BE1 frame."""
    return (
        str(protocol).upper() in GZ055BE1_VENDOR_NAMES
        and len(data) == 14
        and data.startswith(_FRAME_HEADER)
    )


def build_gz055be1_auto_frame(
    power: str,
    temperature: float,
    fan_mode: str,
    swingv: str,
    swingh: str,
    light: str,
    previous_raw: bytes | None = None,
) -> bytes:
    """Build the exact 14-byte GZ055BE1 Auto/Feel state."""
    temperature = int(round(float(temperature)))
    if temperature not in _AUTO_TEMP_BYTES:
        raise ValueError(
            f"GZ055BE1 Auto mode only supports 22-26 C, got {temperature}"
        )

    fan_mode = str(fan_mode).lower()
    if fan_mode not in _FAN_BYTES:
        raise ValueError(f"Unsupported GZ055BE1 Auto fan mode: {fan_mode}")

    swingv = str(swingv or "off").lower()
    if swingv not in _SWINGV_BYTES:
        raise ValueError(f"Unsupported GZ055BE1 vertical swing: {swingv}")

    swingh = str(swingh or "off").lower()
    if swingh not in {"off", "auto"}:
        swingh = "off"

    if previous_raw is not None and is_gz055be1_frame("TEKNOPOINT", previous_raw):
        frame = bytearray(previous_raw)
    else:
        frame = bytearray(_AUTO_BASE)

    frame[0:5] = bytes.fromhex("23CB260100")
    frame[6] = 0x08

    frame[5] = (frame[5] & ~0x04) | (0x04 if str(power).lower() == "on" else 0)
    frame[5] = (frame[5] & ~0x40) | (0x40 if str(light).lower() == "off" else 0)
    frame[7] = _AUTO_TEMP_BYTES[temperature]
    frame[8] = _FAN_BYTES[fan_mode] | _SWINGV_BYTES[swingv]
    frame[12] = (frame[12] & ~0x88) | (0x08 if swingh == "auto" else 0)
    frame[13] = sum(frame[:13]) & 0xFF
    return bytes(frame)
