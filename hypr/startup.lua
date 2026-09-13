-- Autostart
-- https://wiki.hypr.land/Configuring/Basics/Autostart/

hl.on("hyprland.start", function()
  hl.exec_cmd("wbg -s /home/derren/Pictures/bing/bing.jpg")
  hl.exec_cmd("ags run")
  hl.exec_cmd("XDPH")
  -- set Xft.dpi=192 on XWayland, then (re)start fcitx5 so its X11 popup scales
  hl.exec_cmd("/home/derren/.config/hypr/scripts/xwayland-hidpi.sh")
  hl.exec_cmd("/usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1")
  -- hl.exec_cmd("nm-applet")
end)
