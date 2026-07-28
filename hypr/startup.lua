-- Autostart
-- https://wiki.hypr.land/Configuring/Basics/Autostart/

hl.on("hyprland.start", function()
  hl.exec_cmd("wbg -s /home/derren/Pictures/bing/bing.jpg")
  hl.exec_cmd("ags run")
  hl.exec_cmd("XDPH")
  hl.exec_cmd("fcitx5 -d -r")
  hl.exec_cmd("/usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1")
  -- hl.exec_cmd("nm-applet")
end)
