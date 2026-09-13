#!/usr/bin/env bash
# Advertise HiDPI (Xft.dpi=192) on the XWayland server so X11 apps and
# fcitx5's X11 candidate popup render at 2x to match the scale-2 desktop.
#
# Why retry: Hyprland spawns XWayland during startup, but its socket may not
# accept connections yet when this runs (usually ready within ~1-2s).
# xrdb -merge simply fails until the socket is up, so retrying it IS the wait.
# (fcitx5, the thing that consumes this, is Wayland-native and only reads X
# resources lazily on first X11 input, so timing here is not critical.)

[[ -f "$HOME/.Xresources" ]] || exit 0

for _ in {1..50}; do
    xrdb -merge "$HOME/.Xresources" 2>/dev/null && break
    sleep 0.2
done

# Force fcitx5 to re-read X resources for its X11 popup window.
fcitx5 -r -d >/dev/null 2>&1 || true
