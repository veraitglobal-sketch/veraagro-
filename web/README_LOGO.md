# Logo Setup Instructions

## Logo Files

You have two logo files:
- `logo.png` - White text, transparent background (for dark backgrounds)
- `logo1.png` - Black text, transparent background (for light backgrounds)

## Where to Place Logo Files

Place both logo files in the `/web/public/` folder:

```
web/
└── public/
    ├── logo.png    (white text - for dark backgrounds)
    └── logo1.png   (black text - for light backgrounds)
```

## Current Implementation

The logos are already integrated in the code:

1. **Header** - Uses `logo1.png` (black text for light header background)
2. **Footer** - Uses `logo1.png` (black text for light footer background)

## How to Use Different Logos

If you need to use different logos based on background:

### For Light Backgrounds (current):
```tsx
<Image src="/logo1.png" alt="Bio Vera" width={120} height={40} />
```

### For Dark Backgrounds:
```tsx
<Image src="/logo.png" alt="Bio Vera" width={120} height={40} />
```

## Next Steps

1. Copy `logo.png` to `/web/public/logo.png`
2. Copy `logo1.png` to `/web/public/logo1.png`
3. The logos will automatically appear in the header and footer

## Logo Sizing

The logos are set to:
- Width: 120px (auto height to maintain aspect ratio)
- Height: 40px (display height)
- The `priority` prop is used for header logo for faster loading
