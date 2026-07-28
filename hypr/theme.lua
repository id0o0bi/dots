-- Rose Pine color scheme
local colors = {
  base    = "rgb(232136)",
  surface = "rgb(2a273f)",
  overlay = "rgb(393552)",
  muted   = "rgb(6e6a86)",
  subtle  = "rgb(908caa)",
  text    = "rgb(e0def4)",
  love    = "rgb(eb6f92)",
  gold    = "rgb(f6c177)",
  rose    = "rgb(ea9a97)",
  pine    = "rgb(3e8fb0)",
  foam    = "rgb(9ccfd8)",
  iris    = "rgb(c4a7e7)",
}

-- Decoration
hl.config({
  decoration = {
    rounding     = 8,
    dim_inactive = false,

    shadow = {
      enabled      = true,
      range        = 30,
      render_power = 3,
      sharp        = false,
      color        = "rgba(1d1d1d33)",
      scale        = 1.0,
    },

    blur = {
      enabled           = true,
      size              = 18,
      passes            = 3,
      new_optimizations = true,
      noise             = 0.01,
      contrast          = 0.9,
      brightness        = 0.8,
    },
  },
})

-- Animation curves & animations
hl.curve("myBezier", {
  type   = "bezier",
  points = { {0.05, 0.9}, {0.1, 1.05} },
})

hl.animation({ leaf = "windows",     enabled = true, speed = 5,  bezier = "myBezier" })
hl.animation({ leaf = "windowsOut",  enabled = true, speed = 7,  bezier = "default", style = "popin 80%" })
hl.animation({ leaf = "border",      enabled = true, speed = 10, bezier = "default" })
hl.animation({ leaf = "fade",        enabled = true, speed = 7,  bezier = "default" })
hl.animation({ leaf = "workspaces",  enabled = true, speed = 6,  bezier = "default" })
