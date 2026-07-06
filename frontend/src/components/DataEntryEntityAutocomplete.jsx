import React from "react";
import { Autocomplete, TextField } from "@mui/material";

export function dataEntryEntityLabel(entity) {
  if (!entity) return "";
  return (
    entity.nameEn ||
    entity.name ||
    entity.nameAr ||
    entity.nameKu ||
    (entity._id != null ? String(entity._id) : "")
  );
}

export default function DataEntryEntityAutocomplete({
  label,
  options = [],
  valueId,
  onChangeId,
  disabled = false,
  required = false,
  placeholder,
  textFieldProps = {},
  sx,
}) {
  const idStr =
    valueId !== undefined && valueId !== null && valueId !== ""
      ? String(valueId)
      : "";
  const selected =
    idStr !== ""
      ? options.find((o) => String(o._id) === idStr) ?? null
      : null;
  return (
    <Autocomplete
      sx={sx}
      options={options}
      value={selected}
      onChange={(_, v) => onChangeId(v ? String(v._id) : "")}
      getOptionLabel={(o) => dataEntryEntityLabel(o)}
      isOptionEqualToValue={(o, v) => String(o._id) === String(v._id)}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          placeholder={placeholder}
          {...textFieldProps}
        />
      )}
      ListboxProps={{ style: { maxHeight: 280 } }}
    />
  );
}
