import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Chip from '@mui/material/Chip';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(name, Label, theme) {
  return {
    fontWeight: Label.includes(name)
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular,
  };
}

export default function MultiSelectDropdown({ options, placeholder, name_colum, id_column, Label, setLabel, selectedIds, setSelectedIds,onSelect }) {
  const theme = useTheme();
  const handleDelete = (chipToDelete, event) => {
    event.stopPropagation();
    
    setLabel(prev => prev.filter(chip => chip !== chipToDelete));
    
    setSelectedIds(prevIds => {
      const foundItem = options.find(item => item[name_colum] === chipToDelete);
      return foundItem ? prevIds.filter(id => id !== foundItem[id_column]) : prevIds;
    });
  };

  return (
    <FormControl sx={{ m: 1, width: '100%' }}>
      <InputLabel id="demo-multiple-chip-label">{placeholder}</InputLabel>
      <Select
        labelId="demo-multiple-chip-label"
        multiple
        value={Label}
        onChange={onSelect}
        input={<OutlinedInput id="select-multiple-chip" label="Chip" />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map(value => (
              <Chip
                key={value}
                label={value}
                onDelete={(event) => handleDelete(value, event)}
                onMouseDown={(event) => event.stopPropagation()} // Prevent dropdown from opening
              />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {options.map((name) => (
          <MenuItem
            style={getStyles(name[name_colum], Label, theme)}
            key={name[id_column]}
            value={name[name_colum]}
          >
            {name[name_colum]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
