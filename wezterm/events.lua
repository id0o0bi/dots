local wezterm = require 'wezterm'

-- This function returns the suggested title for a tab.
-- It prefers the title that was set via `tab:set_title()`
-- or `wezterm cli set-tab-title`, but falls back to the
-- title of the active pane in that tab.
function tab_title(tab_info)
  local index = tab_info.tab_index + 1
  local title = tab_info.tab_title
  -- if the tab title is explicitly set, take that
  if title and #title > 0 then
    return index .. '.' .. title
  end
  -- Otherwise, use the title from the active pane
  -- in that tab
  return index .. '.' .. tab_info.active_pane.title
end

wezterm.on(
  'format-tab-title',
  function(tab, tabs, panes, config, hover, max_width)
    local text_color = '#808080'

    if tab.is_active then
      text_color = '#f6c177'
    elseif hover then
      text_color = '#909090'
    end

    local title = tab_title(tab)

    -- ensure that the titles fit in the available space,
    -- and that we have room for the edges.
    title = wezterm.truncate_right(title, max_width - 2)

    return {
      { Foreground = { Color = text_color } },
      { Text = ' ' },
      { Text = title },
      { Text = ' ' },
    }
  end
)

wezterm.on('padding-off', function(window, pane)
    local overrides = window:get_config_overrides() or {}
    if not overrides.window_padding then
        overrides.window_padding = {
            top    = '0',
            right  = '0',
            bottom = '0',
            left   = '0',
        }
    else
        overrides.window_padding = nil
    end
    window:set_config_overrides(overrides)
end)

wezterm.on('toggle-opacity', function(window, pane)
    local overrides = window:get_config_overrides() or {}
    if not overrides.window_background_opacity then
        overrides.window_background_opacity = 1.0
    else
        overrides.window_background_opacity = nil
    end
    window:set_config_overrides(overrides)
end)
