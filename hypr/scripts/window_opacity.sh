#!/usr/bin/env bash
# Adjust the opacity of the active window (Hyprland Lua-config build).
# Usage: window_opacity.sh up|down
#
# Uses hyprctl dispatch with the Lua dispatcher API (hl.dsp.window.set_prop)
# because plain `hyprctl setprop` is not registered in this build.

step=0.1
min=0.05
max=1.0

dir="${1:-up}"

# Serialize concurrent invocations (hold-to-repeat keypresses)
exec 9>/tmp/hypr-window-opacity.lock
flock 9

# getprop returns the raw float (e.g. 1, 0.7); default to 1.0 if unset/empty
cur=$(hyprctl getprop activewindow opacity 2>/dev/null)
case "$cur" in
  ''|*[!0-9.]*) cur=1.0 ;;
esac

case "$dir" in
  up|+)
    new=$(awk -v c="$cur" -v s="$step" -v m="$max" 'BEGIN{ v=c+s; if (v>m) v=m; printf "%.2f", v }')
    ;;
  down|-)
    new=$(awk -v c="$cur" -v s="$step" -v m="$min" 'BEGIN{ v=c-s; if (v<m) v=m; printf "%.2f", v }')
    ;;
  *)
    echo "usage: $0 up|down" >&2
    exit 1
    ;;
esac

# set_prop("opacity") only affects the ACTIVE alpha; opacity_inactive is a
# separate prop, so set both to keep the same value when the window loses focus.
hyprctl dispatch "hl.dsp.window.set_prop({prop=\"opacity\", value=\"$new\"})" >/dev/null
hyprctl dispatch "hl.dsp.window.set_prop({prop=\"opacity_inactive\", value=\"$new\"})" >/dev/null
