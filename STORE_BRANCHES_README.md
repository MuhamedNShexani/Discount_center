# Store Branches and Visibility Feature

This document describes the new features added to the store system: **branches** and **show/hide functionality**.

## Overview

The store system now supports:

1. **Multiple branches** for each store, each with a name and address
2. **Visibility control** to show/hide stores from public listings
3. **Enhanced admin interface** to manage these new features

## New Database Schema

### Store Model Updates

The `Store` model now includes two new fields:

```javascript
{
  // ... existing fields ...
  branches: [{
    name: { type: String },
    address: { type: String }
  }],
  show: { type: Boolean, default: true }
}
```

- **`branches`**: An array of branch objects, each containing:
  - `name`: Branch name (optional)
  - `address`: Branch address (optional)
- **`show`**: Boolean flag to control store visibility (default: true)

## API Endpoints

### New Endpoints

1. **GET `/api/stores/all`** - Get all stores including hidden ones (admin use)
2. **PUT `/api/stores/:id/toggle-visibility`** - Toggle store visibility

### Updated Endpoints

1. **GET `/api/stores`** - Returns all stores (including hidden ones)
2. **GET `/api/stores/visible`** - Returns only visible stores (`show: true`) - for store list page
3. **POST `/api/stores`** - Supports creating stores with branches and show status
4. **PUT `/api/stores/:id`** - Supports updating branches and show status

## Frontend Features

### Store Profile Page

- **Branches Display**: Shows all store branches with names and addresses
- **Responsive Design**: Branches are displayed differently on mobile and desktop
- **Visual Styling**: Branches are shown in styled cards with location icons

### Admin Panel

#### Store Management

- **Add/Edit Branches**: Dynamic form to add, edit, and remove branches
- **Visibility Toggle**: Checkbox to control store visibility
- **Bulk Upload Support**: Excel import now supports branches and show status

#### Store List Table

- **Branches Column**: Shows branch names in the admin table
- **Status Column**: Displays "Visible" or "Hidden" status
- **Visibility Toggle Button**: Quick toggle button in the actions column

### Store List Page (Public)

- **Filtered Display**: Only shows stores where `show: true`
- **Hidden Stores**: Hidden stores are completely excluded from public view
- **API Usage**: Uses `/api/stores/visible` endpoint to get only visible stores

### Other Pages (Main Page, Gifts, etc.)

- **All Stores**: Shows all stores including hidden ones for functionality
- **API Usage**: Uses `/api/stores` endpoint to get all stores
- **Purpose**: Hidden stores may still have products/gifts that should be discoverable

## Bulk Upload Format

The Excel bulk upload now supports the new fields:

| Column | Field       | Required | Description                                              |
| ------ | ----------- | -------- | -------------------------------------------------------- |
| A      | Name        | Yes      | Store name                                               |
| B      | Logo        | No       | Logo URL                                                 |
| C      | Address     | No       | Main store address                                       |
| D      | Phone       | No       | Store phone number                                       |
| E      | Description | No       | Store description                                        |
| F      | Show        | No       | true/false (default: true)                               |
| G      | Branches    | No       | JSON format: `[{"name":"Branch1","address":"Address1"}]` |

## Migration

### Running the Migration

To update existing stores with the new fields:

```bash
node migrations/migrate-store-branches.js
```

This will:

- Add `branches: []` to all stores that don't have it
- Add `show: true` to all stores that don't have it
- Preserve existing data

### Testing

Run the test script to verify functionality:

```bash
node test-store-branches.js
```

## Usage Examples

### Creating a Store with Branches

```javascript
const storeData = {
  name: "Multi-Branch Store",
  address: "Main Location",
  phone: "+1234567890",
  branches: [
    { name: "Downtown Branch", address: "123 Main St" },
    { name: "Uptown Branch", address: "456 Oak Ave" },
  ],
  show: true,
};
```

### Toggling Store Visibility

```javascript
// Hide a store
await storeAPI.toggleVisibility(storeId);

// Show a store
await storeAPI.toggleVisibility(storeId);
```

### Filtering Visible Stores

```javascript
// Get only visible stores (for store list page)
const visibleStores = await storeAPI.getVisible();

// Get all stores including hidden ones (for main page, admin, etc.)
const allStores = await storeAPI.getAll();

// Get all stores including hidden ones (admin API - same as getAll)
const allStoresAdmin = await storeAPI.getAllIncludingHidden();
```

## Internationalization

New translations have been added for:

- **English**: Branches, Show in Store List, Branch Name, etc.
- **Arabic**: الفروع, إظهار في قائمة الأسواق, اسم الفرع, etc.
- **Kurdish**: لقیەکان, لە لیستی فرۆشگاکاندا پیشان بدە, ناوی لق, etc.

## Security Considerations

- **Public API**: Only returns visible stores (`show: true`)
- **Admin API**: Requires proper authentication to access hidden stores
- **Visibility Toggle**: Only authenticated users can change store visibility

## Future Enhancements

Potential improvements for the future:

1. **Branch-specific products**: Products associated with specific branches
2. **Branch hours**: Operating hours for each branch
3. **Branch contact info**: Separate phone/email for each branch
4. **Branch images**: Individual images for each branch
5. **Branch ratings**: Separate ratings for each branch

## Troubleshooting

### Common Issues

1. **Branches not showing**: Ensure the store has `branches` array with data
2. **Store not visible**: Check if `show` field is set to `true`
3. **Migration errors**: Verify MongoDB connection and permissions

### Debug Commands

```javascript
// Check store structure
const store = await Store.findById(storeId);
console.log("Store branches:", store.branches);
console.log("Store visible:", store.show);

// Check all stores including hidden
const allStores = await Store.find({});
const hiddenStores = allStores.filter((s) => !s.show);
console.log("Hidden stores:", hiddenStores.length);
```

## Support

For issues or questions regarding this feature, please refer to the main project documentation or contact the development team.
